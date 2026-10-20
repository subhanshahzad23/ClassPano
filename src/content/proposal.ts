/*
 * Every number and promise in the proposal lives here, so pricing and
 * timelines can be changed in one place before sending.
 */

export const PHASE1 = {
  price: 3900,
  weeks: 4,
  summary: "Fixed price, four weekly milestones, each with a demo you can click.",
  milestones: [
    {
      week: "Week 1",
      title: "Blackbaud discovery on your test account",
      price: 900,
      items: [
        "Map Assignment Center, Schedule, Progress and class pages on the authorized test account",
        "Confirm the JSON the portal itself loads (sturdier than reading markup) and lock the selector table",
        "Capture anonymized fixtures for automated tests",
        "Written go / no-go on extraction accuracy before more is built",
      ],
    },
    {
      week: "Week 2",
      title: "MV3 extension and the Blackbaud module",
      price: 1200,
      items: [
        "Manifest V3 extension: side panel, consent screen, activeTab-scoped reading",
        "Platform-module interface and registry (the plug-in point for every future platform)",
        "Blackbaud module: assignments, due dates, classes, details, grades, announcements",
        "Normalizer to the cp.academic.v1 format, with validation",
      ],
    },
    {
      week: "Week 3",
      title: "Sync backend, dedupe and change detection",
      price: 1000,
      items: [
        "Authenticated sync API and Postgres schema (student, sources, records, change log)",
        "Identity keys, fingerprints and the fuzzy matcher. Repeat syncs never duplicate",
        "Field-level change history (due date moved, grade posted, marked missing)",
        "Fixture tests that replay sync 1 → sync 2 and assert exact counts",
      ],
    },
    {
      week: "Week 4",
      title: "Demo dashboard, documentation, handoff",
      price: 800,
      items: [
        "Simple dashboard: upcoming, missing, recent changes, per-class view",
        "Architecture, limitations and next-steps documentation",
        "Recorded walkthrough plus a live review call",
        "Source code in your repository, with setup instructions",
      ],
    },
  ],
};

export const OPTIONAL = [
  {
    id: "ai-capture",
    title: "AI-assisted page capture with review",
    price: 1100,
    days: "+5 working days",
    body: "Select text on any unsupported site; an LLM returns structured items with confidence and evidence; the student confirms before anything saves. Includes cross-source matching so a test seen on a teacher's site merges into the Blackbaud record.",
    demo: "/sync?tab=capture",
  },
  {
    id: "second-platform",
    title: "Second-platform demonstration (Canvas)",
    price: 900,
    days: "+4 working days",
    body: "A Canvas module built on the same interface, reading Canvas's documented planner feed in the student's session. Proves a new platform is one module, not a rebuild.",
    demo: "/architecture#modules",
  },
  {
    id: "llm-summary",
    title: "LLM academic summary",
    price: 600,
    days: "+3 working days",
    body: "Student and parent briefings generated from verified records only, with every sentence traceable to its source and clearly labeled as AI.",
    demo: "/dashboard/insights",
  },
];

export const OPTIONAL_BUNDLE = { price: 2300, note: "All three optional features together (saves $300)" };

export const PHASES = [
  {
    n: 2,
    title: "Full academic dashboard",
    price: "$9,500 – $12,000",
    weeks: "6–8 weeks",
    items: ["Upcoming deadlines, missing work and academic alerts", "Grades and grade-change tracking over time", "Calendar and weekly overview", "Parent and student accounts with linked households (multiple children)", "Notifications (email / push) on changes that matter", "Production hardening: monitoring, audit log, data retention"],
  },
  {
    n: 3,
    title: "AI academic intelligence",
    price: "$7,000 – $9,000",
    weeks: "5–6 weeks",
    items: ["Personalized daily and weekly briefings", "Suggested study schedules around tests and workload", "Struggle detection and grade-trend analysis", "Prioritized recommendations with citations to school records", "Natural-language Q&A (“why did my History grade drop?”)", "Evaluation set and guardrails for minors"],
  },
  {
    n: 4,
    title: "Multi-platform and scale",
    price: "$2,000 – $3,500 per platform module",
    weeks: "1–2 weeks per platform",
    items: ["Schoology, FACTS, Canvas (full), Google Classroom (official API)", "Improved general page capture", "Official API integrations as partnerships land (e.g. Blackbaud SKY API)", "Subscriptions and billing", "Adapter health monitoring with remote selector updates"],
  },
];

export const STACK = [
  { area: "Extension", choice: "TypeScript, Manifest V3, React side panel, esbuild/Vite (WXT)", why: "One codebase, typed platform modules, fast builds; no remotely hosted code, so Chrome Web Store review stays simple." },
  { area: "Shared core", choice: "cp.academic.v1 schema + Zod validation", why: "The same normalizer and dedupe code runs in the extension, on the server and in tests." },
  { area: "Web app", choice: "Next.js (App Router), React, Tailwind", why: "Dashboard, parent and student views, and the sync API in one deployable app." },
  { area: "Data", choice: "Postgres (Neon or Supabase) with row-level security", why: "Relational fits students ↔ classes ↔ records ↔ change log; RLS enforces household boundaries in the database." },
  { area: "Auth", choice: "Clerk or Supabase Auth, household model", why: "Parent and student accounts, linked children, and verifiable parental consent for under-13s." },
  { area: "AI", choice: "Claude or OpenAI via a server endpoint, JSON-schema output", why: "Structured extraction and briefings with zero-retention terms; keys never ship in the extension." },
  { area: "Hosting", choice: "Vercel + managed Postgres, Sentry", why: "Low ops for an MVP, with a clean path to AWS when volume or compliance needs it." },
];
