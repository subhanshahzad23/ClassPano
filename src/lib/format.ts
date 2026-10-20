import { KIND_LABEL, STATUS_LABEL, type AcademicItem, type ChangeEvent, type ItemKind, type ItemStatus } from "@/core/schema";
import type { Tone } from "@/components/ui/display";

const dShort = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "short", day: "numeric" });
const dDay = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "short", month: "short", day: "numeric" });
const dLong = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "long", month: "long", day: "numeric" });
const tShort = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", hour: "numeric", minute: "2-digit" });

const asDate = (iso: string) => new Date(iso.length === 10 ? iso + "T12:00:00Z" : iso);
export const fmtDay = (iso?: string) => (iso ? dDay.format(asDate(iso)) : "—");
export const fmtShort = (iso?: string) => (iso ? dShort.format(asDate(iso)) : "—");
export const fmtLongDay = (iso?: string) => (iso ? dLong.format(asDate(iso)) : "—");
export const fmtClock = (iso?: string) => (iso ? tShort.format(new Date(iso)) : "—");

export const FIELD_LABEL: Record<string, string> = {
  title: "Title",
  kind: "Type",
  dueAt: "Due date",
  status: "Status",
  score: "Score",
  pointsPossible: "Points",
  details: "Details",
  teacher: "Teacher",
  percent: "Grade",
  letter: "Letter grade",
  match: "Matched",
};

export function fmtField(field: string, v: ChangeEvent["from"]) {
  if (v === null || v === undefined || v === "") return "—";
  if (field === "dueAt") return fmtShort(String(v));
  if (field === "status") return STATUS_LABEL[v as ItemStatus] ?? String(v);
  if (field === "kind") return KIND_LABEL[v as ItemKind] ?? String(v);
  if (field === "percent") return `${Number(v).toFixed(1)}%`;
  const s = String(v);
  return s.length > 60 ? s.slice(0, 57) + "…" : s;
}

export const STATUS_TONE: Record<ItemStatus, Tone> = {
  to_do: "blue",
  in_progress: "amber",
  submitted: "green",
  graded: "purple",
  overdue: "red",
  missing: "red",
  excused: "neutral",
  info: "neutral",
};

/** Course colours (in-canvas palette from the design tokens). */
const COURSE_HUES: Record<string, string> = {
  "algebra-i": "#79c1ff",
  biology: "#00c27a",
  "english-9": "#be53ff",
  "world-history": "#ffaa00",
  "spanish-ii": "#ff98b4",
  "intro-to-computer-science": "#5887ff",
  school: "#8c8c8c",
};
export const courseColor = (key: string) => COURSE_HUES[key] ?? "#8c8c8c";

export const isWork = (i: AcademicItem) => i.kind !== "announcement" && i.kind !== "event";
export const isOpen = (i: AcademicItem) => isWork(i) && ["to_do", "in_progress", "overdue", "missing"].includes(i.status);

export function daysUntil(dateIso: string, nowIso: string) {
  return Math.round((Date.parse(dateIso + "T00:00:00Z") - Date.parse(nowIso.slice(0, 10) + "T00:00:00Z")) / 86400000);
}

export function dueLabel(dateIso: string | undefined, nowIso: string) {
  if (!dateIso) return "No due date";
  const d = daysUntil(dateIso, nowIso);
  if (d === 0) return "Due today";
  if (d === 1) return "Due tomorrow";
  if (d === -1) return "Was due yesterday";
  if (d < 0) return `Was due ${fmtShort(dateIso)}`;
  if (d < 7) return `Due ${dDay.format(asDate(dateIso)).split(",")[0]}`;
  return `Due ${fmtShort(dateIso)}`;
}
