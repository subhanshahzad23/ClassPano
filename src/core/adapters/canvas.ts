import { emptyResult, type ExtractResult, type PlatformAdapter } from "./types";

/*
 * Canvas LMS adapter (preview). Shows how a second platform plugs in without
 * touching the extension shell, the schema or the dashboard. Canvas pages are
 * driven by Canvas's documented REST API, so this adapter asks the page's own
 * origin for the planner feed in the student's session instead of reading markup.
 */

interface CanvasPlannerItem {
  plannable_id: number | string;
  plannable_type: string;
  context_name?: string;
  course_id?: number;
  plannable_date?: string;
  plannable?: { title?: string; points_possible?: number; due_at?: string; created_at?: string };
  submissions?: { submitted?: boolean; graded?: boolean; missing?: boolean; late?: boolean } | false;
}

export const canvasAdapter: PlatformAdapter = {
  id: "canvas",
  name: "Canvas LMS",
  version: "0.1.0-preview",
  status: "preview",

  matches(ctx) {
    try {
      const host = new URL(ctx.url).hostname;
      return /\.instructure\.com$/i.test(host) || !!ctx.root.querySelector("#application.ic-app");
    } catch {
      return false;
    }
  },

  detectPage() {
    return "assignments";
  },

  async extract(ctx): Promise<ExtractResult> {
    const out = emptyResult("assignments");
    if (!ctx.fetchJson) {
      out.warnings.push("Canvas reads the planner feed in the student's session; no fetch available here.");
      return out;
    }
    const items = (await ctx.fetchJson("/api/v1/planner/items?per_page=100")) as CanvasPlannerItem[];
    for (const it of items) {
      if (!["assignment", "quiz", "discussion_topic"].includes(it.plannable_type)) continue;
      const s = it.submissions || undefined;
      out.assignments.push({
        externalId: String(it.plannable_id),
        courseExternalId: it.course_id != null ? String(it.course_id) : undefined,
        courseName: it.context_name ?? "Canvas course",
        typeText: it.plannable_type === "quiz" ? "Quiz" : "Homework",
        title: it.plannable?.title ?? "Untitled",
        dueText: (it.plannable?.due_at ?? it.plannable_date ?? "").slice(0, 10),
        assignedText: it.plannable?.created_at?.slice(0, 10),
        pointsText: it.plannable?.points_possible != null ? `${it.plannable.points_possible} pts` : undefined,
        statusText: s?.missing ? "Missing" : s?.graded ? "Graded" : s?.submitted ? "Completed" : "To Do",
      });
    }
    return out;
  },
};
