import type {
  Bot,
  ComputerStatus,
  ProductEvent,
  SandboxKind,
} from "@grogbot/contracts";
import {
  AvatarShape,
  ControlHolder,
  SandboxKind as SandboxKindSchema,
} from "@grogbot/contracts";
import {
  type bots,
  type computers,
  type Database,
  events,
  type messages,
} from "@grogbot/db";
import { and, asc, desc, eq, gt } from "drizzle-orm";

export function iso(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

export function sandboxKind(value: string): SandboxKind {
  const parsed = SandboxKindSchema.safeParse(value);
  return parsed.success ? parsed.data : "fake";
}

export function toBotDto(bot: typeof bots.$inferSelect, threadId: string): Bot {
  const shape = AvatarShape.safeParse(bot.avatarShape);
  return {
    id: bot.id,
    workspaceId: bot.workspaceId,
    name: bot.name,
    title: bot.title,
    description: bot.description,
    instructions: bot.instructions,
    avatarColor: bot.avatarColor,
    avatarShape: shape.success ? shape.data : "circle",
    parentBotId: bot.parentBotId,
    threadId,
    createdAt: bot.createdAt.toISOString(),
    updatedAt: bot.updatedAt.toISOString(),
  };
}

export function toComputerStatus(
  row: typeof computers.$inferSelect,
): ComputerStatus {
  const holder = ControlHolder.safeParse(row.controlHolder);
  const states: ComputerStatus["state"][] = [
    "stopped",
    "booting",
    "running",
    "suspended",
    "error",
  ];
  const state = states.find((value) => value === row.state) ?? "stopped";
  return {
    botId: row.botId,
    kind: sandboxKind(row.kind),
    state,
    controlHolder: holder.success ? holder.data : "none",
    controlHolderId: row.controlHolderId,
    screenAvailable: state === "running" || state === "booting",
  };
}

export function toProductEvent(row: typeof events.$inferSelect): ProductEvent {
  return {
    type: row.type,
    threadId: row.threadId,
    botId: row.botId,
    runId: row.runId,
    seq: row.seq,
    payload: row.payload,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function nextSeq(
  db: Database,
  table: typeof messages | typeof events,
  threadId: string,
): Promise<number> {
  const [row] = await db
    .select({ seq: table.seq })
    .from(table)
    .where(eq(table.threadId, threadId))
    .orderBy(desc(table.seq))
    .limit(1);
  return (row?.seq ?? 0) + 1;
}

export async function appendEvent(
  db: Database,
  input: {
    workspaceId: string;
    threadId: string;
    botId: string;
    type: string;
    payload: Record<string, unknown>;
    runId?: string | null;
  },
): Promise<ProductEvent> {
  const seq = await nextSeq(db, events, input.threadId);
  const id = crypto.randomUUID();
  const [row] = await db
    .insert(events)
    .values({
      id,
      workspaceId: input.workspaceId,
      threadId: input.threadId,
      botId: input.botId,
      seq,
      type: input.type,
      payload: input.payload,
      runId: input.runId ?? null,
    })
    .returning();
  if (!row) throw new Error("Failed to append event");
  return toProductEvent(row);
}

export async function listEventsAfter(
  db: Database,
  threadId: string,
  cursor: number,
  limit = 80,
): Promise<ProductEvent[]> {
  const rows = await db
    .select()
    .from(events)
    .where(and(eq(events.threadId, threadId), gt(events.seq, cursor)))
    .orderBy(asc(events.seq))
    .limit(limit);
  return rows.map(toProductEvent);
}
