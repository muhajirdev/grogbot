import { deploymentSettings } from "@grogbot/db";
import { ORPCError } from "@orpc/server";
import { eq } from "drizzle-orm";
import type { RpcContext } from "./context.js";

export interface Actor {
  userId: string;
  email: string;
  name: string;
  workspaceId: string;
  isDeploymentOwner: boolean;
}

export interface SessionUser {
  userId: string;
  email: string;
  name: string;
  workspaceId: string | null;
  workspaceName: string | null;
  headers: Headers;
  isDeploymentOwner: boolean;
}

export async function requireUser(context: RpcContext): Promise<SessionUser> {
  if (!context.auth) {
    throw new ORPCError("UNAUTHORIZED", { message: "Sign in" });
  }
  const headers = context.headers ?? new Headers();
  const session = await context.auth.api.getSession({ headers });
  if (!session) {
    throw new ORPCError("UNAUTHORIZED", { message: "Sign in" });
  }

  let workspaceId = session.session.activeOrganizationId ?? null;
  let workspaceName: string | null = null;
  const orgs = await context.auth.api.listOrganizations({ headers });
  if (!workspaceId) {
    workspaceId = orgs[0]?.id ?? null;
    if (workspaceId) {
      await context.auth.api.setActiveOrganization({
        body: { organizationId: workspaceId },
        headers,
      });
    }
  }
  if (workspaceId) {
    workspaceName =
      orgs.find((org) => org.id === workspaceId)?.name ?? orgs[0]?.name ?? null;
  }

  const isDeploymentOwner = await ensureDeploymentOwner(
    context,
    session.user.id,
  );

  return {
    userId: session.user.id,
    email: session.user.email,
    name: session.user.name,
    workspaceId,
    workspaceName,
    headers,
    isDeploymentOwner,
  };
}

export async function requireActor(context: RpcContext): Promise<Actor> {
  const user = await requireUser(context);
  if (!user.workspaceId) {
    throw new ORPCError("FAILED_PRECONDITION", {
      message: "Create or join a workspace",
    });
  }
  return {
    userId: user.userId,
    email: user.email,
    name: user.name,
    workspaceId: user.workspaceId,
    isDeploymentOwner: user.isDeploymentOwner,
  };
}

async function ensureDeploymentOwner(
  context: RpcContext,
  userId: string,
): Promise<boolean> {
  const [settings] = await context.db
    .select()
    .from(deploymentSettings)
    .where(eq(deploymentSettings.id, "default"))
    .limit(1);
  let ownerUserId = settings?.ownerUserId ?? null;
  if (!settings) {
    await context.db.insert(deploymentSettings).values({
      id: "default",
      ownerUserId: userId,
    });
    ownerUserId = userId;
  } else if (!ownerUserId) {
    await context.db
      .update(deploymentSettings)
      .set({ ownerUserId: userId, updatedAt: new Date() })
      .where(eq(deploymentSettings.id, "default"));
    ownerUserId = userId;
  }
  return ownerUserId === userId;
}
