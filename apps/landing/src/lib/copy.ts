export const SOURCE_REPO = "https://github.com/muhajirdev/grogbot";

export const HERO = {
  kicker: "Open-source Grok Bot",
  title: "Your own team of AI bots, in a chat app.",
  lede: "Every bot is a named teammate — its own job, thread, and computer. Message them like contacts. Watch them work. Approve what matters. You host it.",
} as const;

export const HERO_TICKS = [
  "Open source · bring your own model keys",
  "Every bot can drive a real computer while you watch",
  "Approvals in chat · optional Gmail, Slack, GitHub",
] as const;

export const STEPS = [
  {
    n: "1",
    title: "Create a Bot",
    body: "Name it, give it a job, pick the workspace Desk or a new computer. It shows up like a contact — no workflow builder.",
  },
  {
    n: "2",
    title: "Give it a real task",
    body: "Outcome, sources, constraints, when to stop. First message can be a file summary with no connector at all.",
  },
  {
    n: "3",
    title: "Watch, then approve",
    body: "Streaming replies, tool chips, a live computer pane. Risky work becomes Allow / Deny in the thread. Closing the pane does not stop the work.",
  },
] as const;

export const FEATURES = [
  {
    id: "teammates",
    title: "Bots as contacts",
    body: "A roster, not a canvas. Search, pin, duplicate, hide. Each Bot has a name, title, description, and one office thread.",
  },
  {
    id: "computer",
    title: "A computer they can drive",
    body: "Live preview while they work. Take over for a password, 2FA, or payment — on the computer, not in chat.",
  },
  {
    id: "approvals",
    title: "Approvals in chat",
    body: "Shell, edits, and questions surface as inline cards. You decide; the Bot continues. Nothing risky runs silently.",
  },
  {
    id: "apps",
    title: "Connected apps",
    body: "Optional Composio for Gmail, Slack, GitHub, Notion, Linear, and the rest. OAuth when they hit a wall.",
  },
  {
    id: "desk",
    title: "Desk by default",
    body: "Teammates share files and logins on the workspace Desk, one mouse at a time. New computer = private logins.",
  },
  {
    id: "host",
    title: "You host it",
    body: "Postgres for the team. One Rivet actor per Bot. Web first, same office in desktop. Bring your own keys.",
  },
] as const;

export type FeatureId = (typeof FEATURES)[number]["id"];

export const JOBS = [
  {
    title: "Sales Outbound",
    pitch:
      "Draft follow-ups from the account list. Do not send mail. Ask before anything leaves the thread.",
  },
  {
    title: "Talent Scout",
    pitch:
      "Source candidates from the brief. Never email anyone without approval. End with a shortlist and why.",
  },
  {
    title: "Paid Media",
    pitch:
      "Pull spend and results from the sources you name. Cite the sheet. Never change live campaigns.",
  },
  {
    title: "Expense Manager",
    pitch:
      "Read receipts and statements. Flag anything over policy. Never submit or pay. Return a table of exceptions.",
  },
  {
    title: "Product Performance",
    pitch:
      "Pull the numbers you name. Cite the source. Never change production dashboards. Five bullets, then open questions.",
  },
  {
    title: "Bug Reproduction",
    pitch:
      "Reproduce the bug from the report. Write steps, expected vs actual, and a minimal fixture. Do not change production.",
  },
  {
    title: "Account Health",
    pitch:
      "Watch the accounts you name. Flag churn risk with evidence. Do not message the customer until you say so.",
  },
  {
    title: "Chief of Staff",
    pitch:
      "Turn messy notes into decisions, owners, and dates. Stop if you would need to message anyone outside.",
  },
] as const;

export const APPS = [
  "Gmail",
  "Slack",
  "GitHub",
  "Notion",
  "Linear",
  "Calendar",
] as const;

export const FAQS = [
  {
    q: "Is this a chatbot?",
    a: "Each Bot is a named teammate with a job, a thread, and a real computer. They work in your tools the way you would, then come back when they need approval.",
  },
  {
    q: "Do I need a workflow builder?",
    a: "No. Create a Bot, message it, grant access as needed. There isn’t anything to learn — it’s like bringing on a coworker.",
  },
  {
    q: "Where does the computer live?",
    a: "The workspace Desk is shared by default — files and logins, one mouse. Give a Bot a new computer when the logins should stay private. Closing the pane does not stop the work.",
  },
  {
    q: "Who hosts it? Is my data local-only?",
    a: "You host it. Grogbot is open source: Postgres for the team, one actor per Bot. Bring your own model keys. It is not a local CLI harness on your laptop — the office is a web app you run.",
  },
  {
    q: "Which models?",
    a: "Bring your own keys. Pick a brain per Bot from the catalog. First tasks can be a file summary with no connector and no plugin.",
  },
  {
    q: "Where do I talk to a Bot?",
    a: "In the web office — a messaging app of named teammates. Desktop is that same UI in a window. Mobile comes later on the same API.",
  },
] as const;

export const PAGE_TITLE = "Grogbot — your own team of AI bots, in a chat app";
export const PAGE_DESCRIPTION =
  "Open-source Grok Bot. Named teammates with a real computer. Message them, watch them work, approve what matters. You host it. Bring your own keys.";
