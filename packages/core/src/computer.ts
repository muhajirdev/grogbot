import type { ComputerListItem, ComputerStatus } from "@grogbot/contracts";
import { ControlHolder } from "@grogbot/contracts";
import { bots, computers, type Database, runs, threads } from "@grogbot/db";
import { and, eq, inArray, isNull, ne } from "drizzle-orm";
import { appendEvent, sandboxKind, toComputerStatus } from "./threads.js";

export const ACTIVE_RUN_STATUSES = [
  "queued",
  "leased",
  "running",
  "waiting_input",
  "waiting_takeover",
] as const;

export function canClaimComputer(opts: {
  controlHolder: string;
  controlHolderId: string | null;
  claimantBotId: string;
  activeBotIds: string[];
}): boolean {
  if (opts.controlHolder === "user") return false;
  if (opts.controlHolder === "none" || !opts.controlHolderId) return true;
  if (opts.controlHolderId === opts.claimantBotId) return true;
  return !opts.activeBotIds.includes(opts.controlHolderId);
}

export async function listComputerAgents(
  db: Database,
  computerId: string,
): Promise<Array<{ id: string; name: string; threadId: string }>> {
  const rows = await db
    .select({
      id: bots.id,
      name: bots.name,
      threadId: threads.id,
    })
    .from(bots)
    .innerJoin(
      threads,
      and(eq(threads.botId, bots.id), eq(threads.kind, "office")),
    )
    .where(and(eq(bots.computerId, computerId), isNull(bots.archivedAt)));
  return rows;
}

export async function activeBotIdsOnComputer(
  db: Database,
  computerId: string,
): Promise<string[]> {
  const agents = await listComputerAgents(db, computerId);
  if (agents.length === 0) return [];
  const rows = await db
    .select({ botId: runs.botId })
    .from(runs)
    .where(
      and(
        inArray(
          runs.botId,
          agents.map((row) => row.id),
        ),
        inArray(runs.status, [...ACTIVE_RUN_STATUSES]),
      ),
    );
  return [...new Set(rows.map((row) => row.botId))];
}

export async function computerStatusForBot(
  db: Database,
  computer: typeof computers.$inferSelect,
  viewingBotId: string,
): Promise<ComputerStatus> {
  const teammates = await listComputerAgents(db, computer.id);
  const usingBotId =
    computer.controlHolder === "bot" ? computer.controlHolderId : null;
  const usingBotName =
    teammates.find((row) => row.id === usingBotId)?.name ?? null;
  return toComputerStatus(computer, {
    viewingBotId,
    usingBotId,
    usingBotName,
    teammates: teammates.map((row) => ({ id: row.id, name: row.name })),
  });
}

export async function fanoutComputerUpdated(
  db: Database,
  computer: typeof computers.$inferSelect,
  viewingBotId: string,
  runId?: string | null,
): Promise<ComputerStatus> {
  const agents = await listComputerAgents(db, computer.id);
  const usingBotId =
    computer.controlHolder === "bot" ? computer.controlHolderId : null;
  const usingBotName =
    agents.find((row) => row.id === usingBotId)?.name ?? null;
  const teammates = agents.map((row) => ({ id: row.id, name: row.name }));
  let viewing: ComputerStatus | undefined;
  for (const agent of agents) {
    const status = toComputerStatus(computer, {
      viewingBotId: agent.id,
      usingBotId,
      usingBotName,
      teammates,
    });
    if (agent.id === viewingBotId) viewing = status;
    await appendEvent(db, {
      workspaceId: computer.workspaceId,
      threadId: agent.threadId,
      botId: agent.id,
      type: "computer.updated",
      payload: status as unknown as Record<string, unknown>,
      runId,
    });
  }
  return viewing ?? computerStatusForBot(db, computer, viewingBotId);
}

export async function tryClaimComputer(
  db: Database,
  computer: typeof computers.$inferSelect,
  claimantBotId: string,
  state: "booting" | "running",
): Promise<{ claimed: boolean; computer: typeof computers.$inferSelect }> {
  const activeBotIds = await activeBotIdsOnComputer(db, computer.id);
  if (
    !canClaimComputer({
      controlHolder: computer.controlHolder,
      controlHolderId: computer.controlHolderId,
      claimantBotId,
      activeBotIds,
    })
  ) {
    return { claimed: false, computer };
  }
  const [updated] = await db
    .update(computers)
    .set({
      state,
      controlHolder: "bot",
      controlHolderId: claimantBotId,
      updatedAt: new Date(),
    })
    .where(
      and(eq(computers.id, computer.id), ne(computers.controlHolder, "user")),
    )
    .returning();
  if (!updated) return { claimed: false, computer };
  return { claimed: true, computer: updated };
}

export function toComputerListItem(
  row: typeof computers.$inferSelect,
  agentCount: number,
): ComputerListItem {
  const states: ComputerListItem["state"][] = [
    "stopped",
    "booting",
    "running",
    "suspended",
    "error",
  ];
  return {
    id: row.id,
    name: row.name,
    isDefault: row.isDefault,
    kind: sandboxKind(row.kind),
    state: states.find((value) => value === row.state) ?? "stopped",
    agentCount,
  };
}

export async function getBotComputer(
  db: Database,
  bot: typeof bots.$inferSelect,
): Promise<typeof computers.$inferSelect | undefined> {
  const [row] = await db
    .select()
    .from(computers)
    .where(eq(computers.id, bot.computerId))
    .limit(1);
  return row;
}

export { ControlHolder };
