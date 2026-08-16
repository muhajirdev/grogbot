import {
  type DiscoveryOrigins,
  GROGBOT_APP,
  GROGBOT_GITHUB,
  GROGBOT_LICENSE,
  GROGBOT_NAME,
  GROGBOT_SUMMARY,
  GROGBOT_UPDATED,
  GROGBOT_VERSION,
} from "./identity.js";

function abs(origin: string, path: string): string {
  return `${origin.replace(/\/$/, "")}${path}`;
}

export const PRESS_SHORT =
  "Grogbot is Grok Bot for teams: named AI teammates with a real computer. If OpenClaw is for your personal use, Grogbot is for the office. Self-hostable. No workflow builder.";

export const PRESS_MEDIUM = GROGBOT_SUMMARY;

export const PRESS_LONG = `${GROGBOT_NAME} is a messaging app of named AI teammates, not a workflow builder, IDE, or Discord. You hire a Bot — name, optional job, description, avatar — then talk to it in a thread. Each Bot has a real computer. Teammates share the workspace Desk by default; you can give a Bot an isolated computer when logins should stay private.

The name is a joke that stuck: Grok, then grog. It copies Grok Bot’s simplicity (talk first, grant access when they hit a wall) and is fair-code so you can self-host. Bring your own model keys. Gmail, Slack, GitHub, and 1,000+ tools connect in the thread. Indie tools run on the computer. Self-host for your organization is free. Hosted Grogbot for others is grogbot.com.`;

export const PRESS_BOILERPLATE = [
  { id: "short", label: "Short", text: PRESS_SHORT },
  { id: "medium", label: "Medium", text: PRESS_MEDIUM },
  { id: "long", label: "Long", text: PRESS_LONG },
] as const;

export const PRESS_COLORS = [
  {
    name: "Accent",
    hex: "#e45c9a",
    note: "Mark, mascot default, hire-me pink",
  },
  {
    name: "Ink",
    hex: "#f4f4f4",
    note: "Type on dark chrome",
  },
  {
    name: "Background",
    hex: "#000000",
    note: "Marketing site and office",
  },
  {
    name: "Ok",
    hex: "#3ecf8e",
    note: "Done / working well",
  },
] as const;

export const PRESS_NAMES_OK = [
  "Grogbot (canonical, one word, capital G)",
  "grogbot.com (website)",
  "@grogbot/* (npm packages)",
] as const;

export const PRESS_NAMES_NO = [
  "GrogBot (camel-case B)",
  "Grokbot",
  "xAI Grok Bot, Grok Bot by xAI, or Cursor Grok Bot for this project",
  "Rekan (retired scaffold name)",
] as const;

export const PRESS_VOICE = [
  "A Bot is a teammate (contact), not a workflow node.",
  "Computer means a workspace desk / sandbox, not the LLM.",
  "Desk is the default shared computer; a new computer is isolated.",
  "First action is talk, not configure a graph.",
  "Do not call the product an agent builder, copilot IDE, or Discord.",
] as const;

export const PRESS_ASSETS = [
  {
    file: "grogbot-mark.svg",
    label: "Mark",
    note: "Transparent mascot. Use this most of the time.",
  },
  {
    file: "grogbot-mark-dark.svg",
    label: "Mark on dark",
    note: "Rounded tile for dark slides and sites.",
  },
  {
    file: "grogbot-mark-light.svg",
    label: "Mark on light",
    note: "Rounded tile for light backgrounds.",
  },
  {
    file: "grogbot-lockup-dark.svg",
    label: "Lockup on dark",
    note: "Mascot plus the word Grogbot.",
  },
  {
    file: "grogbot-lockup-light.svg",
    label: "Lockup on light",
    note: "Same lockup for light backgrounds.",
  },
] as const;

export function pressFacts(origins: DiscoveryOrigins): Array<{
  label: string;
  value: string;
  href?: string;
}> {
  const web = origins.web.replace(/\/$/, "");
  return [
    { label: "Product", value: GROGBOT_NAME },
    { label: "Site", value: web.replace(/^https:\/\//, ""), href: `${web}/` },
    {
      label: "Office",
      value: GROGBOT_APP.replace(/^https:\/\//, ""),
      href: `${GROGBOT_APP}/login`,
    },
    {
      label: "Source",
      value: "github.com/muhajirdev/grogbot",
      href: GROGBOT_GITHUB,
    },
    {
      label: "License",
      value: GROGBOT_LICENSE,
      href: `${GROGBOT_GITHUB}/blob/main/LICENSE`,
    },
    {
      label: "Press kit",
      value: `${web.replace(/^https:\/\//, "")}/press`,
      href: abs(web, "/press"),
    },
  ];
}

export function pressMarkdown(origins: DiscoveryOrigins): string {
  const web = origins.web.replace(/\/$/, "");
  const facts = pressFacts(origins)
    .map((fact) => `- ${fact.label}: ${fact.href ?? fact.value}`)
    .join("\n");
  const assets = PRESS_ASSETS.map(
    (asset) =>
      `- [${asset.label}](${abs(web, `/press/${asset.file}`)}): ${asset.note}`,
  ).join("\n");
  return `# ${GROGBOT_NAME} press kit
# ${abs(web, "/press")}
# Version: ${GROGBOT_VERSION}
# Last Updated: ${GROGBOT_UPDATED}

Human page: ${abs(web, "/press")}
Brand rules: ${abs(web, "/brand.txt")}

## Boilerplate

### Short

${PRESS_SHORT}

### Medium

${PRESS_MEDIUM}

### Long

${PRESS_LONG}

## Facts

${facts}

## Name

Use:
${PRESS_NAMES_OK.map((item) => `- ${item}`).join("\n")}

Do not use:
${PRESS_NAMES_NO.map((item) => `- ${item}`).join("\n")}

## Voice

${PRESS_VOICE.map((item) => `- ${item}`).join("\n")}

## Colors

${PRESS_COLORS.map((color) => `- ${color.name}: ${color.hex} — ${color.note}`).join("\n")}

## Logos

SVG only. Do not add drop shadows, recolor the mascot away from ${PRESS_COLORS[0]?.hex}, replace the two slits, or draw a photoreal head.

${assets}

## Contact

GitHub: ${GROGBOT_GITHUB}
Do not invent a press email, pricing page, or Ultra paywall.
`;
}
