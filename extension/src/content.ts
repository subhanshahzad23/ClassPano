/*
 * Injected into the active tab only when the student clicks Sync
 * (activeTab + scripting). Runs the platform module registry against the
 * live page and returns plain data. It never reads cookies, form fields or
 * credentials, and it changes nothing on the page.
 */
import { pickAdapter } from "@/core/adapters/registry";

declare global {
  var __classpanoExtract: () => Promise<unknown>;
}

globalThis.__classpanoExtract = async () => {
  const ctx = {
    url: location.href,
    root: document,
    fetchJson: (path: string) => fetch(path, { credentials: "include", headers: { accept: "application/json" } }).then((r) => r.json()),
  };
  const adapter = pickAdapter(ctx);
  if (!adapter) {
    const selection = window.getSelection()?.toString().trim() ?? "";
    return { supported: false, url: location.href, title: document.title, text: (selection || document.body.innerText).slice(0, 20000), fromSelection: !!selection };
  }
  const raw = await adapter.extract(ctx);
  return { supported: true, url: location.href, adapter: { id: adapter.id, version: adapter.version, name: adapter.name }, raw };
};
