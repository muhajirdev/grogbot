import * as z from "zod";
import { Id } from "./ids.js";

export const ProductEventSchema = z.object({
  type: z.string(),
  threadId: Id,
  botId: Id,
  runId: Id.nullable().optional(),
  seq: z.number().int(),
  payload: z.record(z.string(), z.unknown()),
  createdAt: z.string(),
});
export type ProductEvent = z.infer<typeof ProductEventSchema>;
