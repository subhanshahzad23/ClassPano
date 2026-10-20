import { fingerprint, stableId } from "./hash";
import { courseKey, cleanCourseName, normalizeTitle, toKind } from "./normalize";
import type { AcademicItem, ItemKind } from "./schema";

/*
 * AI-assisted capture for unsupported sites.
 *
 * Production: the selected text (never the whole browsing session) goes to a
 * server endpoint that calls an LLM with a strict JSON schema — the same
 * CaptureCandidate shape below — then the student reviews every candidate
 * before anything is saved.
 *
 * Demo: a deterministic local extractor stands in for the LLM so the page
 * works offline and gives the same answer every time. It returns the same
 * shape, including confidence and the evidence line it used.
 */

export interface CaptureCandidate {
  tempId: string;
  title: string;
  kind: ItemKind;
  courseName: string;
  dueAt?: string;
  details?: string;
  evidence: string;
  confidence: number;
  flags: string[];
  /** Pre-selected for saving? Low-confidence rows start unchecked. */
  suggested: boolean;
}

/** JSON schema the production LLM call is constrained to. Shown on the architecture page. */
export const CAPTURE_JSON_SCHEMA = {
  type: "object",
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        required: ["title", "kind", "course", "evidence", "confidence"],
        properties: {
          title: { type: "string" },
          kind: { enum: ["homework", "test", "quiz", "project", "lab", "essay", "reading", "event", "other"] },
          course: { type: "string" },
          due_date: { type: "string", format: "date", description: "ISO date. Omit if the text gives none." },
          details: { type: "string" },
          evidence: { type: "string", description: "Exact sentence the item came from." },
          confidence: { type: "number", minimum: 0, maximum: 1 },
        },
      },
    },
  },
} as const;

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

interface FoundDate {
  iso: string;
  raw: string;
  explicit: boolean;
}

/** Finds the first date in a line. `refIso` resolves "11/3" and "Friday". */
export function findDate(line: string, refIso: string): FoundDate | null {
  const ref = new Date(refIso + "T12:00:00Z");
  const year = ref.getUTCFullYear();
  let m = line.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
  if (m) {
    const y = m[3] ? (m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3])) : year;
    return { iso: `${y}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`, raw: m[0], explicit: true };
  }
  m = line.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s*(\d{4}))?/i);
  if (m) {
    const mi = MONTHS.indexOf(m[1].slice(0, 3).toLowerCase());
    const y = m[3] ? Number(m[3]) : year;
    return { iso: `${y}-${String(mi + 1).padStart(2, "0")}-${m[2].padStart(2, "0")}`, raw: m[0], explicit: true };
  }
  m = line.match(/\b(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/i);
  if (m) {
    const target = WEEKDAYS.indexOf(m[1].toLowerCase());
    const diff = (target - ref.getUTCDay() + 7) % 7 || 7;
    const d = new Date(ref.getTime() + diff * 86400000);
    return { iso: d.toISOString().slice(0, 10), raw: m[0], explicit: false };
  }
  return null;
}

const NOT_WORK = /office hours|lunch|no school|welcome|bring snacks|club meets|last updated|^week of|agenda\s*$/i;
const EVENT = /dismissal|assembly|picture|field trip(?! permission)|conference|no school/i;
const OPTIONAL = /optional|extra credit|bonus/i;
const ACTIVITY = /\b(start|begin|notes in class|introduce|review in class)\b/i;

function cleanTitle(line: string, date: FoundDate | null) {
  let t = line;
  if (date) t = t.replace(date.raw, " ");
  // A weekday next to an explicit date is redundant ("by Friday, Oct 30").
  if (date?.explicit) t = t.replace(/\b(by|on|due)?\s*(mon|tues|wednes|thurs|fri|satur|sun)day\b,?/gi, " ");
  t = t
    .replace(/^\s*(mon|tue|wed|thu|fri|sat|sun)[a-z]*\.?\s*/i, "")
    .replace(/\s+(due|by|on)\s*[,.]?\s*$/i, "")
    .replace(/\s+(due|by|on)\s*([.!])/i, "$2")
    .replace(/^[\s:–—-]+/, "")
    .replace(/\s*[–—-]\s*$/, "")
    .replace(/\s+/g, " ")
    .trim();
  // Keep the first clause as the title; the rest becomes details.
  const [head, ...rest] = t.split(/(?<=[.!])\s+/);
  let title = head.replace(/[.!]$/, "").replace(/\s+\bdue\b(?=\s*(\(|$))/i, "").trim();
  if (title.length > 80) title = title.slice(0, 77).trimEnd() + "…";
  return { title: title.charAt(0).toUpperCase() + title.slice(1), details: rest.join(" ").trim() || undefined };
}

export function extractCandidates(text: string, opts: { courseHint: string; refDate: string }): { candidates: CaptureCandidate[]; ignored: string[] } {
  const lines = text
    .split(/\n|(?<=\.)\s+(?=[A-Z][a-z]{2} \d)/)
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter((l) => l.length > 6);
  const candidates: CaptureCandidate[] = [];
  const ignored: string[] = [];

  lines.forEach((line, i) => {
    const date = findDate(line, opts.refDate);
    if (!date || NOT_WORK.test(line)) {
      if (/\d|due|test|quiz/i.test(line)) ignored.push(line);
      return;
    }
    const isEvent = EVENT.test(line);
    const { title, details } = cleanTitle(line, date);
    if (!title || title.length < 4) {
      ignored.push(line);
      return;
    }
    const kind: ItemKind = isEvent ? "event" : toKind(undefined, line);
    const flags: string[] = [];
    let confidence = 0.62;
    if (date.explicit) confidence += 0.14;
    else flags.push(`Date inferred from “${date.raw}”`);
    if (kind !== "other") confidence += 0.12;
    if (/\bdue\b/i.test(line)) confidence += 0.06;
    if (OPTIONAL.test(line)) {
      confidence -= 0.14;
      flags.push("Marked optional");
    }
    if (ACTIVITY.test(line) && !/\bread|worksheet|due|complete\b/i.test(line)) {
      confidence -= 0.22;
      flags.push("Looks like a class activity, not homework");
    }
    confidence = Math.max(0.2, Math.min(0.97, Number(confidence.toFixed(2))));
    candidates.push({
      tempId: `cand_${i}`,
      title,
      kind,
      courseName: isEvent ? "School-wide" : opts.courseHint,
      dueAt: date.iso,
      details,
      evidence: line,
      confidence,
      flags,
      suggested: confidence >= 0.6,
    });
  });
  return { candidates, ignored };
}

/** A reviewed candidate becomes a normal record — flagged as AI-extracted, not school-verified. */
export function candidateToItem(c: CaptureCandidate, ctx: { url: string; now: string }): AcademicItem {
  const host = (() => {
    try {
      return new URL(ctx.url).hostname;
    } catch {
      return "unknown";
    }
  })();
  const ck = c.kind === "event" ? "school" : courseKey(c.courseName);
  const identityKey = `generic:${host}:${ck}:${normalizeTitle(c.title)}`;
  const base = {
    kind: c.kind,
    title: c.title,
    courseName: c.kind === "event" ? "School-wide" : cleanCourseName(c.courseName),
    courseKey: ck,
    dueAt: c.dueAt,
    status: c.kind === "event" ? ("info" as const) : ("to_do" as const),
    details: c.details,
  };
  return {
    id: stableId("itm", identityKey),
    identityKey,
    identityStrategy: "composite",
    aliases: [],
    ...base,
    verified: false,
    confidence: c.confidence,
    source: { platform: "generic", adapter: "ai-capture@0.2.0", method: "ai_capture", origin: host, url: ctx.url, pageKind: "unknown", capturedAt: ctx.now },
    fingerprint: fingerprint(base),
    firstSeenAt: ctx.now,
    lastSeenAt: ctx.now,
    history: [],
  };
}
