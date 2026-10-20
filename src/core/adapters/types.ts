import type { PageKind, PlatformId } from "../schema";

/*
 * The contract every school-platform module implements. An adapter only
 * reads what is on the page the user chose (or what that page itself loads in
 * the user's own session). It never sees credentials and never navigates.
 * Adding a platform = adding one file that satisfies this interface.
 */

export interface PageContext {
  url: string;
  /** The page's document (content script) or a parsed copy (tests, headless). */
  root: ParentNode;
  /** Same-origin fetch in the user's session, for platforms whose pages load JSON. */
  fetchJson?: (path: string) => Promise<unknown>;
}

export interface RawAssignment {
  externalId?: string;
  courseName: string;
  courseExternalId?: string;
  teacher?: string;
  typeText?: string;
  title: string;
  assignedText?: string;
  dueText?: string;
  statusText?: string;
  scoreText?: string;
  pointsText?: string;
  details?: string;
}

export interface RawGrade {
  courseName: string;
  courseExternalId?: string;
  teacher?: string;
  percentText: string;
  letter?: string;
  term?: string;
}

export interface RawAnnouncement {
  externalId?: string;
  courseName: string;
  teacher?: string;
  title: string;
  body: string;
  postedText?: string;
}

export interface RawEvent {
  externalId?: string;
  title: string;
  dateText: string;
}

export interface ExtractResult {
  pageKind: PageKind;
  assignments: RawAssignment[];
  grades: RawGrade[];
  announcements: RawAnnouncement[];
  events: RawEvent[];
  warnings: string[];
}

export interface PlatformAdapter {
  id: PlatformId;
  name: string;
  version: string;
  status: "ready" | "preview" | "planned";
  /** Host patterns plus a DOM signature, so a renamed host still matches. */
  matches(ctx: PageContext): boolean;
  detectPage(ctx: PageContext): PageKind;
  extract(ctx: PageContext): Promise<ExtractResult>;
}

export const emptyResult = (pageKind: PageKind): ExtractResult => ({ pageKind, assignments: [], grades: [], announcements: [], events: [], warnings: [] });
