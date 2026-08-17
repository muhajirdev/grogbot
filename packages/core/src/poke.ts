import type { PokeTeammate } from "@grogbot/adapter-kit";
import type { MessageBlock, ThreadMessage } from "@grogbot/contracts";
import {
  bots,
  type Database,
  messages,
  runs,
  tasks,
  threadMembers,
  threads,
} from "@grogbot/db";
import { and, asc, eq, isNull } from "drizzle-orm";
import { newId } from "./ids.js";
import { appendThreadMessage, iso } from "./threads.js";

export const MAX_POKE_DEPTH = 2;

export class PokeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PokeError";
  }
}

export type PokeRosterRow = {
  id: string;
  name: string;
  title: string;
  archivedAt: Date | null;
};

export type PokeThreadView = {
  id: string;
  kind: "poke";
  bots: Array<{ id: string; name: string; title: string }>;
  messages: ThreadMessage[];
};

/** Stable pair key so Maya↔Lookout is one thread either direction. */
export function pokePairIds(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

export function resolvePokeTarget(
  roster: PokeRosterRow[],
  fromBotId: string,
  nameOrId: string,
): PokeRosterRow {
  const needle = nameOrId.trim().toLowerCase();
  if (!needle) throw new PokeError("Name a teammate to poke.");
  const live = roster.filter((row) => !row.archivedAt);
  const match =
    live.find((row) => row.id === nameOrId.trim()) ??
    live.find((row) => row.name.toLowerCase() === needle);
  if (!match) {
    const archived = roster.find(
      (row) =>
        Boolean(row.archivedAt) &&
        (row.id === nameOrId.trim() || row.name.toLowerCase() === needle),
    );
    if (archived) throw new PokeError(`${archived.name} is archived.`);
    const names = live
      .filter((row) => row.id !== fromBotId)
      .map((row) => row.name);
    const hint = names.length > 0 ? ` Available: ${names.join(", ")}.` : "";
    throw new PokeError(`No teammate named ${nameOrId.trim()}.${hint}`);
  }
  if (match.id === fromBotId) {
    throw new PokeError("You cannot poke yourself.");
  }
  return match;
}

export async function listPokeTeammates(
  db: Database,
  fromBot: { id: string; workspaceId: string },
): Promise<PokeTeammate[]> {
  const rows = await db
    .select({
      id: bots.id,
      name: bots.name,
      title: bots.title,
    })
    .from(bots)
    .where(
      and(eq(bots.workspaceId, fromBot.workspaceId), isNull(bots.archivedAt)),
    );
  return rows
    .filter((row) => row.id !== fromBot.id)
    .map((row) => ({ id: row.id, name: row.name, title: row.title }));
}

export function pokeBriefing(
  fromName: string,
  fromTitle: string,
  text: string,
): string {
  const job = fromTitle.trim() ? ` (${fromTitle.trim()})` : "";
  return `${fromName}${job} asked you to handle this. Reply with the result. Do not ask the human — ${fromName} will talk to them.\n\n${text.trim()}`;
}

export async function ensurePokeThread(
  db: Database,
  opts: {
    workspaceId: string;
    userId: string;
    fromBotId: string;
    toBotId: string;
  },
): Promise<typeof threads.$inferSelect> {
  const [aBotId, bBotId] = pokePairIds(opts.fromBotId, opts.toBotId);
  const [existing] = await db
    .select()
    .from(threads)
    .where(
      and(
        eq(threads.kind, "poke"),
        eq(threads.aBotId, aBotId),
        eq(threads.bBotId, bBotId),
      ),
    )
    .limit(1);
  if (existing) return existing;
  const id = newId();
  const [created] = await db
    .insert(threads)
    .values({
      id,
      workspaceId: opts.workspaceId,
      kind: "poke",
      botId: null,
      aBotId,
      bBotId,
    })
    .returning();
  if (!created) throw new PokeError("Could not open a poke thread.");
  await db.insert(threadMembers).values({
    id: newId(),
    threadId: id,
    userId: opts.userId,
    role: "owner",
  });
  return created;
}

export async function getPokeThread(
  db: Database,
  workspaceId: string,
  threadId: string,
): Promise<PokeThreadView> {
  const [thread] = await db
    .select()
    .from(threads)
    .where(
      and(
        eq(threads.id, threadId),
        eq(threads.workspaceId, workspaceId),
        eq(threads.kind, "poke"),
      ),
    )
    .limit(1);
  if (!thread?.aBotId || !thread.bBotId) {
    throw new PokeError("Poke thread not found.");
  }
  const peers = await db
    .select({
      id: bots.id,
      name: bots.name,
      title: bots.title,
    })
    .from(bots)
    .where(and(eq(bots.workspaceId, workspaceId)));
  const a = peers.find((row) => row.id === thread.aBotId);
  const b = peers.find((row) => row.id === thread.bBotId);
  if (!a || !b) throw new PokeError("Poke thread is missing a teammate.");
  const rows = await db
    .select()
    .from(messages)
    .where(eq(messages.threadId, thread.id))
    .orderBy(asc(messages.seq));
  return {
    id: thread.id,
    kind: "poke",
    bots: [a, b],
    messages: rows.map(toThreadMessage),
  };
}

export async function pokeBot(opts: {
  db: Database;
  fromBot: typeof bots.$inferSelect;
  toName: string;
  text: string;
  userId: string;
  pokeStack: string[];
  runTarget: (runId: string) => Promise<void>;
}): Promise<string> {
  const { db, fromBot } = opts;
  if (opts.pokeStack.length >= MAX_POKE_DEPTH) {
    throw new PokeError(`Too many pokes in a chain (max ${MAX_POKE_DEPTH}).`);
  }
  const roster = await db
    .select({
      id: bots.id,
      name: bots.name,
      title: bots.title,
      archivedAt: bots.archivedAt,
    })
    .from(bots)
    .where(eq(bots.workspaceId, fromBot.workspaceId));
  const target = resolvePokeTarget(roster, fromBot.id, opts.toName);
  if (opts.pokeStack.includes(target.id)) {
    throw new PokeError(`${target.name} is already in this poke chain.`);
  }
  const pokeThread = await ensurePokeThread(db, {
    workspaceId: fromBot.workspaceId,
    userId: opts.userId,
    fromBotId: fromBot.id,
    toBotId: target.id,
  });
  const [fromThread] = await db
    .select()
    .from(threads)
    .where(and(eq(threads.botId, fromBot.id), eq(threads.kind, "office")))
    .limit(1);
  if (!fromThread) throw new PokeError("Your office thread is missing.");

  const briefing = pokeBriefing(fromBot.name, fromBot.title, opts.text);
  const taskId = newId();
  const runId = newId();

  await appendThreadMessage(db, {
    workspaceId: fromBot.workspaceId,
    threadId: pokeThread.id,
    botId: fromBot.id,
    actorType: "bot",
    actorId: fromBot.id,
    blocks: [{ kind: "text", text: briefing }],
    runId,
  });

  await db.insert(tasks).values({
    id: taskId,
    workspaceId: fromBot.workspaceId,
    botId: target.id,
    threadId: pokeThread.id,
    userId: opts.userId,
    prompt: briefing,
    status: "queued",
  });
  await db.insert(runs).values({
    id: runId,
    workspaceId: fromBot.workspaceId,
    botId: target.id,
    threadId: pokeThread.id,
    taskId,
    userId: opts.userId,
    status: "queued",
    trigger: "spawn",
  });

  await opts.runTarget(runId);

  const reply = await readBotReply(db, pokeThread.id, target.id, runId);
  await appendThreadMessage(db, {
    workspaceId: fromBot.workspaceId,
    threadId: fromThread.id,
    botId: fromBot.id,
    actorType: "bot",
    actorId: target.id,
    blocks: [
      { kind: "meta", text: `${target.name} replied` },
      { kind: "text", text: `${target.name} replied.` },
      {
        kind: "poke_thread",
        threadId: pokeThread.id,
        peerBotId: target.id,
        peerName: target.name,
      },
    ],
    runId,
  });
  return reply;
}

async function readBotReply(
  db: Database,
  threadId: string,
  botId: string,
  runId: string,
): Promise<string> {
  const rows = await db
    .select()
    .from(messages)
    .where(eq(messages.threadId, threadId))
    .orderBy(asc(messages.seq));
  const fromRun = [...rows]
    .reverse()
    .find(
      (row) =>
        row.runId === runId && row.actorType === "bot" && row.actorId === botId,
    );
  const text = previewText(fromRun?.blocks);
  if (text) return text;
  const [run] = await db.select().from(runs).where(eq(runs.id, runId)).limit(1);
  if (run?.status === "failed") {
    return run.error?.trim() || "That teammate failed.";
  }
  if (run?.status === "cancelled") {
    return "That teammate stopped.";
  }
  throw new PokeError("That teammate did not reply.");
}

function previewText(blocks: unknown): string {
  if (!Array.isArray(blocks)) return "";
  return blocks
    .flatMap((block) => {
      if (!block || typeof block !== "object") return [];
      const row = block as { kind?: unknown; text?: unknown };
      if (row.kind !== "text" || typeof row.text !== "string") return [];
      return [row.text];
    })
    .join("\n")
    .trim();
}

function toThreadMessage(row: typeof messages.$inferSelect): ThreadMessage {
  return {
    id: row.id,
    seq: row.seq,
    actorType: row.actorType as ThreadMessage["actorType"],
    actorId: row.actorId,
    blocks: (row.blocks ?? []) as MessageBlock[],
    runId: row.runId,
    createdAt: iso(row.createdAt) ?? new Date().toISOString(),
  };
}
