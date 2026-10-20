import Link from "next/link";
import { LogoMark } from "@/components/brand/logo";

const COLS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "The brief",
    links: [
      { label: "The problem", href: "/#problem" },
      { label: "How Sync works", href: "/#how" },
      { label: "What Phase 1 proves", href: "/#proofs" },
      { label: "Privacy by design", href: "/#privacy" },
    ],
  },
  {
    title: "Try it",
    links: [
      { label: "Extension + portal", href: "/sync" },
      { label: "AI-assisted capture", href: "/sync?tab=capture" },
      { label: "Dashboard", href: "/dashboard" },
      { label: "MV3 prototype", href: "/extension" },
    ],
  },
  {
    title: "Dashboard",
    links: [
      { label: "Assignments", href: "/dashboard/assignments" },
      { label: "Grades", href: "/dashboard/grades" },
      { label: "AI briefing", href: "/dashboard/insights" },
      { label: "Data inspector", href: "/dashboard/data" },
    ],
  },
  {
    title: "Technical",
    links: [
      { label: "Architecture", href: "/architecture" },
      { label: "Dedupe & change detection", href: "/architecture#dedupe" },
      { label: "Limitations & policy", href: "/architecture#limits" },
      { label: "Tech stack", href: "/architecture#stack" },
    ],
  },
  {
    title: "Proposal",
    links: [
      { label: "Your seven questions", href: "/proposal#questions" },
      { label: "Phase 1 milestones", href: "/proposal#phase-1" },
      { label: "Optional features", href: "/proposal#optional" },
      { label: "Phases 2–4", href: "/proposal#phases" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-paper" aria-labelledby="footer-h">
      <h2 id="footer-h" className="sr-only">
        Footer
      </h2>
      <div className="container-page pt-16">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-5">
          {COLS.map((c) => (
            <nav key={c.title} aria-label={c.title}>
              <p className="text-[16px] font-medium">{c.title}</p>
              <ul className="mt-4 space-y-1.5">
                {c.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-[15.5px] font-light leading-7 text-void hover:underline hover:underline-offset-4">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-14 flex flex-col gap-2 border-t border-line pt-6 text-[13px] text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>A Phase 1 proof of concept prepared for ClassPano. Westbrook Academy, Ava and Laura Thompson are fictional.</p>
          <p>
            <span className="rounded-[26px] bg-leaf px-2.5 py-0.5 font-medium text-leaf-ink">Demo · fictional data</span>
          </p>
        </div>
      </div>
      <div className="mt-10 overflow-hidden px-[10px]" aria-hidden>
        <div className="flex items-end justify-center gap-[1.5vw] pb-[1vw] leading-[0.8]">
          <LogoMark className="size-[12.5vw] shrink-0" />
          <span className="font-display text-[16.4vw] font-light tracking-[-0.06em]">ClassPano</span>
        </div>
      </div>
    </footer>
  );
}
