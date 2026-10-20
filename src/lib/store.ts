"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { candidateToItem, type CaptureCandidate } from "@/core/ai-capture";
import { mergeNormalized, type StoreSlice } from "@/core/merge";
import { runSync } from "@/core/pipeline";
import { PORTAL_NOW, SCHOOL, type PortalPage, type PortalVersion } from "@/core/portal/data";
import { renderPortalPage } from "@/core/portal/render";
import { SCHEMA_VERSION, type AcademicItem, type GradeRecord, type SyncRun } from "@/core/schema";
import type { ExtractResult } from "@/core/adapters/types";

export const STORAGE_KEY = "classpano-demo-v1";
export const PORTAL_URL = (path: string) => `https://${SCHOOL.host}${path}`;

export type Role = "student" | "parent";

interface DemoState extends StoreSlice {
  hydrated: boolean;
  version: PortalVersion;
  consent: boolean;
  syncs: SyncRun[];
  /** Pages captured per portal version (drives the extension's checklist). */
  captured: Partial<Record<PortalPage, string>>;
  role: Role;
  walkthrough: { open: boolean; step: number };
  presenterOpen: boolean;
}

const initial = (): Omit<DemoState, "hydrated" | "walkthrough" | "presenterOpen"> => ({
  version: "A",
  consent: false,
  items: {},
  grades: {},
  syncs: [],
  captured: {},
  role: "student",
});

export const useDemo = create<DemoState>()(
  persist(
    (): DemoState => ({
      ...initial(),
      hydrated: false,
      walkthrough: { open: false, step: 0 },
      presenterOpen: false,
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => {
        const { hydrated, presenterOpen, ...rest } = s;
        void hydrated;
        void presenterOpen;
        return rest;
      },
      onRehydrateStorage: () => () => useDemo.setState({ hydrated: true }),
    },
  ),
);

export const useHydrated = () => useDemo((s) => s.hydrated);
export const demoNow = (v: PortalVersion) => PORTAL_NOW[v];

let seq = 0;
const nextSyncId = () => `sync_${Date.now().toString(36)}${(seq++).toString(36)}`;

/** Runs the real adapter pipeline over a live DOM node (the simulated browser tab). */
export async function syncFromDom(root: ParentNode, page: PortalPage, path: string) {
  const s = useDemo.getState();
  const r = await runSync({ url: PORTAL_URL(path), root }, { items: s.items, grades: s.grades }, { syncId: nextSyncId(), now: demoNow(s.version) });
  if (!r.ok) return r;
  useDemo.setState({
    items: r.state.items,
    grades: r.state.grades,
    syncs: [r.run, ...s.syncs].slice(0, 60),
    captured: { ...s.captured, [page]: r.run.id },
  });
  return r;
}

/** Headless: renders portal HTML, parses it, and runs the same pipeline (used by "load a completed sync"). */
export async function syncHeadless(page: PortalPage, path: string): Promise<{ ok: boolean; raw?: ExtractResult }> {
  const v = useDemo.getState().version;
  const doc = new DOMParser().parseFromString(`<div data-portal-shell="education-management">${renderPortalPage(page, v)}</div>`, "text/html");
  const r = await syncFromDom(doc, page, path);
  return { ok: r.ok, raw: r.ok ? r.raw : undefined };
}

export function saveCaptured(candidates: CaptureCandidate[], url: string) {
  const s = useDemo.getState();
  const now = demoNow(s.version);
  const items = candidates.map((c) => candidateToItem(c, { url, now }));
  const merged = mergeNormalized(
    { items: s.items, grades: s.grades },
    { items, grades: [], partial: false },
    { syncId: nextSyncId(), now, startedAt: performance.now(), pageKind: "unknown", platform: "generic", adapter: "ai-capture@0.2.0", url, method: "ai_capture" },
  );
  useDemo.setState({ items: merged.items, syncs: [merged.run, ...s.syncs].slice(0, 60) });
  return merged.run;
}

export function setVersion(v: PortalVersion) {
  useDemo.setState({ version: v, captured: {} });
}

export function setRole(role: Role) {
  useDemo.setState({ role });
}

export function grantConsent(v = true) {
  useDemo.setState({ consent: v });
}

export function setWalkthrough(open: boolean, step?: number) {
  useDemo.setState((s) => ({ walkthrough: { open, step: step ?? s.walkthrough.step } }));
}

export function setPresenterOpen(open: boolean) {
  useDemo.setState({ presenterOpen: open });
}

export function deleteRecord(id: string) {
  useDemo.setState((s) => {
    const items = { ...s.items };
    const grades = { ...s.grades };
    delete items[id];
    delete grades[id];
    return { items, grades };
  });
}

export function deleteAllData() {
  useDemo.setState({ items: {}, grades: {}, syncs: [], captured: {} });
}

export function resetDemo() {
  useDemo.setState({ ...initial(), walkthrough: { open: false, step: 0 } });
}

export interface ExportPayload {
  schema: typeof SCHEMA_VERSION;
  exportedAt: string;
  student: string;
  items: AcademicItem[];
  grades: GradeRecord[];
  syncs: SyncRun[];
}

export function exportPayload(): ExportPayload {
  const s = useDemo.getState();
  return { schema: SCHEMA_VERSION, exportedAt: demoNow(s.version), student: SCHOOL.student, items: Object.values(s.items), grades: Object.values(s.grades), syncs: s.syncs };
}

/** Imports a payload exported by the MV3 prototype. Runs through the same merge, so re-imports never duplicate. */
export function importPayload(p: ExportPayload) {
  if (p?.schema !== SCHEMA_VERSION || !Array.isArray(p.items)) throw new Error(`Expected a ${SCHEMA_VERSION} export.`);
  const s = useDemo.getState();
  const now = demoNow(s.version);
  const merged = mergeNormalized(
    { items: s.items, grades: s.grades },
    { items: p.items.map((i) => ({ ...i, aliases: i.aliases ?? [], history: i.history ?? [] })), grades: p.grades ?? [], partial: false },
    { syncId: nextSyncId(), now, startedAt: performance.now(), pageKind: "unknown", platform: p.items[0]?.source.platform ?? "generic", adapter: "import", url: "extension-export.json", method: "adapter" },
  );
  useDemo.setState({ items: merged.items, grades: merged.grades, syncs: [merged.run, ...s.syncs].slice(0, 60) });
  return merged.run;
}

/** Loads a finished first sync across all four portal pages (version A). */
export async function loadSampleSync() {
  setVersion("A");
  useDemo.setState({ consent: true });
  await syncHeadless("assignment-center", "/app/student#assignment-center");
  await syncHeadless("schedule", "/app/student#schedule");
  await syncHeadless("progress", "/app/student#progress");
  await syncHeadless("class-biology", "/app/student#class/30418/bulletinboard");
}
