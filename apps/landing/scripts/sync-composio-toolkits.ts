/**
 * Snapshot Composio's public toolkit catalog for landing SEO pages.
 * Offline tests read the JSON this writes — do not fetch Composio at runtime.
 *
 *   pnpm --filter @groxbot/landing sync:composio
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  type ComposioToolkit,
  slimToolkit,
} from "../src/lib/composio-catalog.ts";

const SOURCE =
  "https://raw.githubusercontent.com/ComposioHQ/composio/master/docs/public/data/toolkits.json";

async function main(): Promise<void> {
  const res = await fetch(SOURCE);
  if (!res.ok) {
    throw new Error(`Composio catalog fetch failed: ${res.status} ${res.statusText}`);
  }
  const payload: unknown = await res.json();
  if (!Array.isArray(payload)) {
    throw new Error("Composio catalog is not an array");
  }
  const items = payload
    .map((row) => slimToolkit(row as Parameters<typeof slimToolkit>[0]))
    .filter((row): row is ComposioToolkit => row !== undefined);
  const seen = new Set<string>();
  const unique = items.filter((item) => {
    if (seen.has(item.slug)) return false;
    seen.add(item.slug);
    return true;
  });
  const outDir = join(dirname(fileURLToPath(import.meta.url)), "../src/data");
  const dest = join(outDir, "composio-toolkits.json");
  writeFileSync(dest, `${JSON.stringify(unique)}\n`);
  console.log(`Wrote ${unique.length} toolkits to ${dest}`);
}

if (process.argv[1]?.includes("sync-composio-toolkits")) {
  main().catch((err: unknown) => {
    console.error(err);
    process.exit(1);
  });
}
