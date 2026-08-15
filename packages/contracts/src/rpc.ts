import { eventIterator, oc } from "@orpc/contract";
import * as z from "zod";
import {
  BotSchema,
  ComputerListItemSchema,
  ComputerStatusSchema,
  CreateBotInput,
  MemoryDocumentSchema,
  MeSchema,
  RoutineSchema,
  UpdateBotInput,
} from "./domain.js";
import { ProductEventSchema } from "./events.js";
import { Id } from "./ids.js";

const botId = z.object({ botId: Id });

export const appContract = oc.router({
  health: oc.output(
    z.object({
      ok: z.literal(true),
      version: z.string(),
      runtime: z.string(),
      sandbox: z.string(),
      wakeup: z.string(),
      oauth: z.array(z.enum(["google", "github"])),
    }),
  ),
  me: oc.output(MeSchema),
  bots: {
    list: oc.output(z.array(BotSchema)),
    get: oc.input(botId).output(BotSchema),
    create: oc.input(CreateBotInput).output(BotSchema),
    update: oc.input(UpdateBotInput).output(BotSchema),
  },
  threads: {
    subscribe: oc
      .input(z.object({ botId: Id, cursor: z.number().int().min(-1) }))
      .output(eventIterator(ProductEventSchema)),
    send: oc
      .input(z.object({ botId: Id, text: z.string().min(1).max(8000) }))
      .output(z.object({ taskId: Id, runId: Id, seq: z.number().int() })),
    stop: oc.input(botId).output(z.object({ ok: z.literal(true) })),
  },
  computers: {
    list: oc.output(z.array(ComputerListItemSchema)),
  },
  computer: {
    status: oc.input(botId).output(ComputerStatusSchema),
    takeover: oc.input(botId).output(ComputerStatusSchema),
    release: oc.input(botId).output(ComputerStatusSchema),
  },
  memory: {
    list: oc
      .input(z.object({ botId: Id.optional() }))
      .output(z.array(MemoryDocumentSchema)),
  },
  routines: {
    list: oc.input(botId).output(z.array(RoutineSchema)),
  },
});

export type AppContract = typeof appContract;
