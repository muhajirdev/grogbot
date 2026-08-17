import { isOfflineAgentRuntime } from "@grogbot/adapters/edge";
import {
  type Bot,
  type ComputerListItem,
  type ComputerStatus,
  DEFAULT_COMPUTER_NAME,
  type Routine,
  validateModelId,
} from "@grogbot/contracts";
import {
  appendEvent,
  computerStatusForBot,
  encryptionSecret,
  fanoutComputerUpdated,
  getBotComputer,
  getHomeThread,
  missingModelMessage,
  newId,
  nextSeq,
  previewFromBlocks,
  resolveRunModel,
  sandboxKind,
  toBotDto,
  toComputerListItem,
  toRoutineDto,
  tryClaimComputer,
} from "@grogbot/core";
import {
  bots,
  computers,
  guestConnectors,
  messages,
  routines,
  runs,
  tasks,
  threadMembers,
  threads,
} from "@grogbot/db";
import { ORPCError } from "@orpc/server";
import { and, count, desc, eq, inArray, isNull } from "drizzle-orm";
import type { RpcContext } from "./context.js";
import { agentRuntimeSource } from "./env.js";
import type { Actor } from "./session.js";

const STALE_MS = 60_000;

function connectorOnline(
  row:
    | {
        online: boolean;
        revokedAt: Date | null;
        lastSeenAt: Date | null;
      }
    | undefined,
): boolean {
  if (!row || row.revokedAt || !row.online || !row.lastSeenAt) return false;
  return Date.now() - row.lastSeenAt.getTime() < STALE_MS;
}

export async function getBotThread(
  context: RpcContext,
  actor: Actor,
  botId: string,
) {
  const [bot] = await context.db
    .select()
    .from(bots)
    .where(and(eq(bots.id, botId), eq(bots.workspaceId, actor.workspaceId)))
    .limit(1);
  if (!bot) throw new ORPCError("NOT_FOUND", { message: "Bot not found" });
  const thread = await getHomeThread(context.db, bot);
  if (!thread) throw new ORPCError("NOT_FOUND", { message: "Thread missing" });
  return { bot, thread };
}

function assertBotActive(bot: { archivedAt: Date | null }) {
  if (bot.archivedAt) {
    throw new ORPCError("PRECONDITION_FAILED", {
      message: "This teammate is archived.",
    });
  }
}

export async function listBots(
  context: RpcContext,
  actor: Actor,
): Promise<Bot[]> {
  const rows = await context.db
    .select()
    .from(bots)
    .where(eq(bots.workspaceId, actor.workspaceId))
    .orderBy(desc(bots.updatedAt));
  const threadRows = await context.db
    .select()
    .from(threads)
    .where(eq(threads.workspaceId, actor.workspaceId));
  const threadByBot = new Map(
    rows
      .filter((bot) => bot.homeThreadId)
      .map((bot) => [bot.id, bot.homeThreadId as string]),
  );
  for (const row of threadRows) {
    if (row.kind !== "office" || !row.botId || threadByBot.has(row.botId)) {
      continue;
    }
    threadByBot.set(row.botId, row.id);
  }
  const desks =
    rows.length === 0
      ? []
      : await context.db
          .select()
          .from(computers)
          .where(
            inArray(computers.id, [
              ...new Set(rows.map((row) => row.computerId)),
            ]),
          );
  const nameByComputer = new Map(desks.map((row) => [row.id, row.name]));
  const connectors =
    rows.length === 0
      ? []
      : await context.db
          .select()
          .from(guestConnectors)
          .where(
            inArray(
              guestConnectors.botId,
              rows.map((row) => row.id),
            ),
          );
  const onlineByBot = new Map(
    connectors.map((row) => [row.botId, connectorOnline(row)]),
  );
  const threadIds = [...threadByBot.values()];
  const lastByThread = new Map<string, { preview: string; at: Date }>();
  if (threadIds.length > 0) {
    const recent = await context.db
      .select({
        threadId: messages.threadId,
        blocks: messages.blocks,
        createdAt: messages.createdAt,
      })
      .from(messages)
      .where(inArray(messages.threadId, threadIds))
      .orderBy(desc(messages.createdAt));
    for (const row of recent) {
      if (lastByThread.has(row.threadId)) continue;
      lastByThread.set(row.threadId, {
        preview: previewFromBlocks(row.blocks),
        at: row.createdAt,
      });
    }
  }
  return rows.flatMap((bot) => {
    const threadId = threadByBot.get(bot.id);
    if (!threadId) return [];
    const last = lastByThread.get(threadId);
    return [
      toBotDto(bot, threadId, {
        online: onlineByBot.get(bot.id),
        computerName: nameByComputer.get(bot.computerId),
        lastPreview: last?.preview,
        lastAt: last?.at,
      }),
    ];
  });
}

async function insertComputer(
  context: RpcContext,
  actor: Actor,
  input: { name: string; isDefault: boolean },
) {
  const id = newId();
  const now = new Date();
  const [row] = await context.db
    .insert(computers)
    .values({
      id,
      workspaceId: actor.workspaceId,
      userId: actor.userId,
      name: input.name,
      isDefault: input.isDefault,
      kind: sandboxKind(context.env.sandboxProvider),
      state: "stopped",
      controlHolder: "none",
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  if (!row)
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      message: "Computer create failed",
    });
  return row;
}

async function resolveComputer(
  context: RpcContext,
  actor: Actor,
  choice: "default" | "new" | string,
) {
  if (choice === "new") {
    const existing = await context.db
      .select({ n: count() })
      .from(computers)
      .where(eq(computers.workspaceId, actor.workspaceId));
    const n = Number(existing[0]?.n ?? 0);
    return insertComputer(context, actor, {
      name: n === 0 ? DEFAULT_COMPUTER_NAME : `Computer ${n + 1}`,
      isDefault: n === 0,
    });
  }
  if (choice !== "default") {
    const [row] = await context.db
      .select()
      .from(computers)
      .where(
        and(
          eq(computers.id, choice),
          eq(computers.workspaceId, actor.workspaceId),
        ),
      )
      .limit(1);
    if (!row)
      throw new ORPCError("NOT_FOUND", { message: "Computer not found" });
    return row;
  }
  const [desk] = await context.db
    .select()
    .from(computers)
    .where(
      and(
        eq(computers.workspaceId, actor.workspaceId),
        eq(computers.isDefault, true),
      ),
    )
    .limit(1);
  if (desk) return desk;
  return insertComputer(context, actor, {
    name: DEFAULT_COMPUTER_NAME,
    isDefault: true,
  });
}

export async function listComputers(
  context: RpcContext,
  actor: Actor,
): Promise<ComputerListItem[]> {
  const rows = await context.db
    .select()
    .from(computers)
    .where(eq(computers.workspaceId, actor.workspaceId))
    .orderBy(desc(computers.isDefault), desc(computers.createdAt));
  if (rows.length === 0) return [];
  const counts = await context.db
    .select({ computerId: bots.computerId, n: count() })
    .from(bots)
    .where(
      and(
        inArray(
          bots.computerId,
          rows.map((row) => row.id),
        ),
        isNull(bots.archivedAt),
      ),
    )
    .groupBy(bots.computerId);
  const nById = new Map(counts.map((row) => [row.computerId, Number(row.n)]));
  return rows.map((row) => toComputerListItem(row, nById.get(row.id) ?? 0));
}

export async function createBot(
  context: RpcContext,
  actor: Actor,
  input: {
    name: string;
    title?: string;
    description: string;
    instructions: string;
    avatarColor: string;
    avatarShape: string;
    computer?: "default" | "new" | string;
  },
): Promise<Bot> {
  const computer = await resolveComputer(
    context,
    actor,
    input.computer ?? "default",
  );
  const botId = newId();
  const threadId = newId();
  const now = new Date();
  await context.db.insert(bots).values({
    id: botId,
    workspaceId: actor.workspaceId,
    userId: actor.userId,
    computerId: computer.id,
    name: input.name,
    title: input.title?.trim() ?? "",
    description: input.description,
    instructions: input.instructions,
    avatarColor: input.avatarColor,
    avatarShape: input.avatarShape,
    guestKind: "off",
    createdAt: now,
    updatedAt: now,
  });
  await context.db.insert(threads).values({
    id: threadId,
    workspaceId: actor.workspaceId,
    kind: "office",
    botId,
    createdAt: now,
  });
  await context.db.insert(threadMembers).values({
    id: newId(),
    threadId,
    userId: actor.userId,
    role: "owner",
    createdAt: now,
  });
  await context.db
    .update(bots)
    .set({ homeThreadId: threadId, updatedAt: now })
    .where(eq(bots.id, botId));
  const [bot] = await context.db
    .select()
    .from(bots)
    .where(eq(bots.id, botId))
    .limit(1);
  if (!bot)
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      message: "Bot create failed",
    });
  return toBotDto(bot, threadId, { computerName: computer.name });
}

export async function updateBot(
  context: RpcContext,
  actor: Actor,
  input: {
    botId: string;
    name?: string;
    title?: string;
    description?: string;
    instructions?: string;
    avatarColor?: string;
    avatarShape?: string;
    model?: string;
  },
): Promise<Bot> {
  const { bot, thread } = await getBotThread(context, actor, input.botId);
  const model = input.model !== undefined ? input.model.trim() : bot.model;
  if (input.model !== undefined && model) {
    const problem = validateModelId(model);
    if (problem) throw new ORPCError("BAD_REQUEST", { message: problem });
  }
  await context.db
    .update(bots)
    .set({
      name: input.name ?? bot.name,
      title: input.title !== undefined ? input.title.trim() : bot.title,
      description: input.description ?? bot.description,
      instructions: input.instructions ?? bot.instructions,
      avatarColor: input.avatarColor ?? bot.avatarColor,
      avatarShape: input.avatarShape ?? bot.avatarShape,
      model,
      updatedAt: new Date(),
    })
    .where(eq(bots.id, bot.id));
  const [updated] = await context.db
    .select()
    .from(bots)
    .where(eq(bots.id, bot.id))
    .limit(1);
  if (!updated) throw new ORPCError("NOT_FOUND", { message: "Bot not found" });
  const computer = await getBotComputer(context.db, updated);
  return toBotDto(updated, thread.id, { computerName: computer?.name });
}

async function botDto(
  context: RpcContext,
  bot: typeof bots.$inferSelect,
  threadId: string,
): Promise<Bot> {
  const computer = await getBotComputer(context.db, bot);
  return toBotDto(bot, threadId, { computerName: computer?.name });
}

export async function archiveBot(
  context: RpcContext,
  actor: Actor,
  botId: string,
): Promise<Bot> {
  const { bot, thread } = await getBotThread(context, actor, botId);
  if (bot.archivedAt) return botDto(context, bot, thread.id);
  await stopBotRuns(context, actor, botId);
  const computer = await getBotComputer(context.db, bot);
  if (
    computer &&
    computer.controlHolder === "bot" &&
    computer.controlHolderId === bot.id
  ) {
    await setComputerControl(context, actor, botId, "none");
  }
  const now = new Date();
  const [updated] = await context.db
    .update(bots)
    .set({ archivedAt: now, updatedAt: now })
    .where(eq(bots.id, bot.id))
    .returning();
  if (!updated) throw new ORPCError("NOT_FOUND", { message: "Bot not found" });
  return botDto(context, updated, thread.id);
}

export async function unarchiveBot(
  context: RpcContext,
  actor: Actor,
  botId: string,
): Promise<Bot> {
  const { bot, thread } = await getBotThread(context, actor, botId);
  if (!bot.archivedAt) return botDto(context, bot, thread.id);
  const now = new Date();
  const [updated] = await context.db
    .update(bots)
    .set({ archivedAt: null, updatedAt: now })
    .where(eq(bots.id, bot.id))
    .returning();
  if (!updated) throw new ORPCError("NOT_FOUND", { message: "Bot not found" });
  return botDto(context, updated, thread.id);
}

export async function getComputer(
  context: RpcContext,
  actor: Actor,
  botId: string,
): Promise<ComputerStatus> {
  const { bot } = await getBotThread(context, actor, botId);
  const row = await getBotComputer(context.db, bot);
  if (!row) throw new ORPCError("NOT_FOUND", { message: "Computer not found" });
  return computerStatusForBot(context.db, row, bot.id);
}

export async function setComputerControl(
  context: RpcContext,
  actor: Actor,
  botId: string,
  holder: "user" | "bot" | "none",
): Promise<ComputerStatus> {
  const { bot } = await getBotThread(context, actor, botId);
  if (holder !== "none") assertBotActive(bot);
  const row = await getBotComputer(context.db, bot);
  if (!row) throw new ORPCError("NOT_FOUND", { message: "Computer not found" });
  const [updated] = await context.db
    .update(computers)
    .set({
      controlHolder: holder,
      controlHolderId:
        holder === "none" ? null : holder === "user" ? actor.userId : bot.id,
      state: "running",
      updatedAt: new Date(),
    })
    .where(eq(computers.id, row.id))
    .returning();
  if (!updated)
    throw new ORPCError("NOT_FOUND", { message: "Computer not found" });
  return fanoutComputerUpdated(context.db, updated, bot.id);
}

export async function sendMessage(
  context: RpcContext,
  actor: Actor,
  botId: string,
  text: string,
) {
  const { bot, thread } = await getBotThread(context, actor, botId);
  assertBotActive(bot);
  if (!isOfflineAgentRuntime(context.env.agentRuntime)) {
    const overlay = await resolveRunModel(
      context.db,
      bot,
      agentRuntimeSource(context.env),
      encryptionSecret(
        {
          ENCRYPTION_KEY: context.env.encryptionKey,
          BETTER_AUTH_SECRET: context.env.authSecret,
        },
        context.env.production,
      ),
    );
    if (!overlay.configured) {
      throw new ORPCError("PRECONDITION_FAILED", {
        message: missingModelMessage(overlay.model),
      });
    }
  }
  const seq = await nextSeq(context.db, messages, thread.id);
  const messageId = newId();
  const taskId = newId();
  const runId = newId();
  const blocks = [{ kind: "text" as const, text }];

  await context.db.insert(messages).values({
    id: messageId,
    threadId: thread.id,
    seq,
    actorType: "human",
    actorId: actor.userId,
    blocks,
  });
  await appendEvent(context.db, {
    workspaceId: actor.workspaceId,
    threadId: thread.id,
    botId: bot.id,
    type: "message.created",
    payload: {
      id: messageId,
      seq,
      actorType: "human",
      actorId: actor.userId,
      blocks,
      runId,
      createdAt: new Date().toISOString(),
    },
    runId,
  });

  await context.db.insert(tasks).values({
    id: taskId,
    workspaceId: actor.workspaceId,
    botId: bot.id,
    threadId: thread.id,
    userId: actor.userId,
    prompt: text,
    status: "queued",
  });
  await context.db.insert(runs).values({
    id: runId,
    workspaceId: actor.workspaceId,
    botId: bot.id,
    threadId: thread.id,
    taskId,
    userId: actor.userId,
    status: "queued",
    trigger: "user",
  });
  const computer = await getBotComputer(context.db, bot);
  if (computer) {
    const claimed = await tryClaimComputer(
      context.db,
      computer,
      bot.id,
      "booting",
    );
    await fanoutComputerUpdated(context.db, claimed.computer, bot.id, runId);
  }
  await appendEvent(context.db, {
    workspaceId: actor.workspaceId,
    threadId: thread.id,
    botId: bot.id,
    type: "run.updated",
    payload: { runId, status: "queued", text: "working…" },
    runId,
  });

  await context.wakeup.enqueue({
    botId: bot.id,
    name: "run.continue",
    payload: { botId: bot.id, runId, taskId },
  });

  return { taskId, runId, seq };
}

export async function stopBotRuns(
  context: RpcContext,
  actor: Actor,
  botId: string,
): Promise<void> {
  const { thread } = await getBotThread(context, actor, botId);
  const active = await context.db
    .select()
    .from(runs)
    .where(and(eq(runs.botId, botId), eq(runs.status, "running")));
  const queued = await context.db
    .select()
    .from(runs)
    .where(and(eq(runs.botId, botId), eq(runs.status, "queued")));
  for (const run of [...active, ...queued]) {
    await context.db
      .update(runs)
      .set({
        status: "cancelled",
        updatedAt: new Date(),
        completedAt: new Date(),
      })
      .where(eq(runs.id, run.id));
    await appendEvent(context.db, {
      workspaceId: actor.workspaceId,
      threadId: thread.id,
      botId,
      type: "run.updated",
      payload: { runId: run.id, status: "cancelled", text: "stopped" },
      runId: run.id,
    });
  }
  context.guests.abort(botId);
  await context.wakeup.enqueue({
    botId,
    name: "run.abort",
    payload: {
      botId,
      runIds: [...active, ...queued].map((run) => run.id),
    },
  });
}

export async function listRoutines(
  context: RpcContext,
  actor: Actor,
  botId: string,
): Promise<Routine[]> {
  await getBotThread(context, actor, botId);
  const rows = await context.db
    .select()
    .from(routines)
    .where(
      and(
        eq(routines.botId, botId),
        eq(routines.workspaceId, actor.workspaceId),
      ),
    )
    .orderBy(desc(routines.createdAt));
  return rows.map(toRoutineDto);
}

export async function createRoutine(
  context: RpcContext,
  actor: Actor,
  input: {
    botId: string;
    name: string;
    prompt: string;
    cron: string;
    timezone?: string;
  },
): Promise<Routine> {
  const { bot } = await getBotThread(context, actor, input.botId);
  assertBotActive(bot);
  const now = new Date();
  const [row] = await context.db
    .insert(routines)
    .values({
      id: newId(),
      workspaceId: actor.workspaceId,
      botId: input.botId,
      userId: actor.userId,
      name: input.name.trim(),
      prompt: input.prompt.trim(),
      cron: input.cron.trim(),
      timezone: input.timezone?.trim() || "UTC",
      active: true,
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  if (!row)
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      message: "Routine create failed",
    });
  return toRoutineDto(row);
}
