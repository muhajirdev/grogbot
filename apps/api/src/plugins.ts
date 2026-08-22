import {
  ComposioError,
  composioConfigured,
  createComposioGateway,
} from "@groxbot/adapters/edge";
import type { PluginConnection } from "@groxbot/contracts";
import {
  addPluginConnection,
  composioUserId,
  getPluginConnection,
  getPluginConnectionById,
  listPluginConnections,
  PluginError,
  removePluginConnection,
  savePluginConnection,
  toPluginDto,
} from "@groxbot/core";
import { ORPCError } from "@orpc/server";
import type { RpcContext } from "./context.js";
import type { Env } from "./env.js";
import { requireActor } from "./session.js";

function mapPluginError(error: unknown): never {
  if (error instanceof PluginError || error instanceof ComposioError) {
    throw new ORPCError("BAD_REQUEST", { message: error.message });
  }
  throw error;
}

function callbackUrl(env: Env, rowId: string): string {
  const base = (env.apiUrl ?? env.webOrigin).replace(/\/$/, "");
  return `${base}/api/plugins/callback?id=${encodeURIComponent(rowId)}`;
}

async function requireRow(
  context: RpcContext,
  workspaceId: string,
  toolkit: string,
) {
  const row = await getPluginConnection(context.db, workspaceId, toolkit);
  if (!row) {
    throw new ORPCError("NOT_FOUND", {
      message: "Add the plugin before authenticating.",
    });
  }
  return row;
}

export async function pluginStatus(context: RpcContext) {
  await requireActor(context);
  return {
    composio: composioConfigured({
      COMPOSIO_API_KEY: context.env.composioApiKey,
    }),
  };
}

export async function listPlugins(
  context: RpcContext,
): Promise<PluginConnection[]> {
  const actor = await requireActor(context);
  return listPluginConnections(context.db, actor.workspaceId);
}

export async function addPlugin(context: RpcContext, toolkit: string) {
  const actor = await requireActor(context);
  try {
    return await addPluginConnection(context.db, actor, toolkit);
  } catch (error) {
    mapPluginError(error);
  }
}

export async function connectPlugin(context: RpcContext, toolkit: string) {
  const actor = await requireActor(context);
  try {
    let existing = await getPluginConnection(
      context.db,
      actor.workspaceId,
      toolkit,
    );
    if (!existing) {
      await addPluginConnection(context.db, actor, toolkit);
      existing = await getPluginConnection(
        context.db,
        actor.workspaceId,
        toolkit,
      );
    }
    if (!existing) throw new PluginError("Could not add plugin.");
    if (existing.status === "connected" && existing.connectedAccountId) {
      return { connection: toPluginDto(existing), redirectUrl: null };
    }
    const gateway = createComposioGateway({
      COMPOSIO_API_KEY: context.env.composioApiKey,
    });
    const link = await gateway.link({
      userId: composioUserId(actor.workspaceId),
      toolkit: existing.toolkit,
      callbackUrl: callbackUrl(context.env, existing.id),
    });
    const connection = await savePluginConnection(context.db, existing.id, {
      status: link.redirectUrl ? "connecting" : "connected",
      connectedAccountId:
        link.connectedAccountId ?? existing.connectedAccountId,
      lastError: null,
      userId: actor.userId,
    });
    return { connection, redirectUrl: link.redirectUrl };
  } catch (error) {
    try {
      const row = await getPluginConnection(
        context.db,
        actor.workspaceId,
        toolkit,
      );
      if (row) {
        await savePluginConnection(context.db, row.id, {
          status: "error",
          lastError: error instanceof Error ? error.message : "Connect failed",
        });
      }
    } catch {
      // Keep the original error.
    }
    mapPluginError(error);
  }
}

export async function disconnectPlugin(context: RpcContext, toolkit: string) {
  const actor = await requireActor(context);
  try {
    const row = await requireRow(context, actor.workspaceId, toolkit);
    if (
      row.connectedAccountId &&
      composioConfigured({ COMPOSIO_API_KEY: context.env.composioApiKey })
    ) {
      try {
        await createComposioGateway({
          COMPOSIO_API_KEY: context.env.composioApiKey,
        }).deleteAccount(row.connectedAccountId);
      } catch {
        // Local disconnect still wins if Composio already dropped the account.
      }
    }
    return savePluginConnection(context.db, row.id, {
      status: "added",
      connectedAccountId: null,
      lastError: null,
    });
  } catch (error) {
    mapPluginError(error);
  }
}

export async function removePlugin(context: RpcContext, toolkit: string) {
  const actor = await requireActor(context);
  try {
    const row = await getPluginConnection(
      context.db,
      actor.workspaceId,
      toolkit,
    );
    if (
      row?.connectedAccountId &&
      composioConfigured({ COMPOSIO_API_KEY: context.env.composioApiKey })
    ) {
      try {
        await createComposioGateway({
          COMPOSIO_API_KEY: context.env.composioApiKey,
        }).deleteAccount(row.connectedAccountId);
      } catch {
        // Row still goes away.
      }
    }
    await removePluginConnection(context.db, actor.workspaceId, toolkit);
    return { ok: true as const };
  } catch (error) {
    mapPluginError(error);
  }
}

export async function refreshPlugins(
  context: RpcContext,
): Promise<PluginConnection[]> {
  const actor = await requireActor(context);
  const rows = await listPluginConnections(context.db, actor.workspaceId);
  if (
    rows.length === 0 ||
    !composioConfigured({ COMPOSIO_API_KEY: context.env.composioApiKey })
  ) {
    return rows;
  }
  try {
    const accounts = await createComposioGateway({
      COMPOSIO_API_KEY: context.env.composioApiKey,
    }).listAccounts(composioUserId(actor.workspaceId));
    const active = new Map(
      accounts
        .filter((item) => item.status === "ACTIVE")
        .map((item) => [item.toolkit, item]),
    );
    for (const row of rows) {
      const match = active.get(row.toolkit);
      if (match && row.status !== "connected") {
        await savePluginConnection(context.db, row.id, {
          status: "connected",
          connectedAccountId: match.id,
          lastError: null,
        });
      }
    }
    return listPluginConnections(context.db, actor.workspaceId);
  } catch (error) {
    mapPluginError(error);
  }
}

export async function completePluginCallback(
  context: Pick<RpcContext, "db">,
  query: {
    id?: string;
    status?: string;
    connectedAccountId?: string;
  },
): Promise<void> {
  if (!query.id) return;
  const row = await getPluginConnectionById(context.db, query.id);
  if (!row) return;
  if (query.status === "failed") {
    await savePluginConnection(context.db, row.id, {
      status: "error",
      lastError: "Authentication failed",
    });
    return;
  }
  const accountId = query.connectedAccountId?.trim();
  await savePluginConnection(context.db, row.id, {
    status: accountId ? "connected" : "connecting",
    connectedAccountId: accountId || row.connectedAccountId,
    lastError: null,
  });
}

export function pluginCallbackPage(webOrigin: string): string {
  const origin = JSON.stringify(webOrigin);
  return `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8"><title>Groxbot plugins</title></head>
  <body>
    <p>You can close this window.</p>
    <script>
      const params = new URLSearchParams(location.search);
      const payload = {
        type: "groxbot:plugin",
        id: params.get("id"),
        status: params.get("status") || "success",
      };
      if (window.opener) {
        window.opener.postMessage(payload, ${origin});
      }
      window.close();
    </script>
  </body>
</html>`;
}
