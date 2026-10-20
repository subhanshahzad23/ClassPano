"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, CircleAlert, Download, MousePointer2, RefreshCw, Search, Sparkles } from "lucide-react";
import { setRole, setWalkthrough } from "@/lib/store";
import { cn } from "@/lib/utils";
import { WALKTHROUGH } from "@/lib/walkthrough";
import { LogoMark } from "@/components/brand/logo";
import { Button, ButtonLink } from "@/components/ui/button";
import { trackMilestone } from "@/components/demo/visit-tracker";

/*
 * Black dotted hero (same structure as the Launchpad demo): oversized light
 * serif headline with a muted first statement and a white emphasized line,
 * supporting copy, CTA row, then a product canvas overlapping the black→white cut.
 */
export function Hero() {
  const router = useRouter();
  return (
    <>
      <section data-hero className="dots-dark on-dark relative -mt-[80px] pt-[160px] text-paper sm:-mt-[88px] sm:pt-[190px]" aria-labelledby="hero-h">
        <div className="container-page">
          <h1 id="hero-h" className="display-hero max-w-[15ch] sm:max-w-none">
            <span className="line-mask text-muted-display">
              <span style={{ animationDelay: "120ms" }}>Every class, every portal.</span>
            </span>
            <span className="line-mask">
              <span style={{ animationDelay: "260ms" }}>One clear view.</span>
            </span>
          </h1>
          <p className="rise-in mt-6 max-w-[740px] text-[17px] leading-[1.55] text-paper/95 sm:text-[18px]" style={{ animationDelay: "520ms" }}>
            A working Phase 1 proof of concept for ClassPano Sync: a Manifest V3 extension that captures assignments from Blackbaud, syncs again without duplicates, and stores everything in one format that works for any school platform.
          </p>
          <div className="rise-in mt-8 flex flex-wrap items-center gap-3" style={{ animationDelay: "640ms" }}>
            <ButtonLink href="/sync" size="lg" arrow>
              Try the sync
            </ButtonLink>
            <Button
              size="lg"
              variant="ghost-dark"
              onClick={() => {
                setWalkthrough(true, 1);
                trackMilestone("Started the guided walkthrough");
                router.push(WALKTHROUGH[1].href);
              }}
            >
              Start the 6-minute walkthrough
            </Button>
          </div>
          <p className="rise-in mt-3 text-[12.5px] text-[#9a9a9a]" style={{ animationDelay: "720ms" }}>
            Built for the ClassPano Phase 1 brief · fictional school and student · nothing leaves your browser
          </p>
        </div>
        <div className="h-[120px] sm:h-[210px]" aria-hidden />
      </section>
      <section className="relative bg-paper pb-10" aria-label="A look at ClassPano">
        <div className="dots-dark absolute inset-x-0 top-0 h-[40%] sm:h-[48%]" aria-hidden />
        <div className="container-page relative -mt-[90px] sm:-mt-[150px]">
          <Showcase />
        </div>
      </section>
    </>
  );
}

const ROLES = [
  { key: "student", label: "Student", body: "Everything due this week in one place, without retyping a single assignment.", cta: "Open Ava's dashboard", href: "/dashboard", role: "student" as const },
  { key: "parent", label: "Parent", body: "Know what's missing and what's coming up before the report card does.", cta: "See the parent view", href: "/dashboard/insights", role: "parent" as const },
  { key: "founder", label: "ClassPano", body: "Proof that Blackbaud data can be captured accurately, re-synced cleanly and stored in a platform-neutral format.", cta: "See the three proofs", href: "/#proofs" },
  { key: "dev", label: "Engineering", body: "Typed platform modules, one shared normalizer, deterministic dedupe and a field-level change log.", cta: "Read the architecture", href: "/architecture" },
];

function Showcase() {
  const [role, setRoleKey] = useState(ROLES[0].key);
  const r = ROLES.find((x) => x.key === role)!;
  return (
    <div className="relative">
      {/* Floating toolbar, top-left (mirrors the Launchpad canvas) */}
      <div className="absolute -top-6 left-4 z-20 hidden items-center gap-3 rounded-[14px] bg-paper px-4 py-3 shadow-float sm:left-[6%] sm:flex">
        <LogoMark className="size-7" />
        <span className="text-[15px] font-medium">Ava Thompson</span>
        <ChevronDown className="size-4 text-muted" aria-hidden />
        <span className="mx-1 h-5 w-px bg-line" aria-hidden />
        <Download className="size-4" aria-hidden />
        <Search className="size-4" aria-hidden />
      </div>

      <div className="dots-light relative overflow-hidden rounded-[28px] bg-[#f7f7f7] px-4 pb-8 pt-14 sm:ml-[3%] sm:px-10 sm:pb-14 sm:pt-20 lg:mr-[22%]">
        <p className="eyebrow text-muted">Week of Oct 26 · Westbrook Academy</p>
        <p className="mt-1 font-display text-[34px] leading-none tracking-[-0.03em] sm:text-[44px]">Ava&apos;s week, in one view</p>

        <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_1.15fr]">
          {/* Mini extension panel */}
          <div className="rounded-[16px] bg-paper p-4 shadow-[0_1px_0_rgba(0,0,0,0.04)] ring-1 ring-black/5">
            <div className="flex items-center gap-2">
              <LogoMark className="size-6" />
              <div className="leading-tight">
                <p className="text-[13px] font-semibold">ClassPano Sync</p>
                <p className="text-[11.5px] text-muted">Blackbaud · Assignment Center</p>
              </div>
              <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-leaf px-2 py-0.5 text-[11px] font-medium text-leaf-ink">
                <RefreshCw className="size-3" /> Sync #2
              </span>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-1.5 text-center">
              {[
                ["New", 1, true],
                ["Updated", 4, true],
                ["Same", 14, false],
                ["Dupes", 0, false],
              ].map(([l, v, hi]) => (
                <div key={String(l)} className={cn("rounded-[10px] py-2", hi ? "bg-leaf" : "bg-fog")}>
                  <p className="font-display text-[24px] leading-none tracking-[-0.04em]">{v}</p>
                  <p className="mt-0.5 text-[10.5px] text-muted">{l}</p>
                </div>
              ))}
            </div>
            <ul className="mt-3 space-y-1.5 text-[12.5px]">
              <li className="rounded-[8px] bg-fog px-2.5 py-1.5">
                <span className="font-medium">Lab Report: Enzyme Activity</span>
                <span className="block text-muted">
                  Due date: <s>Oct 29</s> → <b className="text-leaf-ink">Nov 2</b>
                </span>
              </li>
              <li className="rounded-[8px] bg-fog px-2.5 py-1.5">
                <span className="font-medium">Personal Narrative</span>
                <span className="block text-muted">
                  Status: Submitted → <b className="text-leaf-ink">Graded 88/100</b>
                </span>
              </li>
            </ul>
          </div>

          {/* This week */}
          <div className="relative rounded-[16px] bg-paper p-4 ring-1 ring-black/5">
            <p className="flex items-center justify-between text-[13px] font-semibold">
              Due this week <span className="text-[11.5px] font-normal text-muted">Verified · Blackbaud</span>
            </p>
            <ul className="mt-2 divide-y divide-line">
              {[
                { c: "#ffaa00", t: "Mesopotamia Map Activity", m: "World History", d: "Missing", red: true },
                { c: "#00c27a", t: "Read Ch. 6.1–6.3 + guided notes", m: "Biology", d: "Today" },
                { c: "#79c1ff", t: "Problem Set 3.4 – Substitution", m: "Algebra I", d: "Wed" },
                { c: "#be53ff", t: "Of Mice and Men Reading Check", m: "English 9", d: "Wed" },
                { c: "#79c1ff", t: "Unit 3 Test – Systems of Equations", m: "Algebra I", d: "Nov 3" },
              ].map((x) => (
                <li key={x.t} className="flex items-center gap-2.5 py-2">
                  <span className="size-2 shrink-0 rounded-full" style={{ background: x.c }} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium">{x.t}</span>
                    <span className="block text-[11.5px] text-muted">{x.m}</span>
                  </span>
                  <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium", x.red ? "bg-[#ffe4e6] text-[#9f1239]" : "bg-fog text-ink")}>
                    {x.red && <CircleAlert className="mr-0.5 inline size-3" />}
                    {x.d}
                  </span>
                </li>
              ))}
            </ul>
            {/* Multiplayer-style cursor (Launchpad canvas motif) */}
            <div className="pointer-events-none absolute -right-2 top-10 hidden sm:block" aria-hidden>
              <MousePointer2 className="size-4 fill-[#5887ff] text-[#5887ff]" />
              <span className="ml-3 rounded-[6px] bg-[#5887ff] px-2 py-0.5 text-[11px] font-medium text-paper">Laura · parent</span>
            </div>
          </div>
        </div>

        {/* Sticky note + AI card */}
        <div className="mt-5 flex flex-wrap items-start gap-4">
          <div className="-rotate-2 rounded-[2px] bg-lemon px-4 py-3 text-[13.5px] leading-snug shadow-[0_8px_16px_-8px_rgba(0,0,0,0.25)]">
            Lab report moved to Mon, Nov 2
            <span className="block text-[11.5px] text-ink/70">caught on sync #2 · no duplicate</span>
          </div>
          <div className="max-w-[360px] rounded-[16px] border-[1.5px] border-dashed border-[#d8b4fe] bg-paper p-3.5">
            <p className="flex items-center gap-1.5 text-[11.5px] font-medium text-[#6b21a8]">
              <Sparkles className="size-3.5" /> AI suggestion · based on 3 school records
            </p>
            <p className="mt-1 text-[13px] leading-snug">Start with the missing History map tonight (30 min), then review for Wednesday&apos;s reading check.</p>
          </div>
          <div className="pointer-events-none hidden items-center sm:flex" aria-hidden>
            <MousePointer2 className="size-4 fill-[#be53ff] text-[#be53ff]" />
            <span className="ml-1 rounded-[6px] bg-[#be53ff] px-2 py-0.5 text-[11px] font-medium text-paper">Ava</span>
          </div>
        </div>
      </div>

      {/* Role selector (Launchpad "Which role are you exploring?") */}
      <div className="relative z-10 mx-auto -mt-6 w-full max-w-[340px] rounded-[20px] bg-paper p-4 shadow-panel sm:mr-0 lg:absolute lg:right-[2%] lg:top-[-48px] lg:mt-0 lg:w-[300px]">
        <p className="text-center text-[17px] font-medium">Which view are you exploring?</p>
        <div className="mt-3 grid grid-cols-2 gap-2" role="radiogroup" aria-label="View">
          {ROLES.map((x) => (
            <button
              key={x.key}
              type="button"
              role="radio"
              aria-checked={role === x.key}
              onClick={() => setRoleKey(x.key)}
              className={cn("grid h-[78px] place-items-center rounded-[8px] bg-fog text-[15px] font-medium transition-colors hover:bg-ash", role === x.key && "spectrum-ring bg-paper")}
            >
              {x.label}
            </button>
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={r.key} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }} className="mt-4 text-center">
            <p className="text-[14.5px] leading-relaxed">{r.body}</p>
            <Link
              href={r.href}
              onClick={() => r.role && setRole(r.role)}
              className="mt-4 inline-flex h-10 items-center rounded-[8px] bg-void px-4 text-[14.5px] font-medium text-paper transition-colors hover:bg-[#222]"
            >
              {r.cta}
            </Link>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
