import type { ExtractResult, RawAssignment } from "./adapters/types";
import { fingerprint, stableId } from "./hash";
import type { AcademicItem, GradeRecord, ItemKind, ItemStatus, PageKind, PlatformId, SourceRef } from "./schema";

/*
 * Turns whatever an adapter read into cp.academic.v1 records. Platform quirks
 * (date formats, section suffixes, status words) are absorbed here, once.
 */

export interface NormalizeContext {
  platform: PlatformId;
  adapter: string; // "blackbaud@0.4.0"
  url: string;
  now: string;
}

/** "10/28/2026", "2026-10-28", "Oct 28, 2026" → "2026-10-28". */
export function parseDate(input?: string): string | undefined {
  if (!input) return undefined;
  const s = input.trim();
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) return `${m[3]}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`;
  const t = Date.parse(s);
  if (!Number.isNaN(t)) return new Date(t).toISOString().slice(0, 10);
  return undefined;
}

/** "Algebra I - 2 (A)" → "Algebra I". Blackbaud appends section number and block. */
export function cleanCourseName(name: string) {
  return name.replace(/\s+-\s+\d+\s*(\([A-Z0-9]+\))?\s*$/i, "").replace(/\s+/g, " ").trim();
}

export function courseKey(name: string) {
  return cleanCourseName(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const KIND_MAP: [RegExp, ItemKind][] = [
  [/test|exam|assessment/i, "test"],
  [/quiz|check/i, "quiz"],
  [/project|presentation/i, "project"],
  [/lab/i, "lab"],
  [/essay|paper|writing|narrative/i, "essay"],
  [/read/i, "reading"],
  [/homework|hw|worksheet|classwork|assignment/i, "homework"],
];

export function toKind(typeText?: string, title?: string): ItemKind {
  for (const [re, k] of KIND_MAP) if (typeText && re.test(typeText)) return k;
  for (const [re, k] of KIND_MAP) if (title && re.test(title)) return k;
  return "other";
}

export function toStatus(statusText?: string): ItemStatus {
  const s = (statusText ?? "").toLowerCase();
  if (s.includes("missing")) return "missing";
  if (s.includes("overdue") || s.includes("late")) return "overdue";
  if (s.includes("graded")) return "graded";
  if (s.includes("complete") || s.includes("submitted") || s.includes("turned in")) return "submitted";
  if (s.includes("progress")) return "in_progress";
  if (s.includes("excused")) return "excused";
  return "to_do";
}

const num = (s?: string) => {
  const m = s?.match(/-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : undefined;
};

function origin(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return "unknown";
  }
}

export function normalizeTitle(t: string) {
  return t
    .toLowerCase()
    .replace(/[–—]/g, "-")
    .replace(/[^a-z0-9.\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sourceRef(ctx: NormalizeContext, pageKind: PageKind, externalId?: string): SourceRef {
  return { platform: ctx.platform, adapter: ctx.adapter, method: "adapter", origin: origin(ctx.url), url: ctx.url, pageKind, externalId, capturedAt: ctx.now };
}

function assignmentToItem(a: RawAssignment, pageKind: PageKind, ctx: NormalizeContext): AcademicItem {
  const host = origin(ctx.url);
  const course = cleanCourseName(a.courseName);
  const ck = courseKey(a.courseName);
  const identityKey = a.externalId
    ? `${ctx.platform}:${host}:assignment:${a.externalId}`
    : `${ctx.platform}:${host}:${ck}:${normalizeTitle(a.title)}:${parseDate(a.assignedText) ?? ""}`;
  const score = num(a.scoreText);
  const points = num(a.pointsText) ?? (a.scoreText?.includes("/") ? num(a.scoreText.split("/")[1]) : undefined);
  const base = {
    kind: toKind(a.typeText, a.title),
    title: a.title.trim(),
    courseName: course,
    courseKey: ck,
    teacher: a.teacher,
    assignedAt: parseDate(a.assignedText),
    dueAt: parseDate(a.dueText),
    status: toStatus(a.statusText),
    pointsPossible: points,
    score,
    details: a.details,
  };
  return {
    id: stableId("itm", identityKey),
    identityKey,
    identityStrategy: a.externalId ? "external_id" : "composite",
    aliases: [],
    ...base,
    verified: true,
    source: sourceRef(ctx, pageKind, a.externalId),
    fingerprint: fingerprint(base),
    firstSeenAt: ctx.now,
    lastSeenAt: ctx.now,
    history: [],
  };
}

export interface Normalized {
  items: AcademicItem[];
  grades: GradeRecord[];
  /** Records from a partial view (e.g. calendar) that must not overwrite richer fields. */
  partial: boolean;
}

export function normalizeExtraction(res: ExtractResult, ctx: NormalizeContext): Normalized {
  const host = origin(ctx.url);
  const items: AcademicItem[] = res.assignments.map((a) => assignmentToItem(a, res.pageKind, ctx));

  for (const e of res.events) {
    const identityKey = e.externalId ? `${ctx.platform}:${host}:event:${e.externalId}` : `${ctx.platform}:${host}:event:${normalizeTitle(e.title)}:${parseDate(e.dateText)}`;
    const base = { kind: "event" as const, title: e.title, courseName: "School-wide", courseKey: "school", dueAt: parseDate(e.dateText), status: "info" as const };
    items.push({
      id: stableId("itm", identityKey),
      identityKey,
      identityStrategy: e.externalId ? "external_id" : "composite",
      aliases: [],
      ...base,
      verified: true,
      source: sourceRef(ctx, res.pageKind, e.externalId),
      fingerprint: fingerprint(base),
      firstSeenAt: ctx.now,
      lastSeenAt: ctx.now,
      history: [],
    });
  }

  for (const n of res.announcements) {
    const ck = courseKey(n.courseName);
    const identityKey = n.externalId ? `${ctx.platform}:${host}:bulletin:${n.externalId}` : `${ctx.platform}:${host}:bulletin:${ck}:${normalizeTitle(n.title)}`;
    const base = { kind: "announcement" as const, title: n.title, courseName: cleanCourseName(n.courseName), courseKey: ck, teacher: n.teacher, assignedAt: parseDate(n.postedText), status: "info" as const, details: n.body };
    items.push({
      id: stableId("itm", identityKey),
      identityKey,
      identityStrategy: n.externalId ? "external_id" : "composite",
      aliases: [],
      ...base,
      verified: true,
      source: sourceRef(ctx, res.pageKind, n.externalId),
      fingerprint: fingerprint(base),
      firstSeenAt: ctx.now,
      lastSeenAt: ctx.now,
      history: [],
    });
  }

  const grades: GradeRecord[] = res.grades.map((g) => {
    const ck = courseKey(g.courseName);
    const key = `${ctx.platform}:${host}:grade:${g.courseExternalId ?? ck}:${g.term ?? ""}`;
    const percent = num(g.percentText) ?? 0;
    return {
      id: stableId("grd", key),
      courseKey: ck,
      courseName: cleanCourseName(g.courseName),
      teacher: g.teacher,
      term: g.term ?? "Current term",
      percent,
      letter: g.letter,
      source: sourceRef(ctx, res.pageKind, g.courseExternalId),
      fingerprint: fingerprint({ percent, letter: g.letter }),
      firstSeenAt: ctx.now,
      lastSeenAt: ctx.now,
      history: [],
    };
  });

  return { items, grades, partial: res.pageKind === "schedule" };
}
