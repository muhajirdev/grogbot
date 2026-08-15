import * as z from "zod";
import {
  ActorType,
  AvatarShape,
  ControlHolder,
  GuestKind,
  Id,
  MemoryScope,
  RunStatus,
  SandboxKind,
} from "./ids.js";

export const BotSchema = z.object({
  id: Id,
  workspaceId: Id,
  name: z.string(),
  title: z.string(),
  description: z.string(),
  instructions: z.string(),
  avatarColor: z.string(),
  avatarShape: AvatarShape,
  parentBotId: Id.nullable(),
  threadId: Id,
  guestKind: GuestKind,
  guestOnline: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Bot = z.infer<typeof BotSchema>;

export const CreateBotInput = z.object({
  name: z.string().min(1).max(80),
  title: z.string().max(160).default(""),
  description: z.string().max(4000).default(""),
  instructions: z.string().max(20000).default(""),
  avatarColor: z.string().max(32).default("#5b7cff"),
  avatarShape: AvatarShape.default("circle"),
});

export const UpdateBotInput = z.object({
  botId: Id,
  name: z.string().min(1).max(80).optional(),
  title: z.string().max(160).optional(),
  description: z.string().max(4000).optional(),
  instructions: z.string().max(20000).optional(),
  avatarColor: z.string().max(32).optional(),
  avatarShape: AvatarShape.optional(),
});

export const MessageBlockSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("text"), text: z.string() }),
  z.object({ kind: z.literal("meta"), text: z.string() }),
]);
export type MessageBlock = z.infer<typeof MessageBlockSchema>;

export const ThreadMessageSchema = z.object({
  id: Id,
  seq: z.number().int(),
  actorType: ActorType,
  actorId: Id.nullable(),
  blocks: z.array(MessageBlockSchema),
  runId: Id.nullable(),
  createdAt: z.string(),
});
export type ThreadMessage = z.infer<typeof ThreadMessageSchema>;

export const ComputerStatusSchema = z.object({
  botId: Id,
  kind: SandboxKind,
  state: z.enum(["stopped", "booting", "running", "suspended", "error"]),
  controlHolder: ControlHolder,
  controlHolderId: Id.nullable(),
  screenAvailable: z.boolean(),
});
export type ComputerStatus = z.infer<typeof ComputerStatusSchema>;

export const RunSchema = z.object({
  id: Id,
  botId: Id,
  threadId: Id,
  status: RunStatus,
  trigger: z.enum(["user", "routine", "resume", "follow_up", "spawn"]),
  error: z.string().nullable(),
  startedAt: z.string().nullable(),
  completedAt: z.string().nullable(),
});
export type Run = z.infer<typeof RunSchema>;

export const RoutineSchema = z.object({
  id: Id,
  botId: Id,
  name: z.string(),
  prompt: z.string(),
  cron: z.string(),
  timezone: z.string(),
  active: z.boolean(),
  nextRunAt: z.string().nullable(),
});
export type Routine = z.infer<typeof RoutineSchema>;

export const MemoryDocumentSchema = z.object({
  id: Id,
  scope: MemoryScope,
  botId: Id.nullable(),
  path: z.string(),
  content: z.string(),
  revision: z.number().int(),
  updatedAt: z.string(),
});

export const GuestStatusSchema = z.object({
  botId: Id,
  kind: GuestKind,
  online: z.boolean(),
  lastSeenAt: z.string().nullable(),
  connectUrl: z.string(),
});
export type GuestStatus = z.infer<typeof GuestStatusSchema>;

export const GuestConnectSchema = GuestStatusSchema.extend({
  token: z.string(),
  command: z.string(),
});
export type GuestConnect = z.infer<typeof GuestConnectSchema>;

export const MeSchema = z.object({
  userId: Id,
  email: z.string().email(),
  name: z.string(),
  workspaceId: Id,
  isDeploymentOwner: z.boolean(),
  needsModel: z.boolean(),
});
export type Me = z.infer<typeof MeSchema>;
