"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { NavigationMenu as NM } from "radix-ui";
import { ArrowUpRight, ChevronDown, Compass, Menu as MenuIcon, X } from "lucide-react";
import { setWalkthrough } from "@/lib/store";
import { cn } from "@/lib/utils";
import { WALKTHROUGH } from "@/lib/walkthrough";
import { Logo } from "@/components/brand/logo";
import { ButtonLink } from "@/components/ui/button";
import { trackMilestone } from "@/components/demo/visit-tracker";

/*
 * Floating white navigation bar (same pattern as the Launchpad demo: 16px from
 * the top, 64px tall, 16px radius, float shadow, sticky). The primary CTA is
 * jade over the dark hero and switches to black once the page scrolls past it.
 */

const BRIEF_LINKS = [
  { href: "/#problem", title: "The problem", desc: "Six portal pages to answer one question" },
  { href: "/#how", title: "How Sync works", desc: "Log in, click once, browse, done" },
  { href: "/#proofs", title: "What Phase 1 proves", desc: "Accuracy, repeat sync, one format" },
  { href: "/#privacy", title: "Privacy by design", desc: "No credentials, scoped permissions, deletion" },
];

const TRY_LINKS = [
  { href: "/sync", title: "Extension + school portal", desc: "Run real syncs against a simulated Blackbaud portal" },
  { href: "/sync?tab=capture", title: "AI-assisted capture", desc: "An unsupported site, reviewed before saving" },
  { href: "/dashboard", title: "ClassPano dashboard", desc: "Student and parent views, AI briefing" },
  { href: "/extension", title: "Install the MV3 prototype", desc: "A real unpacked Chrome extension" },
];

export function SiteNav({ overDark = false }: { overDark?: boolean }) {
  const router = useRouter();
  const [scrolledPastHero, setScrolledPastHero] = useState(!overDark);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuValue, setMenuValue] = useState("");

  useEffect(() => {
    if (!overDark) return;
    const hero = document.querySelector("[data-hero]");
    if (!hero) return;
    const io = new IntersectionObserver(([e]) => setScrolledPastHero(!e.isIntersecting), { rootMargin: "-80px 0px 0px 0px", threshold: 0 });
    io.observe(hero);
    return () => io.disconnect();
  }, [overDark]);

  useEffect(() => {
    document.documentElement.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [mobileOpen]);

  const startWalk = () => {
    setWalkthrough(true, 0);
    setMobileOpen(false);
    trackMilestone("Started the guided walkthrough");
    router.push(WALKTHROUGH[0].href);
  };

  const dropdown =
    "absolute left-0 top-full z-10 mt-3 rounded-[16px] bg-paper p-2 shadow-float before:absolute before:inset-x-0 before:-top-3 before:h-3 before:content-[''] data-[state=open]:animate-[pop-in_180ms_cubic-bezier(0.23,1,0.32,1)]";
  const trigger =
    "group inline-flex h-10 items-center gap-1 rounded-[8px] px-3.5 text-[15.5px] text-void transition-colors duration-200 hover:bg-fog data-[state=open]:bg-fog focus-visible:outline-2 focus-visible:outline-void";

  return (
    <>
      <header className="no-print sticky top-0 z-50 px-3 pt-3 sm:px-6 sm:pt-4 lg:px-10">
        <div className="mx-auto flex h-16 max-w-[1360px] items-center rounded-[16px] bg-paper pl-4 pr-2 shadow-float sm:pr-3">
          <Link href="/" className="flex shrink-0 items-center rounded-[8px] pr-2" aria-label="ClassPano Sync home">
            <Logo responsive />
          </Link>
          <span className="mx-4 hidden h-7 w-px bg-line lg:block" aria-hidden />

          <NM.Root className="relative hidden lg:block" delayDuration={80} value={menuValue} onValueChange={setMenuValue}>
            <NM.List className="flex items-center gap-0.5">
              <NM.Item className="relative">
                <NM.Trigger className={trigger}>
                  The brief <ChevronDown className="size-3.5 transition-transform duration-200 group-data-[state=open]:rotate-180" aria-hidden />
                </NM.Trigger>
                <NM.Content className={dropdown + " w-[340px]"}>
                  <ul>
                    {BRIEF_LINKS.map((l) => (
                      <li key={l.href}>
                        <Link href={l.href} onClick={() => setMenuValue("")} className="block rounded-[10px] px-3 py-2.5 transition-colors hover:bg-fog focus-visible:bg-fog focus-visible:outline-none">
                          <span className="block text-[15px] text-void">{l.title}</span>
                          <span className="block text-[13px] text-muted">{l.desc}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </NM.Content>
              </NM.Item>
              <NM.Item className="relative">
                <NM.Trigger className={trigger}>
                  Try it <ChevronDown className="size-3.5 transition-transform duration-200 group-data-[state=open]:rotate-180" aria-hidden />
                </NM.Trigger>
                <NM.Content className={dropdown + " w-[480px]"}>
                  <ul className="grid gap-1">
                    {TRY_LINKS.map((l) => (
                      <li key={l.href}>
                        <Link href={l.href} onClick={() => setMenuValue("")} className="group/t flex items-start gap-4 rounded-[12px] p-3 transition-colors hover:bg-fog focus-visible:bg-fog focus-visible:outline-none">
                          <span className="min-w-0 flex-1">
                            <span className="block font-display text-[22px] leading-tight tracking-[-0.02em] text-void">{l.title}</span>
                            <span className="mt-0.5 block text-[13.5px] text-muted">{l.desc}</span>
                          </span>
                          <ArrowUpRight className="mt-1 size-4 text-muted transition-transform duration-300 group-hover/t:-translate-y-0.5 group-hover/t:translate-x-0.5" aria-hidden />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </NM.Content>
              </NM.Item>
              <NM.Item>
                <NM.Link asChild>
                  <Link href="/architecture" className={trigger}>
                    Architecture
                  </Link>
                </NM.Link>
              </NM.Item>
              <NM.Item>
                <NM.Link asChild>
                  <Link href="/proposal" className={trigger}>
                    Proposal
                  </Link>
                </NM.Link>
              </NM.Item>
            </NM.List>
          </NM.Root>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <button type="button" onClick={startWalk} className="hidden h-10 items-center gap-2 rounded-[8px] border-[1.5px] border-line bg-paper px-4 text-[15px] font-medium transition-colors hover:border-void md:inline-flex">
              <Compass className="size-4" aria-hidden /> Walkthrough
            </button>
            <Link
              href="/sync"
              className={cn(
                "group/btn relative inline-flex h-10 items-center overflow-hidden whitespace-nowrap rounded-[8px] pl-3.5 pr-[48px] text-[14.5px] font-medium transition-colors duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] sm:pl-4 sm:pr-[52px] sm:text-[15px]",
                scrolledPastHero ? "bg-void text-paper" : "bg-jade text-void",
              )}
            >
              <span aria-hidden className={cn("pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover/btn:opacity-100", scrolledPastHero ? "bg-white/12" : "bg-black/10")} />
              <span className="relative">
                Try <span className="hidden min-[400px]:inline">the sync</span>
                <span className="min-[400px]:hidden">it</span>
              </span>
              <span aria-hidden className={cn("absolute bottom-[2px] right-[2px] top-[2px] grid w-9 place-items-center rounded-[6px] transition-colors duration-300", scrolledPastHero ? "bg-[#4b4b4b] text-paper" : "bg-mint text-void")}>
                <ChevronDown className="size-[18px] -rotate-90 transition-transform duration-300 group-hover/btn:translate-x-[3px]" />
              </span>
            </Link>
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="grid size-11 place-items-center rounded-[8px] hover:bg-fog lg:hidden"
              aria-label="Open menu"
              aria-expanded={mobileOpen}
            >
              <MenuIcon className="size-6" />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-[65] flex flex-col bg-paper lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
          >
            <div className="flex h-[88px] items-center justify-between px-7">
              <Logo />
              <button type="button" onClick={() => setMobileOpen(false)} className="grid size-11 place-items-center rounded-[8px] hover:bg-fog" aria-label="Close menu" autoFocus>
                <X className="size-6" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-7 pb-8" aria-label="Mobile">
              <MobileGroup title="The brief" links={BRIEF_LINKS.map((l) => ({ href: l.href, label: l.title }))} onNavigate={() => setMobileOpen(false)} />
              <MobileGroup title="Try it" links={TRY_LINKS.map((l) => ({ href: l.href, label: l.title }))} onNavigate={() => setMobileOpen(false)} />
              <Link href="/architecture" onClick={() => setMobileOpen(false)} className="flex h-14 items-center border-b border-line text-[18px]">
                Architecture
              </Link>
              <Link href="/proposal" onClick={() => setMobileOpen(false)} className="flex h-14 items-center border-b border-line text-[18px]">
                Proposal &amp; pricing
              </Link>
              <div className="mt-8 flex flex-col gap-2">
                <button type="button" onClick={startWalk} className="flex h-12 items-center justify-center gap-2 rounded-[8px] border-[1.5px] border-line text-[16px] font-medium">
                  <Compass className="size-4" /> Guided walkthrough
                </button>
                <ButtonLink href="/sync" size="lg" arrow className="w-full">
                  Try the sync
                </ButtonLink>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function MobileGroup({ title, links, onNavigate }: { title: string; links: { href: string; label: string }[]; onNavigate: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-line">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex h-14 w-full items-center justify-between text-[18px]" aria-expanded={open}>
        {title}
        <ChevronDown className={cn("size-5 transition-transform duration-300", open && "rotate-180")} aria-hidden />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }} className="overflow-hidden">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} onClick={onNavigate} className="flex h-11 items-center pl-3 text-[16px] text-muted hover:text-void">
                  {l.label}
                </Link>
              </li>
            ))}
            <li className="h-2" />
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
