/** The 6–8 minute guided client walkthrough. Each step opens the right page. */
export interface WalkStep {
  id: string;
  title: string;
  body: string;
  href: string;
  proves?: "accuracy" | "repeat" | "format";
}

export const WALKTHROUGH: WalkStep[] = [
  {
    id: "pitch",
    title: "The brief, answered on one page",
    body: "Start here. The opening section restates the problem, then shows the three things Milestone 1 has to prove. Scroll, or press Next to try it.",
    href: "/",
  },
  {
    id: "consent",
    title: "Permission first, then the first sync",
    body: "Ava is signed in to her school portal. Click the ClassPano Sync panel, read what it can and can't do, allow it, then press Sync this page on Assignment Center. Watch each row get read.",
    href: "/sync",
    proves: "accuracy",
  },
  {
    id: "browse",
    title: "Browse the portal, capture as you go",
    body: "Open Schedule, Progress and the Biology class page using the portal tabs, and sync each one. The calendar repeats the same assignments, and ClassPano matches them by Blackbaud's own ids, so nothing is stored twice.",
    href: "/sync",
    proves: "accuracy",
  },
  {
    id: "resync",
    title: "Teachers update. Sync again.",
    body: "Press Simulate teacher updates in the extension, then sync Assignment Center again: 1 new, 4 updated, 14 unchanged, 0 duplicates. Every change is logged field by field.",
    href: "/sync",
    proves: "repeat",
  },
  {
    id: "dashboard",
    title: "One dashboard instead of six pages",
    body: "Due today, this week, missing work and grades in one view. Each fact shows its source, so verified school data never blurs into AI suggestions.",
    href: "/dashboard",
  },
  {
    id: "data",
    title: "The same format for every platform",
    body: "Every record is stored as cp.academic.v1, with an identity key, a fingerprint, its source and a full change history, whichever platform supplied it. Export it or delete it here.",
    href: "/dashboard/data",
    proves: "format",
  },
  {
    id: "capture",
    title: "Unsupported site? AI capture with review",
    body: "On a teacher's own class website, ClassPano proposes items with confidence scores and saves nothing until the student confirms. Two of them match existing Blackbaud records and merge instead of duplicating.",
    href: "/sync?tab=capture",
  },
  {
    id: "insights",
    title: "AI briefing, clearly labeled",
    body: "Switch between the Student and Parent views. Every suggestion is labeled as AI and names the verified records it was based on.",
    href: "/dashboard/insights",
  },
  {
    id: "architecture",
    title: "Architecture and limitations",
    body: "How platform modules plug in, the dedupe algorithm, the privacy model, and the policy questions to settle before a commercial launch.",
    href: "/architecture",
  },
  {
    id: "proposal",
    title: "Proposal, phases and pricing",
    body: "Answers to all seven questions, Phase 1 milestones at a fixed price, optional features quoted separately, and Phases 2–4.",
    href: "/proposal",
  },
];
