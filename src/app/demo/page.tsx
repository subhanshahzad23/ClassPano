"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Blocks, Compass, Database, FileText, LayoutDashboard, PlugZap, Puzzle, ScanText, Sparkles } from "lucide-react";
import { setRole, setWalkthrough } from "@/lib/store";
import { WALKTHROUGH } from "@/lib/walkthrough";
import { Logo } from "@/components/brand/logo";
import { Button, ButtonLink } from "@/components/ui/button";
import { trackMilestone } from "@/components/demo/visit-tracker";

const CARDS = [
  { href: "/sync", Icon: PlugZap, t: "Extension + school portal", b: "Consent, first sync, browse four portal pages, then simulate teacher updates and sync again.", tag: "Start here" },
  { href: "/sync?tab=capture", Icon: ScanText, t: "AI-assisted capture", b: "A teacher's own website no module supports. Review AI-proposed items before saving." },
  { href: "/dashboard", Icon: LayoutDashboard, t: "Student dashboard", b: "Next up, this week, what changed, grades. Every fact shows its source." },
  { href: "/dashboard/insights", Icon: Sparkles, t: "Parent briefing", b: "The same data in a parent's voice, labeled as AI, citing school records.", role: "parent" as const },
  { href: "/dashboard/data", Icon: Database, t: "Data inspector", b: "cp.academic.v1 records with identity keys, fingerprints and change history. Export or delete." },
  { href: "/extension", Icon: Puzzle, t: "MV3 prototype", b: "Download the unpacked extension and run it on the test portal in your own Chrome." },
  { href: "/architecture", Icon: Blocks, t: "Architecture & limitations", b: "Platform modules, dedupe algorithm, AI capture design, security and policy risks." },
  { href: "/proposal", Icon: FileText, t: "Proposal & pricing", b: "Answers to the seven questions, Phase 1 milestones, optional features, Phases 2–4." },
];

export default function DemoExplorer() {
  const router = useRouter();
  return (
    <main id="main" className="min-h-dvh bg-paper pb-24">
      <section className="dots-dark on-dark pb-40 text-paper">
        <div className="container-page flex h-24 items-center justify-between">
          <Link href="/" aria-label="ClassPano home">
            <Logo dark />
          </Link>
          <Link href="/" className="text-[14px] text-paper/70 hover:text-paper">
            Back to the pitch
          </Link>
        </div>
        <div className="container-page pt-10">
          <p className="eyebrow text-muted-display">Interactive demo · fictional data</p>
          <h1 className="display-hero mt-4 max-w-[17ch]">
            <span className="text-muted-display">Explore the proof of concept.</span> Pick a starting point.
          </h1>
          <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-paper/85">No sign-up and no passwords. Westbrook Academy, Ava and her parent Laura are fictional, and everything you sync stays in this browser.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              size="lg"
              arrow
              icon={<Compass className="size-4" />}
              onClick={() => {
                setWalkthrough(true, 1);
                trackMilestone("Started the guided walkthrough");
                router.push(WALKTHROUGH[1].href);
              }}
            >
              Start the guided walkthrough
            </Button>
            <ButtonLink href="/proposal" size="lg" variant="ghost-dark">
              Skip to the proposal
            </ButtonLink>
          </div>
        </div>
      </section>
      <div className="container-page -mt-24 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {CARDS.map(({ href, Icon, t, b, tag, role }) => (
          <Link key={href} href={href} onClick={() => role && setRole(role)} className="group flex flex-col rounded-[24px] bg-fog p-6 transition-colors hover:bg-ash">
            <div className="flex items-center justify-between">
              <span className="grid size-11 place-items-center rounded-full bg-paper">
                <Icon className="size-5" />
              </span>
              {tag && <span className="rounded-full bg-jade px-2.5 py-1 text-[12px] font-medium">{tag}</span>}
            </div>
            <p className="mt-5 font-display text-[26px] leading-[1.1] tracking-[-0.03em]">{t}</p>
            <p className="mt-2 text-[14.5px] leading-relaxed text-muted">{b}</p>
            <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-[14px] font-medium">
              Open <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
