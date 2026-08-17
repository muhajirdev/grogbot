import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema/index.js";
import type { DbHandles } from "./types.js";

export type { Database, DbHandles } from "./types.js";

export function createNeonHttpDb(url: string): DbHandles {
  const sql = neon(url);
  const db = drizzle(sql, { schema });
  return {
    db,
    close: async () => {},
  };
}

export * from "./schema/index.js";
export { schema };
