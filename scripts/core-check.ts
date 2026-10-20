// Sanity check for the core pipeline: two syncs, schedule cross-page, AI capture merge.
import { parseHTML } from "linkedom";
import { renderPortalPage } from "../src/core/portal/render";
import { runSync } from "../src/core/pipeline";
import { extractCandidates, candidateToItem } from "../src/core/ai-capture";
import { mergeNormalized, type StoreSlice } from "../src/core/merge";
import { buildBriefing } from "../src/core/insights";
import type { PortalPage, PortalVersion } from "../src/core/portal/data";

const url = "https://portal.westbrook-academy.test/app/student";
function ctx(page: PortalPage, v: PortalVersion) {
  const { document } = parseHTML(`<html><body><div data-portal-shell="education-management">${renderPortalPage(page, v)}</div></body></html>`);
  return { url, root: document };
}
let state: StoreSlice = { items: {}, grades: {} };
let n = 0;
async function sync(page: PortalPage, v: PortalVersion) {
  const r = await runSync(ctx(page, v), state, { syncId: `s${++n}`, now: v === "A" ? "2026-10-27T16:10:00Z" : "2026-10-27T17:35:00Z" });
  if (!r.ok) throw new Error(r.message);
  state = r.state;
  console.log(page, v, JSON.stringify(r.run.counts), r.run.changes.filter(c => c.type !== "created").map(c => `${c.type}:${c.title}:${(c.fields||[]).map(f=>f.field+"="+f.from+"→"+f.to).join("|")}`));
}
(async () => {
  await sync("assignment-center", "A");
  await sync("schedule", "A");
  await sync("progress", "A");
  await sync("class-biology", "A");
  await sync("assignment-center", "A");
  await sync("assignment-center", "B");
  await sync("progress", "B");
  await sync("class-biology", "B");
  const text = `Week of Nov 2 – Agenda
Mon 11/2 – Quiz 3.4 on substitution (no calculators).
Tue 11/3 – Unit 3 Test: Systems of Equations. Calculators allowed.
Wed 11/4 – Start Unit 4: Exponent rules (notes in class).
Thu 11/5 – Read section 4.1 and finish the warm-up worksheet.
Fri 11/6 – Desmos Art Project due (extra credit, optional).
Bring a signed field trip permission slip to the front office by Friday, Oct 30.
Office hours: Tuesdays and Thursdays 3:15–4:00 in Room 204.`;
  const { candidates, ignored } = extractCandidates(text, { courseHint: "Algebra I", refDate: "2026-10-27" });
  console.table(candidates.map(c => ({ t: c.title, k: c.kind, d: c.dueAt, c: c.confidence, s: c.suggested, f: c.flags.join(";") })));
  console.log("ignored", ignored);
  const items = candidates.filter(c => c.suggested).map(c => candidateToItem(c, { url: "https://mrpatelmath.example.org/updates", now: "2026-10-27T17:40:00Z" }));
  const m = mergeNormalized(state, { items, grades: [], partial: false }, { syncId: "ai1", now: "2026-10-27T17:40:00Z", startedAt: 0, pageKind: "unknown", platform: "generic", adapter: "ai", url: "x", method: "ai_capture" });
  console.log("ai", JSON.stringify(m.run.counts), m.run.changes.map(c => c.type + ":" + c.title));
  const b = buildBriefing(Object.values(m.items), Object.values(m.grades), "2026-10-27T17:35:00Z", "parent");
  console.log(b.headline, "\n", b.summary); b.insights.forEach(i => console.log("-", i.tone, i.title)); b.plan.forEach(p => console.log(p.date, p.blocks.map(x => x.title + " " + x.minutes)));
})();
