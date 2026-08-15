import type { AgentRuntime } from "@grogbot/adapter-kit";
import type { MessageBlock, RunStatus } from "@grogbot/contracts";
import {
  bots,
  computers,
  type Database,
  messages,
  runs,
  tasks,
  threads,
} from "@grogbot/db";
import { and, asc, eq } from "drizzle-orm";
import type { GuestHub } from "./guest-hub.js";
import { GuestAgentRuntime } from "./guest-runtime.js";
import { newId } from "./ids.js";
import { appendEvent, nextSeq, toComputerStatus } from "./office.js";
import { assertTransition } from "./run-state.js";

async function setRunStatus(
  db: Database,
  run: typeof runs.$inferSelect,
  status: RunStatus,
  extra: Partial<typeof runs.$inferInsert> = {},
): Promise<typeof runs.$inferSelect> {
  assertTransition(run.status as RunStatus, status);
  const [updated] = await db
    .update(runs)
    .set({ status, updatedAt: new Date(), ...extra })
    .where(eq(runs.id, run.id))
    .returning();
  if (!updated) throw new Error("Run missing after update");
  return updated;
}

export async function continueRun(opts: {
  db: Database;
  runtime: AgentRuntime;
  runId: string;
  guests?: GuestHub;
}): Promise<void> {
  const { db, runtime, runId, guests } = opts;
  const [run] = await db.select().from(runs).where(eq(runs.id, runId)).limit(1);
  if (!run) return;
  if (run.status !== "queued") return;

  const [bot] = await db
    .select()
    .from(bots)
    .where(eq(bots.id, run.botId))
    .limit(1);
  if (!bot) return;

  const guestEnabled = bot.guestKind !== "off";
  if (guestEnabled && !guests?.isOnline(bot.id)) {
    await appendEvent(db, {
      workspaceId: run.workspaceId,
      threadId: run.threadId,
      botId: run.botId,
      type: "run.updated",
      payload: {
        runId,
        status: "queued",
        text: `waiting for ${bot.guestKind}…`,
      },
      runId,
    });
    return;
  }

  let current = await setRunStatus(db, run, "leased", {
    leaseOwner: "worker",
    leaseFence: run.leaseFence + 1,
    leaseExpiresAt: new Date(Date.now() + 60_000),
  });
  current = await setRunStatus(db, current, "running", {
    startedAt: new Date(),
  });

  const [task] = await db
    .select()
    .from(tasks)
    .where(eq(tasks.id, run.taskId))
    .limit(1);
  const [thread] = await db
    .select()
    .from(threads)
    .where(eq(threads.id, run.threadId))
    .limit(1);
  if (!task || !thread) return;

  await db
    .update(computers)
    .set({
      state: "running",
      controlHolder: "bot",
      controlHolderId: bot.id,
      updatedAt: new Date(),
    })
    .where(eq(computers.botId, bot.id));
  const [computer] = await db
    .select()
    .from(computers)
    .where(eq(computers.botId, bot.id))
    .limit(1);
  if (computer) {
    await appendEvent(db, {
      workspaceId: run.workspaceId,
      threadId: run.threadId,
      botId: run.botId,
      type: "computer.updated",
      payload: toComputerStatus(computer) as unknown as Record<string, unknown>,
      runId,
    });
  }

  await appendEvent(db, {
    workspaceId: run.workspaceId,
    threadId: run.threadId,
    botId: run.botId,
    type: "run.updated",
    payload: { runId, status: "running", text: "working…" },
    runId,
  });

  const historyRows = await db
    .select()
    .from(messages)
    .where(eq(messages.threadId, run.threadId))
    .orderBy(asc(messages.seq));

  const history = historyRows.map((row) => {
    const blocks = row.blocks as MessageBlock[];
    const text = blocks
      .filter(
        (block): block is { kind: "text"; text: string } =>
          block.kind === "text",
      )
      .map((block) => block.text)
      .join("\n");
    const role =
      row.actorType === "human"
        ? ("user" as const)
        : row.actorType === "bot"
          ? ("assistant" as const)
          : ("system" as const);
    return { role, content: text };
  });

  const controller = new AbortController();
  let reply = "";
  const runner =
    guestEnabled && guests ? new GuestAgentRuntime(guests) : runtime;
  try {
    for await (const event of runner.run(
      {
        botId: bot.id,
        threadId: thread.id,
        runId,
        prompt: task.prompt,
        instructions: bot.instructions || bot.description,
        history,
      },
      {
        operationId: newId(),
        workspaceId: run.workspaceId,
        userId: run.userId,
        botId: bot.id,
        runId,
        signal: controller.signal,
      },
    )) {
      if (event.type === "progress") {
        await appendEvent(db, {
          workspaceId: run.workspaceId,
          threadId: run.threadId,
          botId: run.botId,
          type: "run.updated",
          payload: { runId, status: "running", text: event.text },
          runId,
        });
      }
      if (event.type === "text" && event.text) reply = event.text;
      if (event.type === "done" && event.text && !reply) reply = event.text;
      if (event.type === "error") throw new Error(event.text);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Run failed";
    await setRunStatus(db, current, "failed", {
      error: message,
      completedAt: new Date(),
    });
    await appendEvent(db, {
      workspaceId: run.workspaceId,
      threadId: run.threadId,
      botId: run.botId,
      type: "run.updated",
      payload: { runId, status: "failed", text: message },
      runId,
    });
    return;
  }

  const [fresh] = await db
    .select()
    .from(runs)
    .where(eq(runs.id, runId))
    .limit(1);
  if (fresh?.status === "cancelled") return;

  const seq = await nextSeq(db, messages, run.threadId);
  const assistantId = newId();
  const blocks: MessageBlock[] = [{ kind: "text", text: reply || "Done." }];
  await db.insert(messages).values({
    id: assistantId,
    threadId: run.threadId,
    seq,
    actorType: "bot",
    actorId: bot.id,
    blocks,
    runId,
  });
  await appendEvent(db, {
    workspaceId: run.workspaceId,
    threadId: run.threadId,
    botId: run.botId,
    type: "message.created",
    payload: {
      id: assistantId,
      seq,
      actorType: "bot",
      actorId: bot.id,
      blocks,
      runId,
      createdAt: new Date().toISOString(),
    },
    runId,
  });

  await setRunStatus(db, current, "completed", { completedAt: new Date() });
  await db
    .update(tasks)
    .set({ status: "completed", updatedAt: new Date() })
    .where(eq(tasks.id, task.id));
  await appendEvent(db, {
    workspaceId: run.workspaceId,
    threadId: run.threadId,
    botId: run.botId,
    type: "run.updated",
    payload: { runId, status: "completed", text: reply },
    runId,
  });
}

export async function sleepComputer(
  db: Database,
  botId: string,
): Promise<void> {
  const [computer] = await db
    .select()
    .from(computers)
    .where(eq(computers.botId, botId))
    .limit(1);
  if (!computer) return;
  if (computer.controlHolder === "user") return;
  const [active] = await db
    .select()
    .from(runs)
    .where(and(eq(runs.botId, botId), eq(runs.status, "running")))
    .limit(1);
  if (active) return;
  await db
    .update(computers)
    .set({
      state: "stopped",
      controlHolder: "none",
      controlHolderId: null,
      updatedAt: new Date(),
    })
    .where(eq(computers.botId, botId));
  const [thread] = await db
    .select()
    .from(threads)
    .where(eq(threads.botId, botId))
    .limit(1);
  const [updated] = await db
    .select()
    .from(computers)
    .where(eq(computers.botId, botId))
    .limit(1);
  if (thread && updated) {
    await appendEvent(db, {
      workspaceId: updated.workspaceId,
      threadId: thread.id,
      botId,
      type: "computer.updated",
      payload: toComputerStatus(updated) as unknown as Record<string, unknown>,
    });
  }
}
