import type { PageKind } from "../schema";
import { emptyResult, type ExtractResult, type PlatformAdapter } from "./types";

/*
 * Blackbaud Education Management (student/parent portal) adapter.
 *
 * Reads four page types: Assignment Center, Schedule, Progress and a class
 * Bulletin Board. Selectors live in one table so a Blackbaud markup change is
 * a one-line fix (and can ship as a remote selector config — data, not code,
 * which MV3 allows). In this demo the selectors target the simulated portal;
 * Milestone 1 confirms them against the authorized Blackbaud test account,
 * including the JSON the portal itself loads, which is sturdier than markup.
 */

export const BB_SELECTORS = {
  assignmentRows: "#assignment-center-assignment-items tbody tr[data-assignment-id]",
  cell: (heading: string) => `td[data-heading="${heading}"]`,
  title: ".wbp-title",
  points: ".wbp-points",
  details: ".wbp-desc",
  score: ".wbp-score",
  status: ".wbp-status",
  calendarItems: ".wbp-calendar .wbp-cal-item[data-assignment-id]",
  calendarEvents: ".wbp-calendar .wbp-cal-event[data-event-id]",
  progressRows: ".wbp-progress .wbp-progress-row[data-section-id]",
  term: "[data-term]",
  bulletins: ".wbp-bulletins .wbp-bulletin",
  classPage: '[data-portal-page="class"]',
  className: ".wbp-classname",
  teacher: ".wbp-teacher",
};

const HOSTS = [/\.myschoolapp\.com$/i, /^portal\.westbrook-academy\.test$/i];

const text = (el: Element | null | undefined) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();

function hostOf(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

export const blackbaudAdapter: PlatformAdapter = {
  id: "blackbaud",
  name: "Blackbaud Education Management",
  version: "0.4.0",
  status: "ready",

  matches(ctx) {
    const host = hostOf(ctx.url);
    if (HOSTS.some((re) => re.test(host))) return true;
    // DOM signature: the portal shell marks itself; survives custom domains.
    return !!ctx.root.querySelector("[data-portal-shell='education-management']");
  },

  detectPage(ctx): PageKind {
    const r = ctx.root;
    if (r.querySelector(BB_SELECTORS.assignmentRows)) return "assignments";
    if (r.querySelector(".wbp-calendar")) return "schedule";
    if (r.querySelector(".wbp-progress")) return "progress";
    if (r.querySelector(BB_SELECTORS.classPage)) return "class";
    return "unknown";
  },

  async extract(ctx): Promise<ExtractResult> {
    const kind = this.detectPage(ctx);
    const out = emptyResult(kind);
    const r = ctx.root;

    if (kind === "assignments") {
      r.querySelectorAll(BB_SELECTORS.assignmentRows).forEach((row) => {
        const cell = (h: string) => row.querySelector(BB_SELECTORS.cell(h));
        const details = cell("Details");
        const title = text(details?.querySelector(BB_SELECTORS.title));
        if (!title) {
          out.warnings.push(`Row ${row.getAttribute("data-assignment-id")} has no title — skipped.`);
          return;
        }
        out.assignments.push({
          externalId: row.getAttribute("data-assignment-id") ?? undefined,
          courseExternalId: row.getAttribute("data-section-id") ?? undefined,
          courseName: text(cell("Class")),
          typeText: text(cell("Type")),
          title,
          pointsText: text(details?.querySelector(BB_SELECTORS.points)) || undefined,
          details: text(details?.querySelector(BB_SELECTORS.details)) || undefined,
          assignedText: text(cell("Assign")),
          dueText: text(cell("Due")),
          statusText: text(cell("Status")?.querySelector(BB_SELECTORS.status)),
          scoreText: text(cell("Status")?.querySelector(BB_SELECTORS.score)) || undefined,
        });
      });
    }

    if (kind === "schedule") {
      r.querySelectorAll(BB_SELECTORS.calendarItems).forEach((li) => {
        const day = li.closest("[data-date]")?.getAttribute("data-date") ?? "";
        out.assignments.push({
          externalId: li.getAttribute("data-assignment-id") ?? undefined,
          courseExternalId: li.getAttribute("data-section-id") ?? undefined,
          courseName: text(li.querySelector(".wbp-cal-class")),
          typeText: li.getAttribute("data-type") ?? undefined,
          title: text(li.querySelector(".wbp-cal-title")),
          dueText: day,
        });
      });
      r.querySelectorAll(BB_SELECTORS.calendarEvents).forEach((li) => {
        out.events.push({
          externalId: li.getAttribute("data-event-id") ?? undefined,
          title: text(li.querySelector(".wbp-cal-title")),
          dateText: li.closest("[data-date]")?.getAttribute("data-date") ?? "",
        });
      });
    }

    if (kind === "progress") {
      const term = text(r.querySelector(BB_SELECTORS.term));
      r.querySelectorAll(BB_SELECTORS.progressRows).forEach((row) => {
        out.grades.push({
          courseExternalId: row.getAttribute("data-section-id") ?? undefined,
          courseName: text(row.querySelector(".wbp-class")),
          teacher: text(row.querySelector(BB_SELECTORS.teacher)).split(" · ")[0] || undefined,
          percentText: text(row.querySelector(".wbp-grade")),
          letter: text(row.querySelector(".wbp-letter")) || undefined,
          term,
        });
      });
    }

    if (kind === "class") {
      const page = r.querySelector(BB_SELECTORS.classPage);
      const courseName = text(page?.querySelector(BB_SELECTORS.className));
      const teacher = text(page?.querySelector(BB_SELECTORS.teacher));
      r.querySelectorAll(BB_SELECTORS.bulletins).forEach((b) => {
        out.announcements.push({
          externalId: b.getAttribute("data-bulletin-id") ?? undefined,
          courseName,
          teacher,
          title: text(b.querySelector("h4")),
          body: text(b.querySelector("p")),
          postedText: b.querySelector("time")?.getAttribute("datetime") ?? text(b.querySelector("time")),
        });
      });
    }

    if (kind === "unknown") out.warnings.push("This Blackbaud page has no academic data ClassPano reads yet. Open Assignment Center, Schedule, Progress or a class page.");
    return out;
  },
};
