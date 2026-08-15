import * as z from "zod";
import { ActorType, ControlHolder, Id, MemoryScope, RunStatus, SandboxKind } from "./ids.js";

export const BotSchema = z.object({
  id: Id,
  workspaceId: Id,
  name: z.string(),
  title: z.string(),
  description: z.string(),
  instructions: z.string(),
  parentBotId: Id.nullable(),
  threadId: Id,
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Bot = z.infer<typeof BotSchema>;

export const CreateBotInput = z.object({
  name: z.string().min(1).max(80),
  title: z.string().max(160).default(""),
  description: z.string().max(4000).default(""),
  instructions: z.string().max(20000).default(""),
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

export const MeSchema = z.object({
  userId: Id,
  email: z.string().email(),
  name: z.string(),
  workspaceId: Id,
  isDeploymentOwner: z.boolean(),
  needsModel: z.boolean(),
});
export type Me = z.infer<typeof MeSchema>;
