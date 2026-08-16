export const JOBS = [
  {
    title: "Sales Outbound",
    slug: "sales-outbound",
    pitch:
      "Draft follow-ups from the account list. Do not send mail. Ask before anything leaves the thread.",
  },
  {
    title: "Talent Scout",
    slug: "talent-scout",
    pitch:
      "Source candidates from the brief. Never email anyone without approval. End with a shortlist and why.",
  },
  {
    title: "Paid Media",
    slug: "paid-media",
    pitch:
      "Pull spend and results from the sources you name. Cite the sheet. Never change live campaigns.",
  },
  {
    title: "Expense Manager",
    slug: "expense-manager",
    pitch:
      "Read receipts and statements. Flag anything over policy. Never submit or pay. Return a table of exceptions.",
  },
  {
    title: "Product Performance",
    slug: "founder-analytics",
    pitch:
      "Pull the numbers you name. Cite the source. Never change production dashboards. Five bullets, then open questions.",
  },
  {
    title: "Bug Reproduction",
    slug: "bug-reproduction",
    pitch:
      "Reproduce the bug from the report. Write steps, expected vs actual, and a minimal fixture. Do not change production.",
  },
  {
    title: "Account Health",
    slug: "account-health",
    pitch:
      "Watch the accounts you name. Flag churn risk with evidence. Do not message the customer until you say so.",
  },
  {
    title: "Chief of Staff",
    slug: "chief-of-staff",
    pitch:
      "Turn messy notes into decisions, owners, and dates. Stop if you would need to message anyone outside.",
  },
] as const;

export const FAQS = [
  {
    q: "How is this different from a chatbot?",
    a: "Each Bot is a named teammate with a thread and a real computer. Job title is optional. They work in your tools the way you would, then come back when they need approval.",
  },
  {
    q: "Do I need a workflow builder?",
    a: "No. Create a Bot, message it, grant access as needed. There isn’t anything to learn — it’s like bringing on a coworker.",
  },
  {
    q: "Where does the computer live?",
    a: "Teammates share the workspace default computer — files and logins, one mouse. Give a Bot a new computer when the logins should stay private. Closing the pane does not stop the work.",
  },
  {
    q: "Who hosts it?",
    a: "You do. Self-host for your team is free. Bring your own model keys. Optional Composio for Gmail, Slack, and GitHub. First tasks can be a file summary with no connector at all. Hosted grogbot.com is the cloud product.",
  },
  {
    q: "Where do I talk to a Bot?",
    a: "In the web office — a messaging app of named teammates. Desktop is that same UI in a window. Mobile comes later on the same API.",
  },
] as const;

export const SOURCE_REPO = "https://github.com/muhajirdev/grogbot";
