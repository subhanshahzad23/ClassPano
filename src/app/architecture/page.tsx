import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Bot, Braces, Database, Globe, KeyRound, LayoutDashboard, Lock, MousePointerClick, Plug, Server, Shield, Sparkles } from "lucide-react";
import { CAPTURE_JSON_SCHEMA } from "@/core/ai-capture";
import { STACK } from "@/content/proposal";
import { PublicHero, PublicShell } from "@/components/site/public-shell";
import { Code, DocSection, Toc } from "@/components/site/doc";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = { title: "Architecture" };

const TOC = [
  { id: "overview", label: "System" },
  { id: "modules", label: "Platform modules" },
  { id: "flow", label: "Sync flow" },
  { id: "dedupe", label: "Dedupe & changes" },
  { id: "ai", label: "AI capture" },
  { id: "schema", label: "Data format" },
  { id: "security", label: "Security" },
  { id: "limits", label: "Limitations" },
  { id: "stack", label: "Stack" },
  { id: "next", label: "Next steps" },
];

function Box({ icon: Icon, title, children, tone = "paper" }: { icon: typeof Plug; title: string; children?: React.ReactNode; tone?: "paper" | "dark" | "leaf" }) {
  return (
    <div className={tone === "dark" ? "rounded-[16px] bg-void p-4 text-paper" : tone === "leaf" ? "rounded-[16px] bg-leaf p-4" : "rounded-[16px] bg-paper p-4 ring-1 ring-line"}>
      <p className="flex items-center gap-2 text-[14.5px] font-semibold">
        <Icon className="size-4" /> {title}
      </p>
      {children && <div className={tone === "dark" ? "mt-1.5 text-[13px] text-paper/70" : "mt-1.5 text-[13px] text-ink"}>{children}</div>}
    </div>
  );
}

function Column({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[24px] bg-fog p-4">
      <p className="eyebrow mb-3 px-1 text-muted">{title}</p>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

const Arrow = () => (
  <div className="grid place-items-center py-1 lg:py-0" aria-hidden>
    <ArrowRight className="size-5 rotate-90 text-muted lg:rotate-0" />
  </div>
);

export default function ArchitecturePage() {
  return (
    <PublicShell>
      <PublicHero eyebrow="Architecture · Phase 1 and beyond" title="One extension. Many platforms." muted="Nothing rebuilt per school.">
        <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-paper/85">How the pieces fit, how a new platform plugs in, how repeat syncs stay clean, and the limits to settle before a commercial launch. The code samples are taken from this demo.</p>
        <Toc items={TOC} />
      </PublicHero>

      <DocSection id="overview" eyebrow="System" title="Three layers, one data format between them." tone="paper">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto_1fr_auto_1fr]">
          <Column title="In the browser · Chrome MV3">
            <Box icon={MousePointerClick} title="Side panel / popup">Consent screen, Sync button, results, AI review step.</Box>
            <Box icon={Plug} title="Content script (on click)" tone="dark">
              Module registry → Blackbaud · Canvas (preview) · no match → AI capture
            </Box>
            <Box icon={Braces} title="Shared core">Normalizer + validation. Same code as the server.</Box>
          </Column>
          <Arrow />
          <Column title="ClassPano API">
            <Box icon={KeyRound} title="Auth & households">Parent and student accounts, linked children, consent records.</Box>
            <Box icon={Server} title="POST /v1/sync" tone="dark">
              Idempotency key, schema validation, size limits, rate limits.
            </Box>
            <Box icon={Shield} title="Merge engine">Identity → fingerprint → fuzzy match. Field-level change log.</Box>
            <Box icon={Sparkles} title="AI service">Capture extraction + briefings. JSON schema, citations, zero retention.</Box>
          </Column>
          <Arrow />
          <Column title="Data & apps">
            <Box icon={Database} title="Postgres with row-level security" tone="dark">
              students · sources · records · record_changes · syncs
            </Box>
            <Box icon={LayoutDashboard} title="Dashboard">Student and parent views, calendar, grades, AI briefing.</Box>
            <Box icon={Globe} title="Official APIs (later)" tone="leaf">
              Google Classroom, Blackbaud SKY API, Canvas REST feed the same merge engine.
            </Box>
          </Column>
        </div>
      </DocSection>

      <DocSection id="modules" eyebrow="Requirement: modular extraction" title="A platform is one module." muted="Same interface, same output, independent release." tone="fog">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4 text-[16px] leading-relaxed text-ink">
            <p>Every school system gets a module that implements one small interface: recognize the page, say what kind of page it is, and return raw records. Everything after that (normalizing, deduping, change history, the dashboard, AI) is shared and never changes when a platform is added.</p>
            <p className="font-medium text-void">Each module reads in this order, sturdiest first:</p>
            <ol className="list-decimal space-y-1.5 pl-5">
              <li>
                <b>The page&apos;s own data.</b> Modern portals load JSON in the student&apos;s session to draw the page; reading that is far more stable than markup. Canvas does this through its documented API.
              </li>
              <li>
                <b>A selector table.</b> When markup is the only option, selectors live in one table that can be updated as remote config. That&apos;s data, not code, which Manifest V3 allows.
              </li>
              <li>
                <b>AI-assisted capture</b> when no module matches, always with a review step.
              </li>
            </ol>
            <p>
              Adding Schoology means: one file, a fixtures folder captured from a test account, and tests that replay those fixtures. The <Link className="text-leaf-ink underline underline-offset-2" href="/dashboard/sources">Sources page</Link> shows each module&apos;s version and health.
            </p>
          </div>
          <div className="space-y-3">
            <Code title="src/core/adapters/types.ts">{`export interface PlatformAdapter {
  id: PlatformId;            // "blackbaud" | "canvas" | ...
  name: string;
  version: string;           // stamped on every record it produces
  status: "ready" | "preview" | "planned";
  matches(ctx: PageContext): boolean;    // host + DOM signature
  detectPage(ctx: PageContext): PageKind;
  extract(ctx: PageContext): Promise<ExtractResult>;
}

// registry.ts — the only list that grows
export const ADAPTERS = [blackbaudAdapter, canvasAdapter];
export const pickAdapter = (ctx) =>
  ADAPTERS.find((a) => a.matches(ctx)) ?? null; // null → AI capture`}</Code>
            <Code title="src/core/adapters/blackbaud.ts (excerpt)">{`export const BB_SELECTORS = {
  assignmentRows: "#assignment-center-assignment-items tbody tr[data-assignment-id]",
  cell: (h) => \`td[data-heading="\${h}"]\`,
  progressRows: ".wbp-progress .wbp-progress-row[data-section-id]",
  bulletins: ".wbp-bulletins .wbp-bulletin",
  ...
};
// Selectors here target the simulated portal. Milestone 1 locks them
// (and the portal's own JSON endpoints) against your Blackbaud test account.`}</Code>
          </div>
        </div>
      </DocSection>

      <DocSection id="flow" eyebrow="One sync, end to end" title="What happens when a student presses Sync." tone="paper">
        <ol className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {[
            ["Click", "Opening the panel grants activeTab for this one tab. Nothing ran before the click."],
            ["Inject", "chrome.scripting injects the bundled content script: no remote code, nothing persistent."],
            ["Detect", "The registry picks a module by host and DOM signature, and the module names the page type."],
            ["Extract", "The module waits for the SPA to render, then reads rows, or the page's own JSON."],
            ["Normalize", "Dates, course names, types and statuses become cp.academic.v1, validated by schema."],
            ["Send", "POST /v1/sync with an idempotency key. A retried request can never double-write."],
            ["Merge", "Identity, fingerprint and fuzzy match decide create, update, unchanged or merged."],
            ["Report", "The panel shows new / updated / unchanged / duplicates prevented, plus every field that changed."],
          ].map(([t, b], i) => (
            <li key={t} className="rounded-[20px] bg-fog p-5">
              <p className="font-display text-[36px] leading-none tracking-[-0.04em] text-muted-display">{String(i + 1).padStart(2, "0")}</p>
              <p className="mt-3 text-[16px] font-semibold">{t}</p>
              <p className="mt-1 text-[14px] leading-relaxed text-muted">{b}</p>
            </li>
          ))}
        </ol>
      </DocSection>

      <DocSection id="dedupe" eyebrow="Requirement: no duplicates, detect changes" title="Three checks, cheapest first." muted="Every change logged by field." tone="fog">
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="space-y-3">
            {[
              ["1 · Identity key", "Uses the platform's own id when the page exposes one: blackbaud:{school}:assignment:8120399. A renamed assignment is still the same record. With no id, the key is course + normalized title."],
              ["2 · Fingerprint", "A hash of the mutable fields (title, type, due date, status, score, points, details). Same hash means unchanged, so nothing is written. A different hash means compare field by field and log each difference."],
              ["3 · Fuzzy match", "For records with no platform id (AI capture, teacher sites): same course, similar title (token Dice ≥ 0.5) and the same due date. A match merges into the existing record instead of creating a new one."],
            ].map(([t, b]) => (
              <div key={t} className="rounded-[20px] bg-paper p-5">
                <p className="text-[16px] font-semibold">{t}</p>
                <p className="mt-1 text-[14.5px] leading-relaxed text-ink">{b}</p>
              </div>
            ))}
            <div className="rounded-[20px] bg-void p-5 text-paper">
              <p className="text-[15px] font-semibold">Edge cases handled</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-[14px] text-paper/80">
                <li>The same assignment on Assignment Center and in the calendar counts once (16 duplicates prevented in the demo).</li>
                <li>Partial views like the calendar never blank fields that only the full list has.</li>
                <li>School-verified data always outranks AI-extracted data for the same item.</li>
                <li>Items that vanish from the portal get flagged “no longer listed”, never silently deleted.</li>
                <li>Retried uploads are idempotent; replaying a sync changes nothing.</li>
              </ul>
            </div>
          </div>
          <Code title="src/core/merge.ts (excerpt)">{`for (const inc of normalized.items) {
  let existing = items[inc.id] ?? findByAlias(inc.identityKey);

  if (!existing && inc.identityStrategy === "composite") {
    const fuzzy = findFuzzyMatch(items, inc);      // course + title + due
    if (fuzzy) { mergeInto(fuzzy.match, inc); counts.duplicatesPrevented++; continue; }
  }
  if (!existing) { create(inc); counts.created++; continue; }

  if (existing.verified && !inc.verified) {       // school data wins
    counts.duplicatesPrevented++; continue;
  }
  const diffs = TRACKED_FIELDS
    .filter((f) => existing[f] !== inc[f]);        // partial views skip blanks
  if (!diffs.length) { touch(existing); counts.unchanged++; continue; }

  existing.history.push(...diffs.map((f) => ({
    at: now, syncId, field: f, from: existing[f], to: inc[f],
  })));
  apply(existing, diffs); counts.updated++;
}

// Demo result, sync 2 after teacher updates:
// { created: 1, updated: 4, unchanged: 14, duplicatesPrevented: 0 }`}</Code>
        </div>
      </DocSection>

      <DocSection id="ai" eyebrow="Requirement: unsupported platforms" title="AI-assisted capture, with a human in the loop." muted="Feasible for “what and when”. Not for silent automation." tone="paper">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4 text-[16px] leading-relaxed text-ink">
            <p>Fully automatic extraction from any website isn&apos;t reliable enough to trust with a student&apos;s deadlines, and we agree on that. What is reliable: reading a page or selection the student chooses, proposing structured items, and asking them to confirm.</p>
            <ul className="space-y-2.5">
              {[
                [MousePointerClick, "Student-initiated, on a page or a selection. Only visible text is sent, never cookies, fields or hidden markup."],
                [Bot, "Server-side LLM call constrained to a JSON schema. Each item carries the exact sentence it came from and a confidence score."],
                [Sparkles, "Review screen: low-confidence or optional items start unchecked, and titles and dates can be edited. Nothing saves without a click."],
                [Shield, "Saved items are marked AI-extracted, never verified. They're matched against school records, so the same test merges instead of duplicating."],
              ].map(([I, t]) => {
                const C = I as typeof Bot;
                return (
                  <li key={t as string} className="flex gap-3">
                    <C className="mt-1 size-4 shrink-0 text-leaf-ink" />
                    <span>{t as string}</span>
                  </li>
                );
              })}
            </ul>
            <p className="text-[14.5px] text-muted">Cost control: only runs on click, with a small fast model for extraction and caching by content hash. A typical page is a few thousand tokens, roughly a fraction of a cent per capture.</p>
            <ButtonLink href="/sync?tab=capture" arrow>
              Try it on a teacher website
            </ButtonLink>
          </div>
          <Code title="Structured output schema (production LLM call)">{JSON.stringify(CAPTURE_JSON_SCHEMA, null, 2)}</Code>
        </div>
      </DocSection>

      <DocSection id="schema" eyebrow="Requirement: platform-neutral storage" title="cp.academic.v1" muted="What every record looks like, from any source." tone="fog">
        <div className="overflow-x-auto rounded-[20px] bg-paper">
          <table className="w-full min-w-[640px] text-left text-[14px]">
            <thead>
              <tr className="border-b border-line text-[12.5px] text-muted">
                <th className="px-5 py-3 font-medium">Field</th>
                <th className="px-3 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Purpose</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["id / identityKey", "string", "Stable ClassPano id derived from the platform id (or course + title)"],
                ["kind", "homework | test | quiz | project | lab | essay | reading | announcement | event", "Normalized from each platform's own vocabulary"],
                ["title, courseName, courseKey, teacher", "string", "Course names cleaned (“Algebra I - 2 (A)” → “Algebra I”)"],
                ["assignedAt, dueAt", "ISO date", "One date format whatever the portal prints"],
                ["status", "to_do | in_progress | submitted | graded | overdue | missing | excused", "Mapped from each platform's status words"],
                ["pointsPossible, score", "number", "Parsed from “18 / 20”, “20 pts”, etc."],
                ["verified, confidence", "boolean, 0–1", "School data vs AI-extracted (with confidence)"],
                ["source", "{ platform, adapter, method, origin, url, pageKind, externalId, capturedAt }", "Provenance kept on every record"],
                ["fingerprint", "hex", "Change detection without comparing every field"],
                ["history[]", "{ at, syncId, field, from, to }", "Full audit trail of what changed and when"],
                ["aliases[], notes[]", "string[]", "Same item seen elsewhere, merged rather than duplicated"],
              ].map(([f, t, p]) => (
                <tr key={f} className="border-b border-line/70 last:border-0">
                  <td className="px-5 py-3 font-mono text-[12.5px] text-leaf-ink">{f}</td>
                  <td className="px-3 py-3 font-mono text-[12px] text-muted">{t}</td>
                  <td className="px-5 py-3">{p}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-[14px] text-muted">
          See real records in the <Link href="/dashboard/data" className="font-medium text-leaf-ink underline underline-offset-2">data inspector</Link>.
        </p>
      </DocSection>

      <DocSection id="security" eyebrow="Security model" title="Least privilege, by construction." tone="paper">
        <div className="grid gap-6 lg:grid-cols-2">
          <Code title="extension/manifest.json">{`{
  "manifest_version": 3,
  "name": "ClassPano Sync (Prototype)",
  "permissions": ["activeTab", "scripting", "storage"],
  "action": { "default_popup": "popup.html" }
  // no host_permissions, no <all_urls>, no background scraping,
  // no remotely hosted code, no cookies permission
}`}</Code>
          <ul className="space-y-3 text-[15px] leading-relaxed">
            {[
              ["No credentials", "The extension reads a page the student is already signed in to. It never asks for, sees or stores school passwords or session cookies."],
              ["Scoped access", "activeTab grants one tab per click. Chrome shows no “read all your data on all websites” warning at install."],
              ["Minimal fields", "Only assignment, class, date, status, grade and announcement fields leave the page. No rosters, messages or classmates."],
              ["In transit and at rest", "TLS everywhere, encrypted Postgres, per-household row-level security, signed short-lived tokens for the extension."],
              ["Deletion and export", "Self-serve export (open JSON) and deletion that includes change logs and backups on a schedule."],
              ["Auditability", "Every record knows its source and module version; every change has a sync id."],
            ].map(([t, b]) => (
              <li key={t} className="flex gap-3">
                <Lock className="mt-1 size-4 shrink-0 text-leaf-ink" />
                <span>
                  <b>{t}.</b> <span className="text-ink">{b}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </DocSection>

      <DocSection id="limits" eyebrow="Your question 5" title="Limitations to resolve before commercial deployment." muted="Named early, so none of them surprise us later." tone="dark">
        <div className="grid gap-4 lg:grid-cols-3">
          {[
            {
              t: "Legal & privacy",
              items: [
                "COPPA: students under 13 need verifiable parental consent before any data is collected; design for the parent-first account.",
                "FERPA: ClassPano isn't a school official by default. Parent/student-initiated access is the basis, but schools may still ask for a data agreement.",
                "State student-privacy laws (e.g. California SOPIPA, New York Ed Law 2-d) and the Student Privacy Pledge: no ads, no sale, no profiling for non-educational purposes.",
                "LLM vendors need zero-retention terms and a DPA; student data must never be used for training.",
              ],
            },
            {
              t: "Platform policy",
              items: [
                "Blackbaud's terms and each school's acceptable-use policy may restrict automated reading of the portal. User-initiated, read-only, in-session reading is the lowest-risk pattern, but it needs a legal review, and ideally a partnership or SKY API access.",
                "Chrome Web Store: single purpose, Limited Use of user data, a clear privacy policy and disclosures, and no remotely hosted code (selector configs as data are fine).",
                "Many schools manage student Chromebooks and allow-list extensions. Distribution may need parent devices or a school-admin install.",
              ],
            },
            {
              t: "Technical",
              items: [
                "Portal updates and per-school customizations can break selectors: versioned modules, fixture tests, health telemetry (no content) and remote selector updates.",
                "Single-page apps load late: modules wait on DOM mutations or read the page's own JSON. Paging and date-range filters need handling.",
                "Chrome extensions don't run in mobile browsers. Syncing is a desktop/Chromebook action; the dashboard works everywhere.",
                "AI extraction can be wrong: review step, confidence, evidence lines, and AI never overwrites verified data.",
                "Households: one parent with several children, and shared devices, need explicit account switching.",
              ],
            },
          ].map((c) => (
            <div key={c.t} className="rounded-[24px] bg-[#111] p-6 ring-1 ring-white/10">
              <p className="text-[18px] font-semibold">{c.t}</p>
              <ul className="mt-3 space-y-2.5 text-[14.5px] leading-relaxed text-paper/80">
                {c.items.map((i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-jade" />
                    {i}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-6 text-[13px] text-paper/60">This is an engineering view of the risks, not legal advice. A short review by an education-privacy lawyer before launch is recommended.</p>
      </DocSection>

      <DocSection id="stack" eyebrow="Your question 7" title="Recommended stack." muted="Boring where it should be, typed end to end." tone="paper">
        <div className="overflow-x-auto rounded-[20px] bg-fog">
          <table className="w-full min-w-[720px] text-left text-[14.5px]">
            <tbody>
              {STACK.map((s) => (
                <tr key={s.area} className="border-b border-line last:border-0">
                  <td className="w-[150px] px-5 py-4 align-top font-semibold">{s.area}</td>
                  <td className="w-[34%] px-3 py-4 align-top">{s.choice}</td>
                  <td className="px-5 py-4 align-top text-muted">{s.why}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DocSection>

      <DocSection id="next" eyebrow="Next development steps" title="From this demo to Milestone 1." tone="fog">
        <ol className="grid gap-3 md:grid-cols-2">
          {[
            "Get access to the authorized Blackbaud test account (student and parent personas).",
            "Record page structure and the JSON the portal loads; replace demo selectors; capture anonymized fixtures.",
            "Stand up the sync API, Postgres schema and household auth; move the merge server-side.",
            "Run sync 1 → teacher edits → sync 2 on the real portal and assert counts in tests.",
            "Ship the dashboard and documentation; decide on optional AI capture and the second platform.",
            "Start the legal and policy review in parallel: Blackbaud terms, COPPA consent flow, Chrome Web Store listing.",
          ].map((s, i) => (
            <li key={s} className="flex gap-4 rounded-[20px] bg-paper p-5">
              <span className="font-display text-[32px] leading-none tracking-[-0.04em] text-muted-display">{i + 1}</span>
              <span className="text-[15.5px] leading-relaxed">{s}</span>
            </li>
          ))}
        </ol>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/proposal" arrow>
            See the proposal
          </ButtonLink>
          <ButtonLink href="/extension" variant="outline">
            Install the MV3 prototype
          </ButtonLink>
        </div>
      </DocSection>
    </PublicShell>
  );
}
