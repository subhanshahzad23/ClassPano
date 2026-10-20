import { pickAdapter } from "./adapters/registry";
import type { ExtractResult, PageContext } from "./adapters/types";
import { mergeNormalized, type StoreSlice } from "./merge";
import { normalizeExtraction } from "./normalize";
import type { SyncRun } from "./schema";

/*
 * One sync = detect platform → extract → normalize → merge. The same function
 * runs inside the MV3 extension, in this demo's simulated browser, and in the
 * headless sample loader.
 */

export type SyncOutcome =
  | { ok: true; state: StoreSlice; run: SyncRun; raw: ExtractResult }
  | { ok: false; reason: "unsupported" | "empty"; message: string };

export async function runSync(ctx: PageContext, state: StoreSlice, opts: { syncId: string; now: string }): Promise<SyncOutcome> {
  const startedAt = performance.now();
  const adapter = pickAdapter(ctx);
  if (!adapter) return { ok: false, reason: "unsupported", message: "No ClassPano module for this site yet. Use AI-assisted capture instead." };

  const raw = await adapter.extract(ctx);
  const found = raw.assignments.length + raw.grades.length + raw.announcements.length + raw.events.length;
  if (!found) return { ok: false, reason: "empty", message: raw.warnings[0] ?? "Nothing academic found on this page." };

  const id = `${adapter.id}@${adapter.version}`;
  const norm = normalizeExtraction(raw, { platform: adapter.id, adapter: id, url: ctx.url, now: opts.now });
  const merged = mergeNormalized(state, norm, {
    syncId: opts.syncId,
    now: opts.now,
    startedAt,
    pageKind: raw.pageKind,
    platform: adapter.id,
    adapter: id,
    url: ctx.url,
    method: "adapter",
    warnings: raw.warnings,
  });
  return { ok: true, state: { items: merged.items, grades: merged.grades }, run: merged.run, raw };
}
