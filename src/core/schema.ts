/*
 * ClassPano academic record format (cp.academic.v1).
 *
 * Every adapter, the AI capture path and future official-API connectors all
 * produce these shapes. Nothing downstream (dedupe, dashboard, AI insights)
 * knows or cares which school platform supplied a record.
 */

export const SCHEMA_VERSION = "cp.academic.v1";

export type PlatformId = "blackbaud" | "canvas" | "schoology" | "google_classroom" | "facts" | "generic";
export type CaptureMethod = "adapter" | "ai_capture" | "api";
export type PageKind = "assignments" | "schedule" | "progress" | "class" | "unknown";

export type ItemKind = "homework" | "test" | "quiz" | "project" | "lab" | "essay" | "reading" | "announcement" | "event" | "other";
export type ItemStatus = "to_do" | "in_progress" | "submitted" | "graded" | "overdue" | "missing" | "excused" | "info";

/** Where a record came from. Kept on every record so its provenance is never lost. */
export interface SourceRef {
  platform: PlatformId;
  /** Adapter id and version that produced the record, e.g. "blackbaud@0.4.0". */
  adapter: string;
  method: CaptureMethod;
  origin: string;
  url: string;
  pageKind: PageKind;
  /** The platform's own id for the record, when the page exposes one. */
  externalId?: string;
  capturedAt: string;
}

export interface ChangeEvent {
  at: string;
  syncId: string;
  field: string;
  from: string | number | null;
  to: string | number | null;
}

export interface AcademicItem {
  /** Stable ClassPano id derived from the identity key. */
  id: string;
  identityKey: string;
  identityStrategy: "external_id" | "composite";
  /** Other identity keys merged into this record (e.g. the same test seen on a teacher's site). */
  aliases: string[];
  kind: ItemKind;
  title: string;
  courseName: string;
  courseKey: string;
  teacher?: string;
  assignedAt?: string;
  dueAt?: string;
  status: ItemStatus;
  pointsPossible?: number;
  score?: number;
  details?: string;
  /** true = read verbatim from the school platform. false = AI-extracted and confirmed by the user. */
  verified: boolean;
  confidence?: number;
  source: SourceRef;
  /** Hash of the mutable fields. Equal fingerprint = nothing changed since the last sync. */
  fingerprint: string;
  firstSeenAt: string;
  lastSeenAt: string;
  history: ChangeEvent[];
  notes?: string[];
}

export interface GradeRecord {
  id: string;
  courseKey: string;
  courseName: string;
  teacher?: string;
  term: string;
  percent: number;
  letter?: string;
  source: SourceRef;
  fingerprint: string;
  firstSeenAt: string;
  lastSeenAt: string;
  history: ChangeEvent[];
}

export interface SyncChange {
  recordId: string;
  title: string;
  type: "created" | "updated" | "merged";
  fields?: { field: string; from: ChangeEvent["from"]; to: ChangeEvent["to"] }[];
}

export interface SyncRun {
  id: string;
  at: string;
  platform: PlatformId;
  adapter: string;
  method: CaptureMethod;
  pageKind: PageKind;
  url: string;
  durationMs: number;
  counts: {
    found: number;
    created: number;
    updated: number;
    unchanged: number;
    duplicatesPrevented: number;
  };
  changes: SyncChange[];
  warnings: string[];
}

export const KIND_LABEL: Record<ItemKind, string> = {
  homework: "Homework",
  test: "Test",
  quiz: "Quiz",
  project: "Project",
  lab: "Lab",
  essay: "Essay",
  reading: "Reading",
  announcement: "Announcement",
  event: "Event",
  other: "Other",
};

export const STATUS_LABEL: Record<ItemStatus, string> = {
  to_do: "To do",
  in_progress: "In progress",
  submitted: "Submitted",
  graded: "Graded",
  overdue: "Overdue",
  missing: "Missing",
  excused: "Excused",
  info: "Info",
};

/** Fields whose change counts as an update. Order matters for display. */
export const TRACKED_FIELDS = ["title", "kind", "dueAt", "status", "score", "pointsPossible", "details", "teacher"] as const;
