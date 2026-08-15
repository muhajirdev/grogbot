import type { Bot, ComputerStatus } from "@grogbot/contracts";
import {
  appendEvent,
  newId,
  nextSeq,
  sandboxKind,
  toBotDto,
  toComputerStatus,
} from "@grogbot/core";
import {
  bots,
  computers,
  messages,
  runs,
  tasks,
  threadMembers,
  threads,
} from "@grogbot/db";
import { ORPCError } from "@orpc/server";
import { and, desc, eq } from "drizzle-orm";
import type { RpcContext } from "./context.js";
import type { Actor } from "./session.js";

export async function getOffice(
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
  const [thread] = await context.db
    .select()
    .from(threads)
    .where(eq(threads.botId, bot.id))
    .limit(1);
  if (!thread)
    throw new ORPCError("NOT_FOUND", { message: "Office thread missing" });
  return { bot, thread };
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
  const offices = await context.db
    .select()
    .from(threads)
    .where(eq(threads.workspaceId, actor.workspaceId));
  const threadByBot = new Map(offices.map((row) => [row.botId, row.id]));
  return rows.flatMap((bot) => {
    const threadId = threadByBot.get(bot.id);
    return threadId ? [toBotDto(bot, threadId)] : [];
  });
}

export async function createOfficeBot(
  context: RpcContext,
  actor: Actor,
  input: {
    name: string;
    title: string;
    description: string;
    instructions: string;
    avatarColor: string;
    avatarShape: string;
  },
): Promise<Bot> {
  const botId = newId();
  const threadId = newId();
  const computerId = newId();
  const now = new Date();
  await context.db.insert(bots).values({
    id: botId,
    workspaceId: actor.workspaceId,
    userId: actor.userId,
    name: input.name,
    title: input.title,
    description: input.description,
    instructions: input.instructions,
    avatarColor: input.avatarColor,
    avatarShape: input.avatarShape,
    createdAt: now,
    updatedAt: now,
  });
  await context.db.insert(threads).values({
    id: threadId,
    workspaceId: actor.workspaceId,
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
  await context.db.insert(computers).values({
    id: computerId,
    workspaceId: actor.workspaceId,
    botId,
    userId: actor.userId,
    kind: sandboxKind(context.env.sandboxProvider),
    state: "stopped",
    controlHolder: "none",
    createdAt: now,
    updatedAt: now,
  });
  const [bot] = await context.db
    .select()
    .from(bots)
    .where(eq(bots.id, botId))
    .limit(1);
  if (!bot)
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      message: "Bot create failed",
    });
  return toBotDto(bot, threadId);
}

export async function updateOfficeBot(
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
  },
): Promise<Bot> {
  const { bot, thread } = await getOffice(context, actor, input.botId);
  await context.db
    .update(bots)
    .set({
      name: input.name ?? bot.name,
      title: input.title ?? bot.title,
      description: input.description ?? bot.description,
      instructions: input.instructions ?? bot.instructions,
      avatarColor: input.avatarColor ?? bot.avatarColor,
      avatarShape: input.avatarShape ?? bot.avatarShape,
      updatedAt: new Date(),
    })
    .where(eq(bots.id, bot.id));
  const [updated] = await context.db
    .select()
    .from(bots)
    .where(eq(bots.id, bot.id))
    .limit(1);
  if (!updated) throw new ORPCError("NOT_FOUND", { message: "Bot not found" });
  return toBotDto(updated, thread.id);
}

export async function getComputer(
  context: RpcContext,
  actor: Actor,
  botId: string,
): Promise<ComputerStatus> {
  await getOffice(context, actor, botId);
  const [row] = await context.db
    .select()
    .from(computers)
    .where(eq(computers.botId, botId))
    .limit(1);
  if (!row) throw new ORPCError("NOT_FOUND", { message: "Computer not found" });
  return toComputerStatus(row);
}

export async function setComputerControl(
  context: RpcContext,
  actor: Actor,
  botId: string,
  holder: "user" | "bot" | "none",
): Promise<ComputerStatus> {
  const { bot, thread } = await getOffice(context, actor, botId);
  await context.db
    .update(computers)
    .set({
      controlHolder: holder,
      controlHolderId:
        holder === "none" ? null : holder === "user" ? actor.userId : bot.id,
      state: holder === "none" ? "running" : "running",
      updatedAt: new Date(),
    })
    .where(eq(computers.botId, botId));
  const status = await getComputer(context, actor, botId);
  await appendEvent(context.db, {
    workspaceId: actor.workspaceId,
    threadId: thread.id,
    botId,
    type: "computer.updated",
    payload: status as unknown as Record<string, unknown>,
  });
  return status;
}

export async function sendMessage(
  context: RpcContext,
  actor: Actor,
  botId: string,
  text: string,
) {
  const { bot, thread } = await getOffice(context, actor, botId);
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
  await context.db
    .update(computers)
    .set({
      state: "booting",
      controlHolder: "bot",
      controlHolderId: bot.id,
      updatedAt: new Date(),
    })
    .where(eq(computers.botId, bot.id));
  const status = await getComputer(context, actor, botId);
  await appendEvent(context.db, {
    workspaceId: actor.workspaceId,
    threadId: thread.id,
    botId: bot.id,
    type: "computer.updated",
    payload: status as unknown as Record<string, unknown>,
    runId,
  });
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
  const { thread } = await getOffice(context, actor, botId);
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
}
