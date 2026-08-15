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

export function toBotDto(
  bot: typeof bots.$inferSelect,
  threadId: string,
  extras?: { computerName?: string },
): Bot {
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
    computerId: bot.computerId,
    computerName: extras?.computerName ?? "Desk",
    createdAt: bot.createdAt.toISOString(),
    updatedAt: bot.updatedAt.toISOString(),
  };
}

export function toComputerStatus(
  row: typeof computers.$inferSelect,
  extras: {
    viewingBotId: string;
    usingBotId?: string | null;
    usingBotName?: string | null;
    teammates?: Array<{ id: string; name: string }>;
  },
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
    id: row.id,
    name: row.name,
    isDefault: row.isDefault,
    botId: extras.viewingBotId,
    kind: sandboxKind(row.kind),
    state,
    controlHolder: holder.success ? holder.data : "none",
    controlHolderId: row.controlHolderId,
    usingBotId: extras.usingBotId ?? null,
    usingBotName: extras.usingBotName ?? null,
    teammates: extras.teammates ?? [],
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
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const seq = await nextSeq(db, events, input.threadId);
    const id = crypto.randomUUID();
    try {
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
    } catch (error) {
      if (!isUniqueSeqConflict(error) || attempt === 7) throw error;
    }
  }
  throw new Error("Failed to append event");
}

function isUniqueSeqConflict(error: unknown): boolean {
  let current: unknown = error;
  for (let i = 0; i < 4 && current && typeof current === "object"; i += 1) {
    const code = "code" in current ? current.code : undefined;
    const constraint =
      "constraint_name" in current ? current.constraint_name : undefined;
    if (code === "23505") return true;
    if (
      constraint === "events_thread_seq" ||
      constraint === "messages_thread_seq"
    )
      return true;
    current = "cause" in current ? current.cause : undefined;
  }
  return false;
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
