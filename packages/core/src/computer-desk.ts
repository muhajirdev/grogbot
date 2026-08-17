import type {
  ComputerActivityItem,
  ComputerArtifact,
  ComputerDeskFile,
} from "@grogbot/contracts";
import { type Database, events, messages } from "@grogbot/db";
import { and, desc, eq } from "drizzle-orm";
import { iso } from "./threads.js";

const ARTIFACT_CLIP = 4_000;
const ACTIVITY_LIMIT = 8;

export type ComputerDesk = {
  nowDoing: string | null;
  files: ComputerDeskFile[];
  artifact: ComputerArtifact | null;
  activity: ComputerActivityItem[];
};

export const EMPTY_COMPUTER_DESK: ComputerDesk = {
  nowDoing: null,
  files: [{ path: "/workspace", kind: "dir" }],
  artifact: null,
  activity: [],
};

export function workspaceSlug(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "bot"
  );
}

export function workspacePathForBot(name: string, id: string): string {
  return `/workspace/${workspaceSlug(name)}-${id.slice(0, 8)}.md`;
}

export function uniqueWorkspacePath(
  name: string,
  id: string,
  taken: Set<string>,
): string {
  const slug = workspaceSlug(name);
  let path = `/workspace/${slug}.md`;
  if (taken.has(path)) path = `/workspace/${slug}-${id.slice(0, 8)}.md`;
  taken.add(path);
  return path;
}

export function textFromBlocks(blocks: unknown): string {
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

export function clipDeskText(text: string, max = ARTIFACT_CLIP): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}\n…`;
}

export function artifactFromText(
  text: string,
  updatedAt: string,
  path: string,
): ComputerArtifact {
  const trimmed = clipDeskText(text.trim());
  const lines = trimmed.split("\n");
  const first = (lines[0] ?? "").replace(/^#+\s*/, "").trim();
  const rest = lines.slice(1).join("\n").trim();
  const titled = first.length > 0 && first.length <= 80 && rest.length > 0;
  return {
    path,
    title: titled ? first : "Latest",
    body: titled ? rest : trimmed,
    updatedAt,
  };
}

export function activityFromRunEvents(
  rows: Array<{
    id: string;
    payload: Record<string, unknown>;
    createdAt: Date | string;
  }>,
): ComputerActivityItem[] {
  const items: ComputerActivityItem[] = [];
  for (const row of rows) {
    const status =
      typeof row.payload.status === "string" ? row.payload.status : "";
    const raw =
      typeof row.payload.text === "string" ? row.payload.text.trim() : "";
    const text = activityText(status, raw);
    if (!text) continue;
    if (items.at(-1)?.text === text) continue;
    items.push({
      id: row.id,
      text,
      createdAt:
        typeof row.createdAt === "string"
          ? row.createdAt
          : row.createdAt.toISOString(),
    });
  }
  return items.slice(-ACTIVITY_LIMIT);
}

export function nowDoingFromActivity(
  rows: Array<{ text: string; status: string }>,
  active: boolean,
): string | null {
  if (!active) return null;
  const last = rows.at(-1);
  if (!last) return "working…";
  if (last.status === "completed" || last.status === "cancelled") return null;
  if (last.status === "failed") return last.text.trim() || null;
  return last.text.trim() || "working…";
}

function activityText(status: string, text: string): string | null {
  if (status === "completed") return "Done";
  if (status === "cancelled") return null;
  if (status === "failed") return text || null;
  return text || null;
}

export async function loadComputerDesks(
  db: Database,
  teammates: Array<{ id: string; name: string; threadId: string }>,
  opts: { usingBotId: string | null; running: boolean },
): Promise<Map<string, ComputerDesk>> {
  const result = new Map<string, ComputerDesk>();
  if (teammates.length === 0) return result;

  const lastRows = await Promise.all(
    teammates.map(async (mate) => {
      const [row] = await db
        .select()
        .from(messages)
        .where(
          and(
            eq(messages.threadId, mate.threadId),
            eq(messages.actorType, "bot"),
          ),
        )
        .orderBy(desc(messages.seq))
        .limit(1);
      return row;
    }),
  );
  const lastByThread = new Map<string, NonNullable<(typeof lastRows)[number]>>();
  for (const row of lastRows) {
    if (row) lastByThread.set(row.threadId, row);
  }

  const files: ComputerDeskFile[] = [{ path: "/workspace", kind: "dir" }];
  const artifactByBot = new Map<string, ComputerArtifact>();
  const taken = new Set<string>(["/workspace"]);
  for (const mate of teammates) {
    const last = lastByThread.get(mate.threadId);
    if (!last) continue;
    const path = uniqueWorkspacePath(mate.name, mate.id, taken);
    const updatedAt = iso(last.createdAt) ?? new Date().toISOString();
    const artifact = artifactFromText(
      textFromBlocks(last.blocks),
      updatedAt,
      path,
    );
    files.push({
      path,
      kind: "file",
      title: artifact.title,
      body: artifact.body,
      updatedAt,
    });
    artifactByBot.set(mate.id, artifact);
  }

  await Promise.all(
    teammates.map(async (mate) => {
      const eventRows = await db
        .select({
          id: events.id,
          payload: events.payload,
          createdAt: events.createdAt,
          seq: events.seq,
        })
        .from(events)
        .where(
          and(eq(events.threadId, mate.threadId), eq(events.type, "run.updated")),
        )
        .orderBy(desc(events.seq))
        .limit(16);
      const chronological = eventRows.slice().reverse();
      const activity = activityFromRunEvents(chronological);
      const statusRows = chronological.map((row) => ({
        text: typeof row.payload.text === "string" ? row.payload.text : "",
        status:
          typeof row.payload.status === "string" ? row.payload.status : "",
      }));
      result.set(mate.id, {
        nowDoing: nowDoingFromActivity(
          statusRows,
          opts.running && opts.usingBotId === mate.id,
        ),
        files,
        artifact: artifactByBot.get(mate.id) ?? null,
        activity,
      });
    }),
  );

  return result;
}
