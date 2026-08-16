export type UseCase = {
  slug: string;
  title: string;
  kicker: string;
  lede: string;
  problem: string;
  whatTheBotDoes: string[];
  neverWithoutApproval: string[];
  integrationSlugs: string[];
  firstMessage: string;
  faqs: Array<{ q: string; a: string }>;
};

export function getUseCase(slug: string): UseCase | undefined {
  return USE_CASES.find((item) => item.slug === slug);
}

export const USE_CASES: UseCase[] = [
  {
    slug: "sales-outbound",
    title: "Sales outbound",
    kicker: "Hire a closer who does not send mail",
    lede: "Draft follow-ups from the account list. Do not send. Ask before anything leaves the thread.",
    problem:
      "Outbound dies in the gap between the CRM and the inbox. You know who to ping. You do not want a Bot spraying sequences.",
    whatTheBotDoes: [
      "Read the accounts you name in HubSpot, Salesforce, or a sheet.",
      "Draft the follow-up in the Bot thread, with the last touch cited.",
      "Stop before Gmail or Outlook sends.",
    ],
    neverWithoutApproval: [
      "Send email",
      "Enroll someone in a sequence",
      "Create or delete CRM records",
    ],
    integrationSlugs: ["hubspot", "salesforce", "gmail", "outlook", "linkedin"],
    firstMessage:
      "Draft follow-ups for this account list. Cite the last CRM touch. Do not send mail.",
    faqs: [
      {
        q: "Will it spam my pipeline?",
        a: "No. Grogbot drafts. You grant send when the copy is right. There is no sequence canvas.",
      },
      {
        q: "Which CRM?",
        a: "Whatever Composio lists — HubSpot, Salesforce, Pipedrive, and the rest — or the CRM in the browser on the computer.",
      },
    ],
  },
  {
    slug: "social-scheduling",
    title: "Social scheduling",
    kicker: "A teammate for Postiz, Post Bridge, and Typefully",
    lede: "Indie schedulers already exist. Grogbot is the coworker who fills the calendar and never hits publish.",
    problem:
      "You already pay Postiz, Post Bridge, or Typefully. The work is still sitting down every Sunday to write the week.",
    whatTheBotDoes: [
      "Turn a brief into drafts on Postiz or Post Bridge.",
      "Use Typefully or X through Composio when those connectors exist.",
      "Leave posts as drafts or scheduled — publish stays yours.",
    ],
    neverWithoutApproval: [
      "Publish to any network",
      "Connect a new social account",
      "Change the handle",
    ],
    integrationSlugs: ["postiz", "post-bridge", "typefully", "twitter", "linkedin"],
    firstMessage:
      "Draft this week's posts for Postiz and Post Bridge from this brief. Do not publish.",
    faqs: [
      {
        q: "Postiz already has an agent. Why Grogbot?",
        a: "Postiz drives Postiz. Grogbot is the teammate that also has Gmail, GitHub, and a computer — one thread when the post needs a screenshot from the product.",
      },
      {
        q: "Jack Friks / Marc Lou tools?",
        a: "Post Bridge is a first-class computer integration. Same for DataFast when the caption needs a real revenue number.",
      },
    ],
  },
  {
    slug: "founder-analytics",
    title: "Founder analytics",
    kicker: "DataFast, not a BI warehouse",
    lede: "Pull the numbers you name. Cite the source. Never change production dashboards. Five bullets, then open questions.",
    problem:
      "GA4 is a maze. You bought DataFast to see which tweets made money. You still spend Monday reconstructing the week.",
    whatTheBotDoes: [
      "Read DataFast (computer) plus Stripe, Polar, or Google Analytics when connected.",
      "Answer 'what actually converted' with citations.",
      "Leave pixels and goals untouched.",
    ],
    neverWithoutApproval: [
      "Edit tracking",
      "Change dashboards",
      "Refund or alter Stripe/Polar products",
    ],
    integrationSlugs: [
      "datafast",
      "stripe",
      "polar",
      "google_analytics",
      "plausible_analytics",
      "mixpanel",
    ],
    firstMessage:
      "From DataFast and Stripe, what drove paying customers this week? Cite sources. Do not change dashboards.",
    faqs: [
      {
        q: "Does this replace DataFast?",
        a: "No. DataFast stays the source of truth. The Bot is the analyst who opens it and writes the memo.",
      },
      {
        q: "Marc Lou's other products?",
        a: "ShipFast, TrustMRR, Zenvoice, ByeDispute, and Indie Page have their own integration pages. Analytics work starts here.",
      },
    ],
  },
  {
    slug: "talent-scout",
    title: "Talent scout",
    kicker: "A sourcer who does not email anyone",
    lede: "Source candidates from the brief. Never email anyone without approval. End with a shortlist and why.",
    problem:
      "Sourcing is tabs: LinkedIn, the ATS, the doc. You want a shortlist, not a Bot sliding into DMs.",
    whatTheBotDoes: [
      "Read the brief. Search the sources you name.",
      "Write a shortlist: why them, why not, links.",
      "Stop before LinkedIn or Gmail sends.",
    ],
    neverWithoutApproval: [
      "Email or InMail a candidate",
      "Change ATS stage",
      "Reject someone",
    ],
    integrationSlugs: ["linkedin", "gmail", "notion", "airtable", "googlecalendar"],
    firstMessage:
      "Source candidates from this brief. Shortlist of 8 with why. Do not email anyone.",
    faqs: [
      {
        q: "Will it spam LinkedIn?",
        a: "No. It reads and writes a memo. Outreach waits for you.",
      },
    ],
  },
  {
    slug: "paid-media",
    title: "Paid media",
    kicker: "Numbers first. No live campaign edits.",
    lede: "Pull spend and results from the sources you name. Cite the sheet. Never change live campaigns.",
    problem:
      "The ad account is a loaded gun. You want yesterday's ROAS in Slack-quality prose, not a Bot with admin on Meta.",
    whatTheBotDoes: [
      "Read Google Ads, Meta, or the sheet you name.",
      "Cite spend, results, and the date range.",
      "Propose a change list. Do not click it live.",
    ],
    neverWithoutApproval: [
      "Change bids, budgets, or targeting",
      "Publish a new ad",
      "Pause a campaign",
    ],
    integrationSlugs: [
      "googleads",
      "facebook",
      "googlesheets",
      "datafast",
      "slack",
    ],
    firstMessage:
      "Pull spend and results for these campaigns. Cite the source. Do not change anything live.",
    faqs: [
      {
        q: "Can it pause a bleeding campaign?",
        a: "It can tell you to. It will not pause until you say so — even at 2am.",
      },
    ],
  },
  {
    slug: "expense-manager",
    title: "Expense manager",
    kicker: "Receipts in. Policy out. No payments.",
    lede: "Read receipts and statements. Flag anything over policy. Never submit or pay. Return a table of exceptions.",
    problem:
      "The pile is PDFs, Stripe, and a card statement. You need exceptions, not another finance SaaS.",
    whatTheBotDoes: [
      "Read the files and the Stripe/Polar/Zenvoice views you name.",
      "Flag over policy. Table: amount, vendor, why it is weird.",
      "Never submit an expense report or pay a bill.",
    ],
    neverWithoutApproval: ["Submit expenses", "Pay or refund", "File taxes"],
    integrationSlugs: ["stripe", "polar", "zenvoice", "gmail", "googledrive"],
    firstMessage:
      "Read these receipts against policy. Table of exceptions. Do not submit or pay.",
    faqs: [
      {
        q: "Does it log into the bank?",
        a: "Only if you open that on the computer and stay for 2FA. It still will not move money.",
      },
    ],
  },
  {
    slug: "bug-reproduction",
    title: "Bug reproduction",
    kicker: "A computer, a ticket, a fixture",
    lede: "Reproduce the bug from the report. Write steps, expected vs actual, and a minimal fixture. Do not change production.",
    problem:
      "The ticket says 'doesn't work'. Someone has to actually click it. That someone can be a Bot with a computer.",
    whatTheBotDoes: [
      "Open Linear, GitHub, or Jira for the issue you name.",
      "Reproduce on the computer. Screenshot. Write steps.",
      "Draft a fixture. Do not patch production.",
    ],
    neverWithoutApproval: [
      "Merge or deploy",
      "Change production",
      "Close the issue",
    ],
    integrationSlugs: ["linear", "github", "jira", "notion", "slack"],
    firstMessage:
      "Reproduce this bug. Steps, expected vs actual, screenshot. Do not change production.",
    faqs: [
      {
        q: "Why not just Copilot?",
        a: "Copilot edits code. This Bot has a computer and the ticket. It clicks the product, then writes the fixture.",
      },
    ],
  },
  {
    slug: "account-health",
    title: "Account health",
    kicker: "Churn risk with evidence",
    lede: "Watch the accounts you name. Flag churn risk with evidence. Do not message the customer until you say so.",
    problem:
      "Health scores lie. You want the last ticket, the last invoice, the last login — in one paragraph.",
    whatTheBotDoes: [
      "Read CRM, support, and billing for the accounts you name.",
      "Flag risk with citations, not a red/green orb.",
      "Draft the save email. Do not send it.",
    ],
    neverWithoutApproval: [
      "Email the customer",
      "Change plan or refund",
      "Close the account",
    ],
    integrationSlugs: ["hubspot", "stripe", "zendesk", "intercom", "slack"],
    firstMessage:
      "Health read on these accounts. Cite CRM, billing, and tickets. Do not message the customer.",
    faqs: [
      {
        q: "Will it nag the customer?",
        a: "No. The memo stays in the Bot thread until you send.",
      },
    ],
  },
  {
    slug: "chief-of-staff",
    title: "Chief of staff",
    kicker: "Messy notes in. Decisions out.",
    lede: "Turn messy notes into decisions, owners, and dates. Stop if you would need to message anyone outside.",
    problem:
      "The week lives in Notion, Slack, and a voice memo. You need a decision log, not another meeting.",
    whatTheBotDoes: [
      "Read the sources you name. Extract decisions, owners, dates.",
      "Write the log in the thread (or a Notion draft).",
      "Stop before Slack-blasting the company.",
    ],
    neverWithoutApproval: [
      "Message anyone outside the thread",
      "Create calendar invites",
      "Overwrite the source doc",
    ],
    integrationSlugs: ["notion", "slack", "googlecalendar", "gmail", "linear"],
    firstMessage:
      "Turn these notes into decisions, owners, and dates. Do not message anyone.",
    faqs: [
      {
        q: "Is this an orchestration canvas?",
        a: "No. It is a person in the sidebar. You message it. It files the week.",
      },
    ],
  },
  {
    slug: "inbox-triage",
    title: "Inbox triage",
    kicker: "Gmail without the guilt",
    lede: "Sort the pile. Draft the replies. Never send. The inbox is still yours.",
    problem:
      "Support, founders, and sales all land in one Gmail. You need a triage, not auto-send.",
    whatTheBotDoes: [
      "Fetch unread from Gmail or Outlook for the labels you name.",
      "Bucket: reply, wait, archive. Draft the replies.",
      "Do not send, delete, or auto-forward.",
    ],
    neverWithoutApproval: ["Send", "Delete in bulk", "Change forwarding"],
    integrationSlugs: ["gmail", "outlook", "googlecalendar", "slack", "linear"],
    firstMessage:
      "Triage unread from yesterday. Draft replies. Do not send.",
    faqs: [
      {
        q: "Does it need Composio?",
        a: "Gmail and Outlook are Composio toolkits — connect them under Plugins. First tasks can still be a file summary with no connector.",
      },
    ],
  },
  {
    slug: "shipping-updates",
    title: "Shipping updates",
    kicker: "GitHub and Linear, in English",
    lede: "What shipped, what is stuck, what needs you. No merge, no deploy.",
    problem:
      "The changelog is a PR list. The team wants a paragraph.",
    whatTheBotDoes: [
      "Read GitHub and Linear for the range you name.",
      "Write shipped / stuck / needs a human.",
      "Draft the customer-facing note. Do not publish it.",
    ],
    neverWithoutApproval: ["Merge", "Deploy", "Close issues"],
    integrationSlugs: ["github", "linear", "jira", "slack", "notion"],
    firstMessage:
      "What shipped this week in GitHub and Linear? Stuck vs needs me. Do not merge or close.",
    faqs: [
      {
        q: "Can it review a PR?",
        a: "It can read the diff and comment in the Bot thread. It will not approve or merge until you say so.",
      },
    ],
  },
  {
    slug: "indie-stack",
    title: "Indie hacker stack",
    kicker: "Marc Lou, Jack Friks, and the rest of Twitter",
    lede: "DataFast for revenue, Postiz or Post Bridge for posts, Polar or Stripe for money. One Bot, no Zapier cartoon.",
    problem:
      "The indie stack is ten tabs: analytics, scheduler, payments, GitHub, Gmail. You do not want a workflow builder. You want a coworker.",
    whatTheBotDoes: [
      "Open DataFast for what made money.",
      "Draft the week's posts in Postiz or Post Bridge.",
      "Check Polar/Stripe and GitHub. One memo. Nothing live without you.",
    ],
    neverWithoutApproval: [
      "Publish social",
      "Change prices",
      "Tweet as you",
    ],
    integrationSlugs: [
      "datafast",
      "postiz",
      "post-bridge",
      "polar",
      "stripe",
      "twitter",
      "github",
    ],
    firstMessage:
      "Indie stack check: DataFast revenue, Postiz drafts, Polar orders, GitHub shipped. Do not publish or change prices.",
    faqs: [
      {
        q: "Which indie products are first-class?",
        a: "DataFast, Postiz, Post Bridge, ShipFast, TrustMRR, Zenvoice, ByeDispute, Indie Page, and Polar. Composio covers Gmail, GitHub, Typefully, Stripe, and hundreds more.",
      },
      {
        q: "Do I need every connector?",
        a: "No. The computer covers the tools Composio does not list yet. Connect the rest when a Bot hits a wall.",
      },
    ],
  },
];
