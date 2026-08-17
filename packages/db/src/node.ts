import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index.js";
import type { DbHandles } from "./types.js";

export function createDb(url: string): DbHandles & { client: postgres.Sql } {
  const client = postgres(url, { max: 10 });
  const db = drizzle(client, { schema });
  return {
    db,
    client,
    close: () => client.end({ timeout: 5 }),
  };
}
