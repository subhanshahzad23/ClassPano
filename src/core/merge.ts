import type { Normalized } from "./normalize";
import { titleSimilarity } from "./similarity";
import { TRACKED_FIELDS, type AcademicItem, type CaptureMethod, type ChangeEvent, type GradeRecord, type PageKind, type PlatformId, type SyncChange, type SyncRun } from "./schema";

/*
 * Dedupe + change detection. Three layers, cheapest first:
 *   1. Identity key   — platform id when the page exposes one (exact, stable).
 *   2. Fingerprint    — hash of mutable fields; equal → unchanged, skip work.
 *   3. Fuzzy match    — for records without a platform id (AI capture, other
 *                       sites): same course + similar title + same due date.
 * Records are never silently overwritten: every changed field is logged.
 */

export interface StoreSlice {
  items: Record<string, AcademicItem>;
  grades: Record<string, GradeRecord>;
}

export interface MergeMeta {
  syncId: string;
  now: string;
  startedAt: number;
  pageKind: PageKind;
  platform: PlatformId;
  adapter: string;
  url: string;
  method: CaptureMethod;
  warnings?: string[];
}

type Val = string | number | null;
const val = (v: unknown): Val => (v === undefined ? null : (v as Val));

/** A partial view (calendar) only knows these fields; it must not blank the rest. */
const PARTIAL_FIELDS = ["title", "dueAt"] as const;

export const FUZZY_THRESHOLD = 0.6;

export function findFuzzyMatch(items: Record<string, AcademicItem>, incoming: AcademicItem): { match: AcademicItem; score: number } | null {
  let best: { match: AcademicItem; score: number } | null = null;
  for (const it of Object.values(items)) {
    if (it.id === incoming.id) continue;
    if (it.courseKey !== incoming.courseKey) continue;
    const sim = titleSimilarity(it.title, incoming.title);
    const sameDue = !!it.dueAt && it.dueAt === incoming.dueAt;
    const score = sim * 0.7 + (sameDue ? 0.3 : 0);
    if (score >= FUZZY_THRESHOLD && sim >= 0.5 && (!best || score > best.score)) best = { match: it, score };
  }
  return best;
}

export function mergeNormalized(state: StoreSlice, norm: Normalized, meta: MergeMeta): StoreSlice & { run: SyncRun } {
  const items = { ...state.items };
  const grades = { ...state.grades };
  const changes: SyncChange[] = [];
  const counts = { found: norm.items.length + norm.grades.length, created: 0, updated: 0, unchanged: 0, duplicatesPrevented: 0 };
  const seenThisBatch = new Set<string>();

  for (const inc of norm.items) {
    if (seenThisBatch.has(inc.id)) {
      counts.duplicatesPrevented++;
      continue;
    }
    seenThisBatch.add(inc.id);

    const existing = items[inc.id] ?? Object.values(items).find((i) => i.aliases.includes(inc.identityKey));

    // Records without a platform id may still describe something we already hold.
    if (!existing && inc.identityStrategy === "composite") {
      const fuzzy = findFuzzyMatch(items, inc);
      if (fuzzy) {
        const m = fuzzy.match;
        const note = inc.details && !m.details?.includes(inc.details) ? `${inc.source.origin}: “${inc.details}”` : undefined;
        items[m.id] = {
          ...m,
          aliases: [...m.aliases, inc.identityKey],
          notes: note ? [...(m.notes ?? []), note] : m.notes,
          lastSeenAt: meta.now,
        };
        counts.duplicatesPrevented++;
        changes.push({ recordId: m.id, title: m.title, type: "merged", fields: [{ field: "match", from: inc.title, to: `${Math.round(fuzzy.score * 100)}% match` }] });
        continue;
      }
    }

    if (!existing) {
      items[inc.id] = { ...inc, firstSeenAt: meta.now, lastSeenAt: meta.now };
      counts.created++;
      changes.push({ recordId: inc.id, title: inc.title, type: "created" });
      continue;
    }

    // School-verified data always wins over AI-extracted data for the same record.
    if (existing.verified && !inc.verified) {
      items[existing.id] = { ...existing, lastSeenAt: meta.now };
      counts.duplicatesPrevented++;
      continue;
    }

    const fields = norm.partial ? PARTIAL_FIELDS : TRACKED_FIELDS;
    const diffs: { field: string; from: Val; to: Val }[] = [];
    for (const f of fields) {
      const a = val(existing[f as keyof AcademicItem]);
      const b = val(inc[f as keyof AcademicItem]);
      if (norm.partial && b === null) continue;
      if (a !== b) diffs.push({ field: f, from: a, to: b });
    }

    if (!diffs.length) {
      items[existing.id] = { ...existing, lastSeenAt: meta.now };
      // Same record reached from another page (e.g. calendar after Assignment Center).
      if (existing.source.pageKind !== inc.source.pageKind) counts.duplicatesPrevented++;
      else counts.unchanged++;
      continue;
    }

    const history: ChangeEvent[] = diffs.map((d) => ({ at: meta.now, syncId: meta.syncId, field: d.field, from: d.from, to: d.to }));
    const patch: Partial<AcademicItem> = {};
    for (const d of diffs) (patch as Record<string, unknown>)[d.field] = d.to ?? undefined;
    items[existing.id] = {
      ...existing,
      ...patch,
      fingerprint: norm.partial ? existing.fingerprint : inc.fingerprint,
      source: norm.partial ? existing.source : inc.source,
      lastSeenAt: meta.now,
      history: [...existing.history, ...history],
    };
    counts.updated++;
    changes.push({ recordId: existing.id, title: existing.title, type: "updated", fields: diffs });
  }

  for (const g of norm.grades) {
    const existing = grades[g.id];
    if (!existing) {
      grades[g.id] = g;
      counts.created++;
      changes.push({ recordId: g.id, title: `${g.courseName} grade`, type: "created" });
      continue;
    }
    if (existing.fingerprint === g.fingerprint) {
      grades[g.id] = { ...existing, lastSeenAt: meta.now };
      counts.unchanged++;
      continue;
    }
    const diffs: { field: string; from: Val; to: Val }[] = [];
    if (existing.percent !== g.percent) diffs.push({ field: "percent", from: existing.percent, to: g.percent });
    if ((existing.letter ?? null) !== (g.letter ?? null)) diffs.push({ field: "letter", from: existing.letter ?? null, to: g.letter ?? null });
    grades[g.id] = {
      ...existing,
      percent: g.percent,
      letter: g.letter,
      fingerprint: g.fingerprint,
      source: g.source,
      lastSeenAt: meta.now,
      history: [...existing.history, ...diffs.map((d) => ({ at: meta.now, syncId: meta.syncId, field: d.field, from: d.from, to: d.to }))],
    };
    counts.updated++;
    changes.push({ recordId: g.id, title: `${g.courseName} grade`, type: "updated", fields: diffs });
  }

  const run: SyncRun = {
    id: meta.syncId,
    at: meta.now,
    platform: meta.platform,
    adapter: meta.adapter,
    method: meta.method,
    pageKind: meta.pageKind,
    url: meta.url,
    durationMs: Math.max(1, Math.round(performance.now() - meta.startedAt)),
    counts,
    changes,
    warnings: meta.warnings ?? [],
  };
  return { items, grades, run };
}
