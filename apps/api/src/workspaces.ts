import {
  invitationIdFromInput,
  invitationUrl,
  listPendingInvitations,
  slugForWorkspace,
  workspaceAuthMessage,
} from "@grogbot/core";
import { ORPCError } from "@orpc/server";
import type { RpcContext } from "./context.js";
import { requireActor, type SessionUser } from "./session.js";

export async function createWorkspace(
  context: RpcContext,
  user: SessionUser,
  name: string,
) {
  if (!context.auth) {
    throw new ORPCError("UNAUTHORIZED", { message: "Sign in" });
  }
  const trimmed = name.trim();
  const slug = slugForWorkspace(trimmed, user.userId);
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const org = await context.auth.api.createOrganization({
        body: {
          name: trimmed,
          slug: attempt === 0 ? slug : `${slug}-${attempt + 1}`,
        },
        headers: user.headers,
      });
      if (!org?.id) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Could not create workspace",
        });
      }
      return { id: org.id, name: org.name, slug: org.slug };
    } catch (caught) {
      const message = authMessage(caught);
      if (attempt < 3 && /already exists|slug already taken/i.test(message)) {
        continue;
      }
      throwWorkspaceError(caught, "Could not create workspace");
    }
  }
  throw new ORPCError("BAD_REQUEST", {
    message: "Pick another workspace name.",
  });
}

export async function joinWorkspace(
  context: RpcContext,
  user: SessionUser,
  rawInvitationId: string,
) {
  if (!context.auth) {
    throw new ORPCError("UNAUTHORIZED", { message: "Sign in" });
  }
  const invitationId = invitationIdFromInput(rawInvitationId);
  if (!invitationId) {
    throw new ORPCError("BAD_REQUEST", { message: "Paste an invite to join." });
  }
  try {
    const accepted = await context.auth.api.acceptInvitation({
      body: { invitationId },
      headers: user.headers,
    });
    const organizationId = accepted?.invitation?.organizationId;
    if (!organizationId) {
      throw new ORPCError("BAD_REQUEST", {
        message: "That invite is missing or expired.",
      });
    }
    await context.auth.api.setActiveOrganization({
      body: { organizationId },
      headers: user.headers,
    });
    const org = await context.auth.api.getFullOrganization({
      query: { organizationId },
      headers: user.headers,
    });
    return {
      id: organizationId,
      name: org?.name ?? "Workspace",
      slug: org?.slug ?? organizationId,
    };
  } catch (caught) {
    if (caught instanceof ORPCError) throw caught;
    throwWorkspaceError(caught, "Could not join workspace");
  }
}

export async function inviteToWorkspace(context: RpcContext, email: string) {
  const actor = await requireActor(context);
  if (!context.auth) {
    throw new ORPCError("UNAUTHORIZED", { message: "Sign in" });
  }
  try {
    const invitation = await context.auth.api.createInvitation({
      body: {
        email: email.trim().toLowerCase(),
        role: "member",
        organizationId: actor.workspaceId,
      },
      headers: context.headers ?? new Headers(),
    });
    if (!invitation?.id) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Could not send invite",
      });
    }
    return {
      id: invitation.id,
      email: invitation.email,
      url: invitationUrl(context.env.webOrigin, invitation.id),
    };
  } catch (caught) {
    if (caught instanceof ORPCError) throw caught;
    throwWorkspaceError(caught, "Could not send invite");
  }
}

export async function pendingInvitations(context: RpcContext, email: string) {
  return listPendingInvitations(context.db, email);
}

export function throwWorkspaceError(caught: unknown, fallback: string): never {
  throw new ORPCError("BAD_REQUEST", {
    message: workspaceAuthMessage(authMessage(caught), fallback),
  });
}

function authMessage(caught: unknown): string {
  if (caught instanceof Error && caught.message.trim()) return caught.message;
  if (caught && typeof caught === "object" && "message" in caught) {
    return String((caught as { message?: unknown }).message ?? "");
  }
  return "";
}
