"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Bot, Braces, Check, CheckCircle2, Cloud, Eye, Fingerprint, GitMerge, KeyRound, LayoutDashboard, Lock, LogIn, MousePointerClick, Plug, RefreshCw, ScanSearch, Shield, ShieldCheck, Sparkles, Trash2, UserRound, Users } from "lucide-react";
import { OPTIONAL, PHASE1 } from "@/content/proposal";
import { cn } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/site/reveal";

const money = (n: number) => `$${n.toLocaleString("en-US")}`;

/* ------------------------------------------------------------------ */
/* Problem                                                             */
/* ------------------------------------------------------------------ */

export function Problem() {
  const scattered = [
    { t: "Assignment Center", r: "-rotate-3", d: "18 rows, 6 classes" },
    { t: "Schedule", r: "rotate-2", d: "Tests hide in a calendar" },
    { t: "Progress", r: "-rotate-1", d: "Grades on another page" },
    { t: "Class pages", r: "rotate-3", d: "Instructions in bulletins" },
    { t: "Teacher websites", r: "-rotate-2", d: "Outside the portal" },
    { t: "Emails & PDFs", r: "rotate-1", d: "Deadlines in prose" },
  ];
  return (
    <section id="problem" className="scroll-mt-24 bg-paper py-[var(--space-section)]" aria-labelledby="problem-h">
      <div className="container-page grid items-center gap-12 lg:grid-cols-2">
        <Reveal>
          <p className="eyebrow text-muted">The problem</p>
          <h2 id="problem-h" className="display-lg mt-3">
            Six pages to answer one question: <span className="text-muted-display">what needs attention?</span>
          </h2>
          <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-ink">
            Homework, tests, missing work, grades and teacher instructions are spread across a school portal&apos;s pages, plus teacher sites the portal doesn&apos;t cover. Students and parents rebuild the picture by hand, every week.
          </p>
          <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-ink">ClassPano removes the retyping, screenshots and separate planners: sync a few times a week, and the picture assembles itself.</p>
        </Reveal>
        <Reveal delay={0.1} className="relative">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {scattered.map((s) => (
              <div key={s.t} className={cn("rounded-[14px] bg-fog p-4 transition-transform duration-500 hover:rotate-0", s.r)}>
                <p className="text-[14px] font-semibold">{s.t}</p>
                <p className="mt-1 text-[12.5px] text-muted">{s.d}</p>
                <div className="mt-3 space-y-1" aria-hidden>
                  <span className="block h-1.5 w-full rounded-full bg-ash" />
                  <span className="block h-1.5 w-3/4 rounded-full bg-ash" />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 flex items-center gap-3 rounded-[16px] bg-void p-4 text-paper">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-jade text-void">
              <LayoutDashboard className="size-4" />
            </span>
            <p className="text-[14.5px]">
              <span className="font-semibold">One ClassPano dashboard.</span> <span className="text-paper/70">Verified school data, change history and AI guidance, clearly separated.</span>
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* How it works — sticky, scroll-led                                   */
/* ------------------------------------------------------------------ */

const STEPS = [
  { Icon: LogIn, t: "Log in to the school portal as usual", b: "ClassPano never sees the password. School SSO, MFA and portal policies keep working untouched, because the student is simply browsing.", tag: "No credentials stored" },
  { Icon: MousePointerClick, t: "Click Sync ClassPano", b: "The first time, a plain-language permission screen explains what is read. After that it's one click per page, so a 12-year-old can do it alone.", tag: "activeTab · per click" },
  { Icon: ScanSearch, t: "Browse assignments, grades, calendar, class pages", b: "Each page is read by that platform's module. Pages you don't sync are never touched, and nothing runs in the background.", tag: "Platform modules" },
  { Icon: Cloud, t: "Organized and synced to the ClassPano account", b: "Records are normalized to one format, matched against what's already saved, and only real changes are written, each one logged.", tag: "Dedupe + change log" },
  { Icon: Sparkles, t: "AI turns it into a plan", b: "Briefings and study plans for students and parents, always labeled as AI and always citing the school records they came from.", tag: "Verified ≠ AI" },
];

export function How() {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.i));
        });
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    refs.current.forEach((r) => r && io.observe(r));
    return () => io.disconnect();
  }, []);
  return (
    <section id="how" className="scroll-mt-24 bg-fog py-[var(--space-section)]" aria-labelledby="how-h">
      <div className="container-page grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="eyebrow text-muted">How ClassPano Sync works</p>
          <h2 id="how-h" className="display-lg mt-3">
            Exactly the flow in your brief. <span className="text-muted-display">Built so a student can do it alone.</span>
          </h2>
          <ol className="mt-8 hidden space-y-1 lg:block">
            {STEPS.map((s, i) => (
              <li key={s.t}>
                <button
                  type="button"
                  onClick={() => refs.current[i]?.scrollIntoView({ behavior: "smooth", block: "center" })}
                  className={cn("flex w-full items-center gap-3 rounded-[12px] px-3 py-2.5 text-left transition-colors", active === i ? "bg-paper" : "hover:bg-paper/60")}
                >
                  <span className={cn("grid size-7 shrink-0 place-items-center rounded-full text-[13px] font-semibold tabular transition-colors", active === i ? "bg-jade text-void" : "bg-ash text-muted")}>{i + 1}</span>
                  <span className={cn("text-[15px]", active === i ? "font-medium" : "text-muted")}>{s.t}</span>
                </button>
              </li>
            ))}
          </ol>
          <ButtonLink href="/sync" arrow className="mt-8">
            Try it on the simulated portal
          </ButtonLink>
        </div>
        <div className="space-y-4">
          {STEPS.map(({ Icon, t, b, tag }, i) => (
            <div key={t} ref={(el) => void (refs.current[i] = el)} data-i={i} className={cn("rounded-[24px] bg-paper p-6 transition-all duration-500 sm:p-8", active === i ? "opacity-100" : "lg:opacity-60")}>
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-full bg-void text-paper">
                  <Icon className="size-5" />
                </span>
                <span className="font-display text-[44px] leading-none tracking-[-0.04em] text-muted-display">0{i + 1}</span>
                <span className="ml-auto rounded-full bg-leaf px-2.5 py-1 text-[12px] font-medium text-leaf-ink">{tag}</span>
              </div>
              <h3 className="mt-5 font-display text-[30px] leading-[1.1] tracking-[-0.03em]">{t}</h3>
              <p className="mt-2 max-w-xl text-[16px] leading-relaxed text-ink">{b}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* The three proofs                                                    */
/* ------------------------------------------------------------------ */

export function Proofs() {
  return (
    <section id="proofs" className="dots-dark on-dark scroll-mt-24 py-[var(--space-section)] text-paper" aria-labelledby="proofs-h">
      <div className="container-page">
        <Reveal>
          <p className="eyebrow text-muted-display">Your first milestone has to prove three things</p>
          <h2 id="proofs-h" className="display-lg mt-3 max-w-4xl">
            This demo already proves all three. <span className="text-muted-display">Milestone 1 repeats them on your Blackbaud test account.</span>
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          <Reveal className="flex min-w-0 flex-col rounded-[24px] bg-[#111] p-6 ring-1 ring-white/10">
            <p className="eyebrow text-jade">01 · Accuracy</p>
            <h3 className="mt-3 font-display text-[30px] leading-[1.1] tracking-[-0.03em]">Collect from Blackbaud accurately</h3>
            <p className="mt-3 text-[15px] leading-relaxed text-paper/75">Four page types read by one module: titles, classes, types, assign and due dates, details, points, status, scores, grades and announcements.</p>
            <div className="mt-6 grid grid-cols-3 gap-2 text-center">
              {[
                ["18", "assignments"],
                ["6", "grades"],
                ["4", "announcements & events"],
              ].map(([v, l]) => (
                <div key={l} className="rounded-[12px] bg-white/5 py-3">
                  <p className="font-display text-[32px] leading-none tracking-[-0.04em]">{v}</p>
                  <p className="mt-1 px-1 text-[11.5px] text-paper/60">{l}</p>
                </div>
              ))}
            </div>
            <Link href="/sync" className="mt-auto inline-flex items-center gap-1.5 pt-6 text-[14px] font-medium text-jade hover:underline">
              Run the first sync <ArrowRight className="size-4" />
            </Link>
          </Reveal>
          <Reveal delay={0.08} className="flex min-w-0 flex-col rounded-[24px] bg-[#111] p-6 ring-1 ring-white/10">
            <p className="eyebrow text-jade">02 · Repeat sync</p>
            <h3 className="mt-3 font-display text-[30px] leading-[1.1] tracking-[-0.03em]">Sync again and again, no duplicates</h3>
            <p className="mt-3 text-[15px] leading-relaxed text-paper/75">Teachers post a grade, extend a deadline, mark work missing and add a quiz. Sync #2 finds exactly that, and logs each field that changed.</p>
            <div className="mt-6 grid grid-cols-4 gap-1.5 text-center">
              {[
                ["1", "new"],
                ["4", "updated"],
                ["14", "unchanged"],
                ["0", "duplicates"],
              ].map(([v, l], i) => (
                <div key={l} className={cn("rounded-[12px] py-3", i === 3 ? "bg-jade text-void" : "bg-white/5")}>
                  <p className="font-display text-[30px] leading-none tracking-[-0.04em]">{v}</p>
                  <p className={cn("mt-1 text-[11.5px]", i === 3 ? "text-void/70" : "text-paper/60")}>{l}</p>
                </div>
              ))}
            </div>
            <Link href="/sync" className="mt-auto inline-flex items-center gap-1.5 pt-6 text-[14px] font-medium text-jade hover:underline">
              Simulate teacher updates <ArrowRight className="size-4" />
            </Link>
          </Reveal>
          <Reveal delay={0.16} className="flex min-w-0 flex-col rounded-[24px] bg-[#111] p-6 ring-1 ring-white/10">
            <p className="eyebrow text-jade">03 · One format</p>
            <h3 className="mt-3 font-display text-[30px] leading-[1.1] tracking-[-0.03em]">Stored the same way, whatever the platform</h3>
            <p className="mt-3 text-[15px] leading-relaxed text-paper/75">Every record lands as cp.academic.v1, with its source kept alongside. The dashboard and AI never know which platform supplied it.</p>
            <pre className="mt-6 overflow-x-auto rounded-[12px] bg-black p-3 font-mono text-[11.5px] leading-relaxed text-paper/85 ring-1 ring-white/10">{`{
  "kind": "lab",
  "title": "Lab Report: Enzyme Activity",
  "courseName": "Biology",
  "dueAt": "2026-11-02",
  "status": "in_progress",
  "verified": true,
  "source": { "platform": "blackbaud", ... },
  "history": [{ "field": "dueAt", ... }]
}`}</pre>
            <Link href="/dashboard/data" className="mt-auto inline-flex items-center gap-1.5 pt-6 text-[14px] font-medium text-jade hover:underline">
              Inspect stored records <ArrowRight className="size-4" />
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Modules — the hybrid approach                                        */
/* ------------------------------------------------------------------ */

export function Modules() {
  const lanes = [
    { Icon: Plug, t: "Platform modules", n: "Your approach #1", b: "One module per school system. Blackbaud ships in Phase 1; Canvas is already sketched.", chips: [["Blackbaud", "ready"], ["Canvas", "preview"], ["Schoology", "planned"], ["FACTS", "planned"]] },
    { Icon: Bot, t: "AI-assisted page capture", n: "Your approach #2", b: "For anything unsupported: the student selects a page, AI proposes items, the student confirms.", chips: [["Teacher sites", "demo"], ["Newsletters", "demo"], ["Any page", "review step"]] },
    { Icon: Braces, t: "Official APIs", n: "Your approach #3", b: "Same output format, so an API connector can replace or supplement page reading per school.", chips: [["Google Classroom API", "planned"], ["Blackbaud SKY API", "partnership"], ["Canvas REST", "planned"]] },
  ];
  return (
    <section id="modules" className="scroll-mt-24 bg-paper py-[var(--space-section)]" aria-labelledby="modules-h">
      <div className="container-page">
        <Reveal className="max-w-3xl">
          <p className="eyebrow text-muted">One extension, many platforms</p>
          <h2 id="modules-h" className="display-lg mt-3">
            The hybrid you described. <span className="text-muted-display">Three ways in, one way out.</span>
          </h2>
        </Reveal>
        <div className="mt-12 grid items-stretch gap-4 lg:grid-cols-[1fr_auto_0.8fr]">
          <div className="grid gap-3">
            {lanes.map(({ Icon, t, n, b, chips }, i) => (
              <Reveal key={t} delay={i * 0.06} className="rounded-[20px] bg-fog p-5">
                <div className="flex items-center gap-2.5">
                  <Icon className="size-5" />
                  <p className="text-[16px] font-semibold">{t}</p>
                  <span className="ml-auto text-[12px] text-muted">{n}</span>
                </div>
                <p className="mt-1.5 text-[14.5px] text-ink">{b}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {chips.map(([c, s]) => (
                    <span key={c} className={cn("rounded-full px-2.5 py-1 text-[12px]", s === "ready" || s === "demo" ? "bg-leaf font-medium text-leaf-ink" : "bg-paper text-ink")}>
                      {c} · {s}
                    </span>
                  ))}
                </div>
              </Reveal>
            ))}
          </div>
          <div className="grid place-items-center py-2 lg:px-2" aria-hidden>
            <ArrowRight className="size-6 rotate-90 text-muted lg:rotate-0" />
          </div>
          <Reveal delay={0.1} className="flex flex-col rounded-[24px] bg-void p-6 text-paper">
            <p className="eyebrow text-jade">Shared core</p>
            <ul className="mt-4 space-y-3 text-[15px]">
              {[
                [Fingerprint, "Normalize to cp.academic.v1"],
                [GitMerge, "Identity keys, fingerprints, fuzzy match"],
                [RefreshCw, "Field-level change history"],
                [Shield, "Verified vs AI provenance on every record"],
              ].map(([I, l]) => {
                const C = I as typeof Fingerprint;
                return (
                  <li key={l as string} className="flex items-center gap-3">
                    <C className="size-4 text-jade" /> {l as string}
                  </li>
                );
              })}
            </ul>
            <div className="mt-6 rounded-[14px] bg-white/5 p-4 text-[14px] text-paper/75">Then out to the ClassPano API → dashboard, alerts and AI. Adding a platform never touches any of this.</div>
            <ButtonLink href="/architecture" variant="light" arrow className="mt-auto self-start">
              Architecture in detail
            </ButtonLink>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Privacy                                                              */
/* ------------------------------------------------------------------ */

export function Privacy() {
  const items = [
    { Icon: KeyRound, t: "No school credentials, ever", b: "The student logs in to the portal themselves. ClassPano never sees, stores or replays a password or session cookie." },
    { Icon: MousePointerClick, t: "Scoped, user-initiated access", b: "activeTab grants access to one tab, on one click. No “read all websites”, no background scraping." },
    { Icon: Eye, t: "Only what's needed", b: "Assignment, class, date, status and grade fields. No rosters, no classmates, no messages, no hidden form data." },
    { Icon: ShieldCheck, t: "Verified vs AI, always visible", b: "School data is marked verified with its source. AI output is labeled, cites its records, and never overwrites school data." },
    { Icon: Trash2, t: "Export and delete anytime", b: "One-click export in an open format, and real deletion of records and logs. Try it in the data inspector." },
    { Icon: Users, t: "Built for minors", b: "Parental consent for under-13s (COPPA), FERPA-aligned handling, Student Privacy Pledge principles, encrypted at rest." },
  ];
  return (
    <section id="privacy" className="scroll-mt-24 bg-fog py-[var(--space-section)]" aria-labelledby="privacy-h">
      <div className="container-page">
        <Reveal className="max-w-3xl">
          <p className="eyebrow text-muted">Privacy and security</p>
          <h2 id="privacy-h" className="display-lg mt-3">
            Student records deserve <span className="text-muted-display">a careful default.</span>
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(({ Icon, t, b }, i) => (
            <Reveal key={t} delay={(i % 3) * 0.06} className="rounded-[20px] bg-paper p-6">
              <span className="grid size-10 place-items-center rounded-full bg-leaf text-leaf-ink">
                <Icon className="size-5" />
              </span>
              <p className="mt-4 text-[17px] font-semibold">{t}</p>
              <p className="mt-1.5 text-[14.5px] leading-relaxed text-muted">{b}</p>
            </Reveal>
          ))}
        </div>
        <p className="mt-6 text-[14px] text-muted">
          Legal, platform-policy and technical limits to settle before a commercial launch are listed openly on the{" "}
          <Link href="/architecture#limits" className="font-medium text-leaf-ink underline underline-offset-2">
            architecture page
          </Link>
          .
        </p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Deliverables                                                         */
/* ------------------------------------------------------------------ */

export function Deliverables() {
  const req = [
    ["Working Chrome extension prototype using Manifest V3", "/extension"],
    ["User-initiated collection from selected Blackbaud pages", "/sync"],
    ["Assignment titles, due dates, class names and details", "/dashboard/assignments"],
    ["Conversion into a consistent, structured format", "/dashboard/data"],
    ["Basic duplicate detection and repeat-sync functionality", "/sync"],
    ["A simple demonstration interface showing the assignments", "/dashboard"],
    ["Modular extraction architecture for more platforms", "/architecture#modules"],
    ["Documentation: architecture, limitations, next steps", "/architecture"],
  ];
  return (
    <section id="deliverables" className="scroll-mt-24 bg-paper py-[var(--space-section)]" aria-labelledby="del-h">
      <div className="container-page grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <Reveal>
          <p className="eyebrow text-muted">Phase 1 deliverables</p>
          <h2 id="del-h" className="display-lg mt-3">
            All eight required. <span className="text-muted-display">Each one clickable here.</span>
          </h2>
          <div className="mt-8 rounded-[20px] bg-void p-6 text-paper">
            <p className="text-[14px] text-paper/70">Phase 1 proof of concept</p>
            <p className="mt-1 font-display text-[56px] leading-none tracking-[-0.04em]">{money(PHASE1.price)}</p>
            <p className="mt-2 text-[14.5px] text-paper/80">
              Fixed price · {PHASE1.weeks} weeks · {PHASE1.milestones.length} milestones
            </p>
            <ButtonLink href="/proposal" arrow className="mt-5">
              Full proposal and phases
            </ButtonLink>
          </div>
        </Reveal>
        <div>
          <ul className="divide-y divide-line border-y border-line">
            {req.map(([t, href], i) => (
              <li key={t}>
                <Link href={href} className="group flex items-center gap-4 py-4">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-jade text-void">
                    <Check className="size-4" />
                  </span>
                  <span className="text-[13px] text-muted tabular">0{i + 1}</span>
                  <span className="flex-1 text-[16px]">{t}</span>
                  <ArrowRight className="size-4 text-muted transition-transform group-hover:translate-x-1" />
                </Link>
              </li>
            ))}
          </ul>
          <p className="eyebrow mt-10 text-muted">Optional, quoted separately</p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-3">
            {OPTIONAL.map((o) => (
              <li key={o.id}>
                <Link href={o.demo} className="block h-full rounded-[16px] bg-fog p-4 transition-colors hover:bg-ash">
                  <p className="text-[14.5px] font-semibold leading-snug">{o.title}</p>
                  <p className="mt-2 font-display text-[28px] leading-none tracking-[-0.03em]">{money(o.price)}</p>
                  <p className="mt-1 text-[12.5px] text-muted">{o.days} · demo included</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Closing                                                              */
/* ------------------------------------------------------------------ */

export function Closing() {
  return (
    <section className="dots-dark on-dark py-[var(--space-section)] text-paper" aria-labelledby="close-h">
      <div className="container-page text-center">
        <CheckCircle2 className="mx-auto size-8 text-jade" aria-hidden />
        <h2 id="close-h" className="display-lg mx-auto mt-4 max-w-3xl">
          Not a one-time scraping script. <span className="text-muted-display">The foundation of a product.</span>
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-[17px] leading-relaxed text-paper/80">Next step: connect to your authorized Blackbaud test account and run Milestone 1 against real pages. You get a go / no-go on accuracy in the first week.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/proposal" size="lg" arrow>
            Read the proposal
          </ButtonLink>
          <ButtonLink href="/sync" size="lg" variant="ghost-dark">
            Try the sync again
          </ButtonLink>
        </div>
        <p className="mt-6 flex items-center justify-center gap-2 text-[12.5px] text-[#9a9a9a]">
          <Lock className="size-3.5" /> Fictional data · <UserRound className="size-3.5" /> No sign-up needed
        </p>
      </div>
    </section>
  );
}
