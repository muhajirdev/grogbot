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

export async function requireActor(context: RpcContext): Promise<Actor> {
  if (!context.auth) {
    throw new ORPCError("UNAUTHORIZED", { message: "Sign in" });
  }
  const session = await context.auth.api.getSession({
    headers: context.headers ?? new Headers(),
  });
  if (!session) {
    throw new ORPCError("UNAUTHORIZED", { message: "Sign in" });
  }

  const headers = context.headers;
  let workspaceId = session.session.activeOrganizationId ?? undefined;
  if (!workspaceId) {
    const orgs = await context.auth.api.listOrganizations({ headers });
    if (orgs.length === 0) {
      const slug = `ws-${session.user.id.replace(/-/g, "").slice(0, 12)}`;
      const org = await context.auth.api.createOrganization({
        body: { name: "Personal", slug },
        headers,
      });
      workspaceId = org.id;
    } else {
      workspaceId = orgs[0]?.id;
      if (workspaceId) {
        await context.auth.api.setActiveOrganization({
          body: { organizationId: workspaceId },
          headers,
        });
      }
    }
  }
  if (!workspaceId) {
    throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "No workspace" });
  }

  const [settings] = await context.db
    .select()
    .from(deploymentSettings)
    .where(eq(deploymentSettings.id, "default"))
    .limit(1);
  let ownerUserId = settings?.ownerUserId ?? null;
  if (!settings) {
    await context.db.insert(deploymentSettings).values({
      id: "default",
      ownerUserId: session.user.id,
    });
    ownerUserId = session.user.id;
  } else if (!ownerUserId) {
    await context.db
      .update(deploymentSettings)
      .set({ ownerUserId: session.user.id, updatedAt: new Date() })
      .where(eq(deploymentSettings.id, "default"));
    ownerUserId = session.user.id;
  }

  return {
    userId: session.user.id,
    email: session.user.email,
    name: session.user.name,
    workspaceId,
    isDeploymentOwner: ownerUserId === session.user.id,
  };
}
