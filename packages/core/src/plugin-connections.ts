import { composioUserId } from "@grogbot/adapter-kit";
import type { PluginConnection, PluginStatus } from "@grogbot/contracts";
import {
  PluginStatus as PluginStatusSchema,
  ToolkitSlug,
} from "@grogbot/contracts";
import { type Database, pluginConnections } from "@grogbot/db";
import { and, eq } from "drizzle-orm";
import { newId } from "./ids.js";
import { iso } from "./threads.js";

export { composioUserId };

export class PluginError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PluginError";
  }
}

export function parseToolkit(value: string): string {
  const parsed = ToolkitSlug.safeParse(value.trim().toLowerCase());
  if (!parsed.success) {
    throw new PluginError("Pick a plugin from the marketplace.");
  }
  return parsed.data;
}

export function toPluginDto(
  row: typeof pluginConnections.$inferSelect,
): PluginConnection {
  const status = PluginStatusSchema.safeParse(row.status);
  return {
    id: row.id,
    toolkit: row.toolkit,
    status: status.success ? status.data : "error",
    connectedAccountId: row.connectedAccountId,
    lastError: row.lastError,
    createdAt: iso(row.createdAt) ?? new Date().toISOString(),
    updatedAt: iso(row.updatedAt) ?? new Date().toISOString(),
  };
}

export async function listPluginConnections(
  db: Database,
  workspaceId: string,
): Promise<PluginConnection[]> {
  const rows = await db
    .select()
    .from(pluginConnections)
    .where(eq(pluginConnections.workspaceId, workspaceId));
  return rows.map(toPluginDto);
}

export async function listConnectedToolkits(
  db: Database,
  workspaceId: string,
): Promise<string[]> {
  const rows = await db
    .select({ toolkit: pluginConnections.toolkit })
    .from(pluginConnections)
    .where(
      and(
        eq(pluginConnections.workspaceId, workspaceId),
        eq(pluginConnections.status, "connected"),
      ),
    );
  return rows.map((row) => row.toolkit);
}

export async function getPluginConnection(
  db: Database,
  workspaceId: string,
  toolkit: string,
): Promise<typeof pluginConnections.$inferSelect | undefined> {
  const slug = parseToolkit(toolkit);
  const [row] = await db
    .select()
    .from(pluginConnections)
    .where(
      and(
        eq(pluginConnections.workspaceId, workspaceId),
        eq(pluginConnections.toolkit, slug),
      ),
    )
    .limit(1);
  return row;
}

export async function getPluginConnectionById(
  db: Database,
  id: string,
): Promise<typeof pluginConnections.$inferSelect | undefined> {
  const [row] = await db
    .select()
    .from(pluginConnections)
    .where(eq(pluginConnections.id, id))
    .limit(1);
  return row;
}

export async function addPluginConnection(
  db: Database,
  actor: { workspaceId: string; userId: string },
  toolkit: string,
): Promise<PluginConnection> {
  const slug = parseToolkit(toolkit);
  const existing = await getPluginConnection(db, actor.workspaceId, slug);
  if (existing) return toPluginDto(existing);
  const now = new Date();
  const [row] = await db
    .insert(pluginConnections)
    .values({
      id: newId(),
      workspaceId: actor.workspaceId,
      userId: actor.userId,
      toolkit: slug,
      status: "added",
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  if (!row) throw new PluginError("Could not add plugin.");
  return toPluginDto(row);
}

export async function savePluginConnection(
  db: Database,
  id: string,
  patch: {
    status?: PluginStatus;
    connectedAccountId?: string | null;
    lastError?: string | null;
    userId?: string;
  },
): Promise<PluginConnection> {
  const [row] = await db
    .update(pluginConnections)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(pluginConnections.id, id))
    .returning();
  if (!row) throw new PluginError("Plugin missing.");
  return toPluginDto(row);
}

export async function removePluginConnection(
  db: Database,
  workspaceId: string,
  toolkit: string,
): Promise<typeof pluginConnections.$inferSelect | undefined> {
  const slug = parseToolkit(toolkit);
  const existing = await getPluginConnection(db, workspaceId, slug);
  if (!existing) return undefined;
  await db
    .delete(pluginConnections)
    .where(eq(pluginConnections.id, existing.id));
  return existing;
}
