import type { Metadata } from "next";
import Link from "next/link";
import { Check, CircleCheck } from "lucide-react";
import { OPTIONAL, OPTIONAL_BUNDLE, PHASE1, PHASES, STACK } from "@/content/proposal";
import { PublicHero, PublicShell } from "@/components/site/public-shell";
import { DocSection, Toc } from "@/components/site/doc";
import { ButtonLink } from "@/components/ui/button";
import { ProposalTracker } from "./tracker";

export const metadata: Metadata = { title: "Proposal" };

const money = (n: number) => `$${n.toLocaleString("en-US")}`;

const QUESTIONS: { q: string; a: React.ReactNode }[] = [
  {
    q: "Have you built Chrome extensions that extract structured information from authenticated websites?",
    a: (
      <>
        <p>
          Yes. Rather than only describing it, this proposal includes one: a <Link href="/extension">working Manifest V3 prototype</Link> you can load in Chrome. It reads a signed-in portal page on click, normalizes the data and deduplicates across syncs, using the same code that runs in the <Link href="/sync">simulated portal</Link>.
        </p>
        <p>
          The patterns that matter on Blackbaud are all in it: access scoped by <code>activeTab</code>, reading in the user&apos;s own session without ever touching credentials, waiting for single-page-app content, and preferring the page&apos;s own data over fragile markup. Links to earlier extension work are in my proposal message.
        </p>
      </>
    ),
  },
  {
    q: "How would you design one extension to support multiple school platforms through separate extraction modules?",
    a: (
      <>
        <p>
          A small <b>PlatformAdapter</b> interface (match, detect page, extract) and a registry. Each platform is one module with its own selector table, fixtures and tests, and a version that&apos;s stamped on every record it produces. Everything downstream (normalizer, dedupe, change log, dashboard, AI) is shared and never changes when a platform is added.
        </p>
        <p>
          Selector tables can be updated as remote config, which is data rather than code and allowed under MV3, so a Blackbaud markup change doesn&apos;t wait on a Web Store review. Official APIs plug in behind the same output format. <Link href="/architecture#modules">See the interface</Link>.
        </p>
      </>
    ),
  },
  {
    q: "What is your recommended approach for handling unsupported platforms using AI-assisted page capture?",
    a: (
      <>
        <p>
          Student-initiated capture of a page or a highlighted selection. Only visible text goes to a server-side LLM call constrained to a JSON schema; each proposed item comes back with the exact sentence it came from and a confidence score. The student reviews, edits or unchecks items, and nothing saves without a click.
        </p>
        <p>
          Saved items are labeled AI-extracted, never verified, and are matched against school records so a test seen on a teacher&apos;s site merges into the Blackbaud record instead of duplicating. You&apos;re right that universal automatic extraction isn&apos;t reliable; this is the reliable version of it. <Link href="/sync?tab=capture">Try it</Link>.
        </p>
      </>
    ),
  },
  {
    q: "How would you prevent duplicate assignments and detect changes between syncs?",
    a: (
      <>
        <p>
          Three checks, cheapest first. <b>Identity key</b>: the platform&apos;s own assignment id, so a renamed assignment is still the same record. <b>Fingerprint</b>: a hash of the mutable fields, where equal means unchanged and nothing is written. <b>Fuzzy match</b>: for records without an id (same course, similar title, same due date).
        </p>
        <p>
          When a fingerprint differs, each changed field is logged with old value, new value and sync id (“due date Oct 29 → Nov 2”). Partial views never blank fields, uploads are idempotent, and removed items are flagged, not deleted. In the demo, sync 2 reports 1 new, 4 updated, 14 unchanged, 0 duplicates. <Link href="/architecture#dedupe">Details</Link>.
        </p>
      </>
    ),
  },
  {
    q: "What technical, privacy, or platform-policy limitations do you anticipate?",
    a: (
      <>
        <p>
          The big ones: Blackbaud&apos;s terms and school policies on automated portal access (needs a legal read, and ideally a partnership or SKY API path); COPPA parental consent for under-13s; FERPA expectations from schools; Chrome Web Store data policies; managed school Chromebooks that block unlisted extensions; extensions not running on mobile browsers; markup changes breaking modules; and AI accuracy.
        </p>
        <p>
          Each has a mitigation in the plan. <Link href="/architecture#limits">Full list</Link>.
        </p>
      </>
    ),
  },
  {
    q: "What would you charge for the Phase 1 proof of concept, and how long would it take?",
    a: (
      <p>
        <b>
          {money(PHASE1.price)} fixed, {PHASE1.weeks} weeks
        </b>
        , in four weekly milestones (below), with a go / no-go on Blackbaud extraction accuracy at the end of week 1, before most of the budget is spent. Optional features are quoted separately: {OPTIONAL.map((o) => `${o.title.toLowerCase()} ${money(o.price)}`).join(", ")}.
      </p>
    ),
  },
  {
    q: "What technology stack would you recommend for the extension and future ClassPano dashboard?",
    a: (
      <p>
        {STACK.map((s, i) => (
          <span key={s.area}>
            <b>{s.area}:</b> {s.choice}
            {i < STACK.length - 1 ? ". " : "."}
          </span>
        ))}{" "}
        <Link href="/architecture#stack">Reasoning for each</Link>.
      </p>
    ),
  },
];

export default function ProposalPage() {
  return (
    <PublicShell>
      <ProposalTracker />
      <PublicHero eyebrow="Proposal · ClassPano Phase 1" title="A proof of concept you can click." muted="Then a product.">
        <div className="mt-8 flex flex-wrap gap-2">
          {[
            `Phase 1 · ${money(PHASE1.price)} fixed`,
            `${PHASE1.weeks} weeks · ${PHASE1.milestones.length} milestones`,
            `Optional features from ${money(Math.min(...OPTIONAL.map((o) => o.price)))}`,
            "Phases 2–4 quoted separately",
          ].map((c) => (
            <span key={c} className="rounded-full border border-dark-line px-3 py-1.5 text-[13.5px] text-paper/85">
              {c}
            </span>
          ))}
        </div>
        <Toc
          items={[
            { id: "questions", label: "Your seven questions" },
            { id: "phase-1", label: "Phase 1 milestones" },
            { id: "optional", label: "Optional features" },
            { id: "phases", label: "Phases 2–4" },
            { id: "terms", label: "Acceptance & terms" },
          ]}
        />
      </PublicHero>

      <DocSection id="questions" eyebrow="Answers" title="Your seven questions." muted="Each answer links to the part of the demo that shows it." tone="paper">
        <ol className="divide-y divide-line border-y border-line">
          {QUESTIONS.map((x, i) => (
            <li key={x.q} className="grid gap-4 py-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12">
              <div className="flex gap-4">
                <span className="font-display text-[40px] leading-none tracking-[-0.04em] text-muted-display">{i + 1}</span>
                <h3 className="pt-1 text-[19px] font-semibold leading-snug tracking-[-0.01em]">{x.q}</h3>
              </div>
              <div className="space-y-3 text-[16px] leading-relaxed text-ink [&_a]:font-medium [&_a]:text-leaf-ink [&_a]:underline [&_a]:underline-offset-2 [&_code]:rounded [&_code]:bg-fog [&_code]:px-1 [&_code]:font-mono [&_code]:text-[13.5px]">{x.a}</div>
            </li>
          ))}
        </ol>
      </DocSection>

      <DocSection id="phase-1" eyebrow="Required deliverables" title={`Phase 1: ${money(PHASE1.price)}, ${PHASE1.weeks} weeks.`} muted={PHASE1.summary} tone="fog">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {PHASE1.milestones.map((m) => (
            <div key={m.week} className="flex flex-col rounded-[24px] bg-paper p-6">
              <p className="flex items-center justify-between">
                <span className="eyebrow text-muted">{m.week}</span>
                <span className="font-display text-[26px] leading-none tracking-[-0.03em]">{money(m.price)}</span>
              </p>
              <p className="mt-4 text-[18px] font-semibold leading-snug">{m.title}</p>
              <ul className="mt-3 space-y-2 text-[14px] leading-relaxed text-ink">
                {m.items.map((it) => (
                  <li key={it} className="flex gap-2">
                    <Check className="mt-1 size-3.5 shrink-0 text-leaf-ink" />
                    {it}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-col gap-4 rounded-[24px] bg-void p-6 text-paper sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[14px] text-paper/70">Phase 1 total · fixed price</p>
            <p className="font-display text-[48px] leading-none tracking-[-0.04em]">{money(PHASE1.price)}</p>
          </div>
          <p className="max-w-xl text-[14.5px] leading-relaxed text-paper/80">Each milestone is paid on acceptance. If week 1 shows Blackbaud extraction can&apos;t meet the accuracy bar on your test account, we stop there and you&apos;ve spent {money(PHASE1.milestones[0].price)}, with a written report on why.</p>
        </div>
        <p className="eyebrow mb-3 mt-10 text-muted">What I need from you</p>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {["Authorized Blackbaud test account (student, and parent if available)", "Which pages matter most, and any school-specific customizations", "Your preferred hosting and repository", "A short call to agree on the accuracy bar for week 1"].map((t) => (
            <li key={t} className="rounded-[16px] bg-paper p-4 text-[14.5px]">
              {t}
            </li>
          ))}
        </ul>
      </DocSection>

      <DocSection id="optional" eyebrow="Optional for Phase 1" title="Quoted separately." muted="Each one already demonstrated here." tone="paper">
        <div className="grid gap-4 lg:grid-cols-3">
          {OPTIONAL.map((o) => (
            <div key={o.id} className="flex flex-col rounded-[24px] bg-fog p-6">
              <p className="text-[18px] font-semibold leading-snug">{o.title}</p>
              <p className="mt-3 font-display text-[44px] leading-none tracking-[-0.04em]">{money(o.price)}</p>
              <p className="mt-1 text-[13px] text-muted">{o.days}</p>
              <p className="mt-4 text-[14.5px] leading-relaxed text-ink">{o.body}</p>
              <ButtonLink href={o.demo} variant="outline" size="sm" className="mt-auto self-start" arrow>
                See it in the demo
              </ButtonLink>
            </div>
          ))}
        </div>
        <p className="mt-4 flex items-center gap-2 rounded-[16px] bg-leaf px-4 py-3 text-[15px] text-leaf-ink">
          <CircleCheck className="size-4" /> {OPTIONAL_BUNDLE.note}: <b>{money(OPTIONAL_BUNDLE.price)}</b>
        </p>
      </DocSection>

      <DocSection id="phases" eyebrow="Future development" title="Phases 2–4, quoted separately." muted="Ranges now, fixed quotes after Phase 1." tone="fog">
        <div className="grid gap-4 lg:grid-cols-3">
          {PHASES.map((p) => (
            <div key={p.n} className="flex flex-col rounded-[24px] bg-paper p-6">
              <p className="eyebrow text-muted">Phase {p.n}</p>
              <p className="mt-2 font-display text-[30px] leading-[1.1] tracking-[-0.03em]">{p.title}</p>
              <p className="mt-3 text-[16px] font-semibold">{p.price}</p>
              <p className="text-[13px] text-muted">{p.weeks}</p>
              <ul className="mt-4 space-y-2 text-[14px] leading-relaxed">
                {p.items.map((it) => (
                  <li key={it} className="flex gap-2">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-jade" />
                    {it}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </DocSection>

      <DocSection id="terms" eyebrow="Acceptance" title="How we'll know Milestone 1 worked." tone="paper">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["Accurate", "On an agreed sample of real assignments from the test account, titles, classes, due dates and statuses match the portal, with any misses explained."],
            ["Repeatable", "Three syncs in a row with edits in between produce zero duplicates, and every edit appears as a logged field change."],
            ["Portable", "Every stored record validates against cp.academic.v1, and nothing downstream reads Blackbaud-specific fields."],
          ].map(([t, b]) => (
            <div key={t} className="rounded-[20px] bg-fog p-6">
              <p className="text-[18px] font-semibold">{t}</p>
              <p className="mt-2 text-[14.5px] leading-relaxed text-ink">{b}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 max-w-3xl text-[14px] leading-relaxed text-muted">Assumptions: one Blackbaud school instance and the four page types shown here; you own all code and documentation on payment; the prototype runs on a staging environment until legal and policy review is complete. Excluded from Phase 1: production launch, Chrome Web Store publishing, billing and mobile apps.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/sync" arrow>
            Try the sync
          </ButtonLink>
          <ButtonLink href="/architecture" variant="outline">
            Architecture
          </ButtonLink>
        </div>
      </DocSection>
    </PublicShell>
  );
}
