import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import type { AdapterContext, HomeStore, PortableFile } from "@rekan/adapter-kit";

export class DiskHomeStore implements HomeStore {
  constructor(private readonly root: string) {}

  private botRoot(botId: string) {
    return path.resolve(this.root, "homes", botId);
  }

  private resolve(botId: string, rel: string) {
    const base = this.botRoot(botId);
    const full = path.resolve(base, rel.replace(/^\/+/, ""));
    if (!full.startsWith(base)) throw new Error("path escapes bot home");
    return full;
  }

  async readFile(botId: string, filePath: string, _context: AdapterContext): Promise<string> {
    return readFile(this.resolve(botId, filePath), "utf8");
  }

  async writeFile(
    botId: string,
    filePath: string,
    content: string,
    _context: AdapterContext,
  ): Promise<void> {
    const full = this.resolve(botId, filePath);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, content, "utf8");
  }

  async list(botId: string, dirPath: string, _context: AdapterContext) {
    const full = this.resolve(botId, dirPath);
    await mkdir(full, { recursive: true });
    const entries = await readdir(full, { withFileTypes: true });
    const out: Array<{ path: string; kind: "file" | "dir"; size: number }> = [];
    for (const entry of entries) {
      const info = await stat(path.join(full, entry.name));
      out.push({
        path: entry.name,
        kind: entry.isDirectory() ? "dir" : "file",
        size: info.size,
      });
    }
    return out;
  }

  async *exportHome(botId: string, _context: AdapterContext): AsyncIterable<PortableFile> {
    const base = this.botRoot(botId);
    await mkdir(base, { recursive: true });
    yield* walk(base, "");
  }
}

async function* walk(root: string, prefix: string): AsyncIterable<PortableFile> {
  const entries = await readdir(root, { withFileTypes: true });
  for (const entry of entries) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) {
      yield* walk(full, rel);
    } else {
      yield { path: rel, content: await readFile(full, "utf8") };
    }
  }
}
