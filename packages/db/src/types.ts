import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "./schema/index.js";

export type Database =
  | PostgresJsDatabase<typeof schema>
  | NeonHttpDatabase<typeof schema>;

export type DbHandles = {
  db: Database;
  close: () => Promise<void>;
};
