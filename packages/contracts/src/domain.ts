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
  computerId: Id,
  computerName: z.string(),
  guestKind: GuestKind,
  guestOnline: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Bot = z.infer<typeof BotSchema>;

export const CreateBotInput = z.object({
  name: z.string().min(1).max(80),
  /** Optional job line. Empty is fine — name is enough. */
  title: z.string().max(160).optional().default(""),
  description: z.string().max(4000).default(""),
  instructions: z.string().max(20000).default(""),
  avatarColor: z.string().max(32).default("#5b7cff"),
  avatarShape: AvatarShape.default("circle"),
  /** default = workspace Desk. new = isolated computer. id = bind to that computer. */
  computer: z
    .union([z.literal("default"), z.literal("new"), Id])
    .default("default"),
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

export const ComputerTeammateSchema = z.object({
  id: Id,
  name: z.string(),
});
export type ComputerTeammate = z.infer<typeof ComputerTeammateSchema>;

export const ComputerStatusSchema = z.object({
  id: Id,
  name: z.string(),
  isDefault: z.boolean(),
  botId: Id,
  kind: SandboxKind,
  state: z.enum(["stopped", "booting", "running", "suspended", "error"]),
  controlHolder: ControlHolder,
  controlHolderId: Id.nullable(),
  usingBotId: Id.nullable(),
  usingBotName: z.string().nullable(),
  teammates: z.array(ComputerTeammateSchema),
  screenAvailable: z.boolean(),
});
export type ComputerStatus = z.infer<typeof ComputerStatusSchema>;

export const ComputerListItemSchema = z.object({
  id: Id,
  name: z.string(),
  isDefault: z.boolean(),
  kind: SandboxKind,
  state: z.enum(["stopped", "booting", "running", "suspended", "error"]),
  agentCount: z.number().int(),
});
export type ComputerListItem = z.infer<typeof ComputerListItemSchema>;

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
