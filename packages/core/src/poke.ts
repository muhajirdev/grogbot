import type { PokeTeammate } from "@grogbot/adapter-kit";
import {
  bots,
  type Database,
  messages,
  runs,
  tasks,
  threads,
} from "@grogbot/db";
import { and, asc, eq, isNull } from "drizzle-orm";
import { newId } from "./ids.js";
import { appendThreadMessage } from "./threads.js";

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
  const [thread] = await db
    .select()
    .from(threads)
    .where(eq(threads.botId, target.id))
    .limit(1);
  if (!thread) throw new PokeError(`${target.name} has no office thread.`);

  const briefing = pokeBriefing(fromBot.name, fromBot.title, opts.text);
  const taskId = newId();
  const runId = newId();

  await appendThreadMessage(db, {
    workspaceId: fromBot.workspaceId,
    threadId: thread.id,
    botId: target.id,
    actorType: "bot",
    actorId: fromBot.id,
    blocks: [
      { kind: "meta", text: `From ${fromBot.name}` },
      { kind: "text", text: briefing },
    ],
    runId,
  });

  await db.insert(tasks).values({
    id: taskId,
    workspaceId: fromBot.workspaceId,
    botId: target.id,
    threadId: thread.id,
    userId: opts.userId,
    prompt: briefing,
    status: "queued",
  });
  await db.insert(runs).values({
    id: runId,
    workspaceId: fromBot.workspaceId,
    botId: target.id,
    threadId: thread.id,
    taskId,
    userId: opts.userId,
    status: "queued",
    trigger: "spawn",
  });

  await opts.runTarget(runId);

  const [fromThread] = await db
    .select()
    .from(threads)
    .where(eq(threads.botId, fromBot.id))
    .limit(1);
  if (!fromThread) throw new PokeError("Your office thread is missing.");

  const reply = await readBotReply(db, thread.id, target.id, runId);
  await appendThreadMessage(db, {
    workspaceId: fromBot.workspaceId,
    threadId: fromThread.id,
    botId: fromBot.id,
    actorType: "bot",
    actorId: target.id,
    blocks: [
      { kind: "meta", text: `${target.name} replied` },
      { kind: "text", text: `${target.name}:\n\n${reply}` },
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
