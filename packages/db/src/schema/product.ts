import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { organization, user } from "./auth.js";

export const bots = pgTable("bots", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  name: text("name").notNull(),
  title: text("title").notNull().default(""),
  description: text("description").notNull().default(""),
  instructions: text("instructions").notNull().default(""),
  parentBotId: text("parent_bot_id"),
  /** v1 office thread. A bot may join other threads later via thread_participants. */
  homeThreadId: text("home_thread_id")
    .unique()
    .references(() => threads.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** A room. v1 = one bot's office. Later = group with many bots. No unique bot_id. */
export const threads = pgTable("threads", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  kind: text("kind").notNull().default("office"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Humans and bots in a room.
 * v1 office: one bot (role=owner) + humans.
 * Later group: many bots; wakeup uses owner or targetBotId.
 */
export const threadParticipants = pgTable(
  "thread_participants",
  {
    id: text("id").primaryKey(),
    threadId: text("thread_id")
      .notNull()
      .references(() => threads.id, { onDelete: "cascade" }),
    participantType: text("participant_type").notNull(),
    participantId: text("participant_id").notNull(),
    role: text("role").notNull().default("member"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("thread_participants_unique").on(
      t.threadId,
      t.participantType,
      t.participantId,
    ),
  ],
);

export const messages = pgTable(
  "messages",
  {
    id: text("id").primaryKey(),
    threadId: text("thread_id")
      .notNull()
      .references(() => threads.id, { onDelete: "cascade" }),
    seq: integer("seq").notNull(),
    actorType: text("actor_type").notNull(),
    actorId: text("actor_id"),
    blocks: jsonb("blocks").notNull().$type<unknown[]>(),
    runId: text("run_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("messages_thread_seq").on(t.threadId, t.seq)],
);

export const events = pgTable(
  "events",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    threadId: text("thread_id")
      .notNull()
      .references(() => threads.id, { onDelete: "cascade" }),
    botId: text("bot_id").notNull(),
    seq: integer("seq").notNull(),
    type: text("type").notNull(),
    payload: jsonb("payload").notNull().$type<Record<string, unknown>>(),
    runId: text("run_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("events_thread_seq").on(t.threadId, t.seq)],
);

export const tasks = pgTable("tasks", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  botId: text("bot_id")
    .notNull()
    .references(() => bots.id, { onDelete: "cascade" }),
  threadId: text("thread_id")
    .notNull()
    .references(() => threads.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  prompt: text("prompt").notNull(),
  status: text("status").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const runs = pgTable("runs", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  botId: text("bot_id")
    .notNull()
    .references(() => bots.id, { onDelete: "cascade" }),
  threadId: text("thread_id")
    .notNull()
    .references(() => threads.id, { onDelete: "cascade" }),
  taskId: text("task_id")
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  status: text("status").notNull(),
  trigger: text("trigger").notNull(),
  error: text("error"),
  leaseOwner: text("lease_owner"),
  leaseFence: integer("lease_fence").notNull().default(0),
  leaseExpiresAt: timestamp("lease_expires_at", { withTimezone: true }),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const jobs = pgTable(
  "jobs",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    payload: jsonb("payload").notNull().$type<Record<string, unknown>>(),
    runAt: timestamp("run_at", { withTimezone: true }).notNull().defaultNow(),
    jobKey: text("job_key"),
    lockedAt: timestamp("locked_at", { withTimezone: true }),
    lockedBy: text("locked_by"),
    attempts: integer("attempts").notNull().default(0),
    lastError: text("last_error"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("jobs_job_key").on(t.jobKey)],
);

export const routines = pgTable("routines", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  botId: text("bot_id")
    .notNull()
    .references(() => bots.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  prompt: text("prompt").notNull(),
  cron: text("cron").notNull(),
  timezone: text("timezone").notNull().default("UTC"),
  active: boolean("active").notNull().default(false),
  lastRunAt: timestamp("last_run_at", { withTimezone: true }),
  nextRunAt: timestamp("next_run_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const computers = pgTable("computers", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  botId: text("bot_id")
    .notNull()
    .unique()
    .references(() => bots.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  kind: text("kind").notNull(),
  providerRef: text("provider_ref"),
  state: text("state").notNull().default("stopped"),
  controlHolder: text("control_holder").notNull().default("none"),
  controlHolderId: text("control_holder_id"),
  controlLeaseId: text("control_lease_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const memoryDocuments = pgTable(
  "memory_documents",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    botId: text("bot_id"),
    scope: text("scope").notNull(),
    path: text("path").notNull(),
    content: text("content").notNull(),
    revision: integer("revision").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("memory_workspace_scope_bot_path").on(t.workspaceId, t.scope, t.botId, t.path)],
);

export const secrets = pgTable("secrets", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  workspaceId: text("workspace_id").notNull(),
  kind: text("kind").notNull(),
  ciphertext: text("ciphertext").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const userModelCredentials = pgTable("user_model_credentials", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  workspaceId: text("workspace_id").notNull(),
  provider: text("provider").notNull(),
  label: text("label").notNull(),
  secretId: text("secret_id").notNull(),
  isDefault: boolean("is_default").notNull().default(false),
  defaultModel: text("default_model"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
