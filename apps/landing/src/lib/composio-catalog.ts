export type ComposioToolkit = {
  slug: string;
  name: string;
  logo: string;
  description: string;
  category: string;
  toolCount: number;
  triggerCount: number;
  sampleTools: string[];
};

type RawToolkit = {
  slug?: unknown;
  name?: unknown;
  logo?: unknown;
  description?: unknown;
  category?: unknown;
  toolCount?: unknown;
  triggerCount?: unknown;
  tools?: unknown;
};

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asCount(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function sampleToolNames(tools: unknown): string[] {
  if (!Array.isArray(tools)) return [];
  const names: string[] = [];
  for (const tool of tools) {
    if (!tool || typeof tool !== "object") continue;
    const name = asString((tool as { name?: unknown }).name);
    if (!name || names.includes(name)) continue;
    names.push(name);
    if (names.length >= 6) break;
  }
  return names;
}

export function slimToolkit(raw: RawToolkit): ComposioToolkit | undefined {
  const slug = asString(raw.slug).toLowerCase();
  const name = asString(raw.name);
  if (!slug || !name) return undefined;
  return {
    slug,
    name,
    logo: asString(raw.logo),
    description: asString(raw.description),
    category: asString(raw.category) || "other",
    toolCount: asCount(raw.toolCount),
    triggerCount: asCount(raw.triggerCount),
    sampleTools: sampleToolNames(raw.tools),
  };
}
