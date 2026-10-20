/*
 * ClassPano Sync popup. Opening it grants activeTab for the current tab;
 * pressing Sync injects content.js, runs the platform module, then normalizes
 * and merges locally with the same core code the web app uses. In production
 * the merge happens server-side behind an authenticated sync API; here the
 * records live in chrome.storage.local and can be exported as JSON.
 */
import { candidateToItem, extractCandidates, type CaptureCandidate } from "@/core/ai-capture";
import type { ExtractResult } from "@/core/adapters/types";
import { mergeNormalized, type StoreSlice } from "@/core/merge";
import { normalizeExtraction } from "@/core/normalize";
import { SCHEMA_VERSION, type PlatformId, type SyncRun } from "@/core/schema";

type Extracted =
  | { supported: true; url: string; adapter: { id: PlatformId; version: string; name: string }; raw: ExtractResult }
  | { supported: false; url: string; title: string; text: string; fromSelection: boolean };

interface Saved extends StoreSlice {
  syncs: SyncRun[];
}

const app = document.getElementById("app")!;
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

async function load(): Promise<Saved> {
  const { state } = await chrome.storage.local.get("state");
  return (state as Saved) ?? { items: {}, grades: {}, syncs: [] };
}
async function save(s: Saved) {
  await chrome.storage.local.set({ state: s });
  updateCount(s);
}
function updateCount(s: Saved) {
  document.getElementById("count")!.textContent = `${Object.keys(s.items).length + Object.keys(s.grades).length} records`;
}

async function activeTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function extract(tabId: number): Promise<Extracted> {
  await chrome.scripting.executeScript({ target: { tabId }, files: ["content.js"] });
  const [res] = await chrome.scripting.executeScript({ target: { tabId }, func: () => globalThis.__classpanoExtract() });
  return res.result as Extracted;
}

function consent() {
  app.innerHTML = `
    <p class="eyebrow">First time</p>
    <h1>Let ClassPano read pages when you press Sync?</h1>
    <ul class="rules">
      <li><i class="ok">✓</i>Reads assignments, due dates, classes and grades on the page you choose.</li>
      <li><i class="ok">✓</i>Only when you press Sync. Nothing runs in the background.</li>
      <li><i class="no">✕</i>Never sees or stores your school password.</li>
      <li><i class="no">✕</i>Never submits or changes anything on the site.</li>
    </ul>
    <div class="box muted">Permissions: activeTab, scripting, storage. No “read all websites”.</div>
    <button class="primary" id="allow">Allow</button>
    <div class="row"><button class="ghost" id="later">Not now</button></div>`;
  document.getElementById("allow")!.onclick = async () => {
    await chrome.storage.local.set({ consent: true });
    void main();
  };
  document.getElementById("later")!.onclick = () => window.close();
}

function result(run: SyncRun, adapterName: string) {
  const updated = run.changes.filter((c) => c.type !== "created");
  return `
    <p class="eyebrow">${esc(adapterName)} · ${esc(run.pageKind)}</p>
    <div class="tiles">
      <div class="${run.counts.created ? "hi" : ""}"><b>${run.counts.created}</b><span>New</span></div>
      <div class="${run.counts.updated ? "hi" : ""}"><b>${run.counts.updated}</b><span>Updated</span></div>
      <div><b>${run.counts.unchanged}</b><span>Same</span></div>
      <div><b>${run.counts.duplicatesPrevented}</b><span>Dupes</span></div>
    </div>
    ${
      updated.length
        ? `<p class="eyebrow" style="margin:8px 0 6px">What changed</p><ul class="changes">${updated
            .map((c) => `<li><b>${esc(c.title)}</b>${(c.fields ?? []).map((f) => `${esc(f.field)}: ${esc(String(f.from ?? "—"))} → ${esc(String(f.to ?? "—"))}`).join("<br>")}</li>`)
            .join("")}</ul>`
        : ""
    }`;
}

function exportJson(s: Saved) {
  const payload = { schema: SCHEMA_VERSION, exportedAt: new Date().toISOString(), student: "ClassPano user", items: Object.values(s.items), grades: Object.values(s.grades), syncs: s.syncs };
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
  a.download = "classpano-export.json";
  a.click();
}

const TOOLBAR = `<div class="row"><button class="outline" id="export">Export JSON</button><button class="ghost" id="clear">Clear data</button></div>`;
function bindToolbar(s: Saved) {
  document.getElementById("export")!.onclick = () => exportJson(s);
  document.getElementById("clear")!.onclick = async () => {
    await save({ items: {}, grades: {}, syncs: [] });
    void main();
  };
}

function review(ex: Extract<Extracted, { supported: false }>, state: Saved) {
  const today = new Date().toISOString().slice(0, 10);
  const { candidates } = extractCandidates(ex.text, { courseHint: ex.title.split(/[|·–-]/)[0].trim() || "My class", refDate: today });
  if (!candidates.length) {
    app.innerHTML = `<div class="box warn">No tasks or dates found${ex.fromSelection ? " in your selection" : " on this page"}.</div><button class="outline" id="back">Back</button>`;
    document.getElementById("back")!.onclick = () => void main();
    return;
  }
  app.innerHTML = `<p class="eyebrow">Review before saving</p><p class="muted" style="margin:6px 0 10px">Uncheck anything that isn't real work. Saved items are marked AI-extracted, not verified. (Prototype: a local extractor stands in for the LLM.)</p>
    ${candidates
      .map(
        (c, i) => `<label class="cand"><input type="checkbox" data-i="${i}" ${c.suggested ? "checked" : ""}/><span><b>${esc(c.title)}</b><small>${esc(c.kind)} · due ${esc(c.dueAt ?? "—")} · ${Math.round(c.confidence * 100)}% confident${c.flags.length ? " · " + esc(c.flags.join(", ")) : ""}</small></span></label>`,
      )
      .join("")}
    <button class="primary" id="save">Save checked items</button><div class="row"><button class="ghost" id="back">Cancel</button></div>`;
  document.getElementById("back")!.onclick = () => void main();
  document.getElementById("save")!.onclick = async () => {
    const keep: CaptureCandidate[] = [];
    app.querySelectorAll<HTMLInputElement>("input[data-i]").forEach((el) => el.checked && keep.push(candidates[Number(el.dataset.i)]));
    const now = new Date().toISOString();
    const merged = mergeNormalized(
      state,
      { items: keep.map((c) => candidateToItem(c, { url: ex.url, now })), grades: [], partial: false },
      { syncId: `sync_${Date.now().toString(36)}`, now, startedAt: performance.now(), pageKind: "unknown", platform: "generic", adapter: "ai-capture@0.2.0", url: ex.url, method: "ai_capture" },
    );
    const next = { items: merged.items, grades: merged.grades, syncs: [merged.run, ...state.syncs].slice(0, 50) };
    await save(next);
    app.innerHTML = result(merged.run, "AI-assisted capture") + TOOLBAR;
    bindToolbar(next);
  };
}

async function main() {
  const tab = await activeTab();
  const host = (() => {
    try {
      return new URL(tab?.url ?? "").hostname;
    } catch {
      return "";
    }
  })();
  document.getElementById("host")!.textContent = host || "No page";
  const state = await load();
  updateCount(state);
  const { consent: ok } = await chrome.storage.local.get("consent");
  if (!ok) return consent();
  if (!tab?.id || !/^https?:/.test(tab.url ?? "")) {
    app.innerHTML = `<div class="box warn">Open your school portal in this tab, then click ClassPano Sync again.</div>`;
    return;
  }

  app.innerHTML = `<div class="box"><b>Ready on ${esc(host)}</b><br><span class="muted">Press Sync to capture what's on this page.</span></div>
    <button class="primary" id="sync">Sync this page</button>${TOOLBAR}`;
  bindToolbar(state);
  document.getElementById("sync")!.onclick = async () => {
    const btn = document.getElementById("sync") as HTMLButtonElement;
    btn.disabled = true;
    btn.textContent = "Reading this page…";
    let ex: Extracted;
    try {
      ex = await extract(tab.id!);
    } catch (e) {
      app.innerHTML = `<div class="box warn">Chrome didn't allow reading this page (${esc(String(e))}).</div>`;
      return;
    }
    if (!ex.supported) {
      app.innerHTML = `<div class="box warn"><b>No ClassPano module for this site.</b><br>Capture ${ex.fromSelection ? "your selected text" : "this page"} with AI and review every item before it's saved?</div>
        <button class="dark" id="ai">Capture with AI (review first)</button><div class="row"><button class="ghost" id="back">Cancel</button></div>`;
      document.getElementById("ai")!.onclick = () => review(ex as Extract<Extracted, { supported: false }>, state);
      document.getElementById("back")!.onclick = () => void main();
      return;
    }
    const now = new Date().toISOString();
    const id = `${ex.adapter.id}@${ex.adapter.version}`;
    const norm = normalizeExtraction(ex.raw, { platform: ex.adapter.id, adapter: id, url: ex.url, now });
    const merged = mergeNormalized(state, norm, { syncId: `sync_${Date.now().toString(36)}`, now, startedAt: performance.now(), pageKind: ex.raw.pageKind, platform: ex.adapter.id, adapter: id, url: ex.url, method: "adapter", warnings: ex.raw.warnings });
    const next = { items: merged.items, grades: merged.grades, syncs: [merged.run, ...state.syncs].slice(0, 50) };
    await save(next);
    app.innerHTML = result(merged.run, ex.adapter.name) + `<button class="primary" id="again" style="margin-top:6px">Sync again</button>` + TOOLBAR;
    document.getElementById("again")!.onclick = () => void main();
    bindToolbar(next);
  };
}

void main();
