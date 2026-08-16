export type PluginKind = "connector" | "skill";

export type PluginCard = {
  id: string;
  name: string;
  blurb: string;
  category: string;
  kind: PluginKind;
};

export const PLUGIN_CATALOG: PluginCard[] = [
  {
    id: "gmail",
    name: "Gmail",
    blurb: "Read and draft mail when a Bot hits a wall.",
    category: "Featured",
    kind: "connector",
  },
  {
    id: "gcal",
    name: "Google Calendar",
    blurb: "Check the week. Never send invites on its own.",
    category: "Featured",
    kind: "connector",
  },
  {
    id: "gdrive",
    name: "Google Drive",
    blurb: "Open the docs you name in chat.",
    category: "Featured",
    kind: "connector",
  },
  {
    id: "granola",
    name: "Granola",
    blurb: "Pull meeting notes into a handoff.",
    category: "Featured",
    kind: "connector",
  },
  {
    id: "linear",
    name: "Linear",
    blurb: "Find issues. Never change status without you.",
    category: "Agent Orchestration",
    kind: "connector",
  },
  {
    id: "arize",
    name: "Arize",
    blurb: "Watch traces the Bot should not invent.",
    category: "Agent Orchestration",
    kind: "connector",
  },
  {
    id: "atlan",
    name: "Atlan",
    blurb: "Cite the catalog, not a guess.",
    category: "Agent Orchestration",
    kind: "connector",
  },
  {
    id: "aws-agents",
    name: "AWS Agents",
    blurb: "Call an AWS agent when you say so.",
    category: "Agent Orchestration",
    kind: "connector",
  },
  {
    id: "docs-canvas",
    name: "Docs Canvas",
    blurb: "Draft long-form in a canvas, not a wall of chat.",
    category: "Canvas",
    kind: "skill",
  },
  {
    id: "pr-canvas",
    name: "PR Review Canvas",
    blurb: "Review a diff in place.",
    category: "Canvas",
    kind: "skill",
  },
];

const KEY = "grogbot.plugins";

export function readAddedPlugins(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function writeAddedPlugins(ids: string[]): void {
  localStorage.setItem(KEY, JSON.stringify(ids));
}

export function readConnectedPlugins(): string[] {
  try {
    const raw = localStorage.getItem(`${KEY}.connected`);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function writeConnectedPlugins(ids: string[]): void {
  localStorage.setItem(`${KEY}.connected`, JSON.stringify(ids));
}
