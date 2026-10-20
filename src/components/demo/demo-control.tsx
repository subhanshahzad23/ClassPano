"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { ChevronDown, ChevronLeft, ChevronRight, Compass, Database, Minus, RotateCcw, SlidersHorizontal, X } from "lucide-react";
import { loadSampleSync, resetDemo, setPresenterOpen, setRole, setVersion, setWalkthrough, useDemo, useHydrated } from "@/lib/store";
import { cn } from "@/lib/utils";
import { WALKTHROUGH } from "@/lib/walkthrough";
import { Button } from "@/components/ui/button";
import { ConfirmDialog, PopoverContent, PopoverRoot, PopoverTrigger, Segmented } from "@/components/ui/overlay";
import { trackMilestone } from "./visit-tracker";

const PAGES = [
  { href: "/", label: "Pitch" },
  { href: "/sync", label: "Extension + portal" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/data", label: "Data inspector" },
  { href: "/architecture", label: "Architecture" },
  { href: "/extension", label: "MV3 prototype" },
  { href: "/proposal", label: "Proposal & pricing" },
];

/**
 * Presenter-only control, visually separate from product navigation.
 * Mirrors the Launchpad demo pill: walkthrough, view switches and reset.
 */
export function DemoControl() {
  const hydrated = useHydrated();
  const router = useRouter();
  const open = useDemo((s) => s.presenterOpen);
  const role = useDemo((s) => s.role);
  const version = useDemo((s) => s.version);
  const walk = useDemo((s) => s.walkthrough);
  const count = useDemo((s) => Object.keys(s.items).length);
  const [confirmReset, setConfirmReset] = useState(false);
  const [loading, setLoading] = useState(false);

  return (
    <>
      <div className="no-print fixed bottom-4 left-4 z-[60] flex items-end gap-2">
        <PopoverRoot open={open} onOpenChange={setPresenterOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="group flex h-10 items-center gap-2 rounded-full border border-white/10 bg-void pl-1.5 pr-2.5 text-paper shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] transition-transform hover:-translate-y-0.5"
              aria-label="Open demo controls"
            >
              <span className="grid size-7 place-items-center rounded-full bg-[#333]">
                <SlidersHorizontal className="size-3.5" />
              </span>
              <span className="flex flex-col items-start leading-tight">
                <span className="text-[10.5px] font-semibold tracking-[0.02em] text-jade">Demo · fictional data</span>
                <span className="hidden max-w-[120px] truncate text-[12px] text-paper/85 sm:block">{hydrated ? (walk.open ? `Walkthrough ${walk.step + 1}/${WALKTHROUGH.length}` : "Presenter controls") : "Loading…"}</span>
              </span>
              <ChevronDown className="size-3.5 text-paper/60 transition-transform group-data-[state=open]:rotate-180" aria-hidden />
            </button>
          </PopoverTrigger>
          <PopoverContent side="top" align="start" className="w-[min(92vw,380px)] overflow-hidden p-0">
            <div className="bg-void px-4 py-3 text-paper">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-jade">Presenter controls</p>
              <p className="mt-0.5 text-[13px] text-paper/70">Not part of the product. Westbrook Academy and Ava Thompson are fictional.</p>
            </div>
            <div className="max-h-[min(70vh,600px)] overflow-y-auto p-4">
              <Button
                variant="primary"
                arrow
                className="w-full justify-start"
                icon={<Compass className="size-4" />}
                onClick={() => {
                  setWalkthrough(true, 0);
                  setPresenterOpen(false);
                  trackMilestone("Started the guided walkthrough");
                  router.push(WALKTHROUGH[0].href);
                }}
              >
                Start the guided walkthrough
              </Button>

              <p className="eyebrow mb-2 mt-5 text-muted">Dashboard view</p>
              <Segmented
                label="Dashboard audience"
                value={role}
                onChange={(v) => {
                  setRole(v);
                  toast.success(v === "parent" ? "Viewing as Laura (parent)" : "Viewing as Ava (student)");
                }}
                options={[
                  { value: "student", label: "Student · Ava" },
                  { value: "parent", label: "Parent · Laura" },
                ]}
                className="w-full"
              />

              <p className="eyebrow mb-2 mt-5 text-muted">School portal content</p>
              <Segmented
                label="Portal version"
                value={version}
                onChange={(v) => {
                  setVersion(v);
                  if (v === "B") trackMilestone("Simulated teacher updates");
                  toast.success(v === "B" ? "Teachers updated the portal. Sync again to see what changed." : "Portal back to the first-sync state.");
                }}
                options={[
                  { value: "A", label: "First sync" },
                  { value: "B", label: "After teacher updates" },
                ]}
                className="w-full"
              />

              <div className="mt-4 rounded-[12px] bg-fog p-3 text-[13px]">
                <p className="flex items-center gap-2 font-medium">
                  <Database className="size-4" aria-hidden /> {count} records synced in this browser
                </p>
                <p className="mt-1 text-muted">Stored locally for the demo. Nothing leaves your browser.</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    loading={loading}
                    onClick={async () => {
                      setLoading(true);
                      await loadSampleSync();
                      setLoading(false);
                      setPresenterOpen(false);
                      toast.success("Loaded a completed first sync (4 portal pages).");
                      router.push("/dashboard");
                    }}
                  >
                    Load a completed sync
                  </Button>
                  <Button size="sm" variant="ghost" icon={<RotateCcw className="size-4" />} onClick={() => setConfirmReset(true)}>
                    Reset
                  </Button>
                </div>
              </div>

              <p className="eyebrow mb-1 mt-5 text-muted">Jump to</p>
              <ul className="grid grid-cols-2 gap-1">
                {PAGES.map((p) => (
                  <li key={p.href}>
                    <Link href={p.href} onClick={() => setPresenterOpen(false)} className="block rounded-[8px] px-2 py-1.5 text-[13.5px] hover:bg-fog">
                      {p.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </PopoverContent>
        </PopoverRoot>
      </div>

      <AnimatePresence>{walk.open && hydrated && <WalkthroughCard />}</AnimatePresence>

      <ConfirmDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title="Reset the demo?"
        description="Clears every synced record, sync log and choice in this browser and puts the portal back to its first-sync state."
        confirmLabel="Reset demo"
        onConfirm={async () => {
          resetDemo();
          setPresenterOpen(false);
          toast.success("Demo reset.");
          router.push("/sync");
        }}
      />
    </>
  );
}

function WalkthroughCard() {
  const step = useDemo((s) => s.walkthrough.step);
  const router = useRouter();
  const pathname = usePathname();
  const [min, setMin] = useState(false);
  const s = WALKTHROUGH[Math.min(step, WALKTHROUGH.length - 1)];

  const go = (i: number) => {
    setWalkthrough(true, i);
    trackMilestone(`Walkthrough step ${i + 1}: ${WALKTHROUGH[i].title}`);
    router.push(WALKTHROUGH[i].href);
  };
  const here = pathname === s.href.split("?")[0];

  if (min)
    return (
      <motion.button
        type="button"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        onClick={() => setMin(false)}
        className="no-print fixed bottom-[68px] left-4 z-[59] flex h-9 items-center gap-2 rounded-full bg-paper px-3 text-[13px] font-medium shadow-float ring-1 ring-line"
      >
        <Compass className="size-4 text-leaf-ink" /> Step {step + 1} of {WALKTHROUGH.length}: {s.title.length > 26 ? s.title.slice(0, 26) + "…" : s.title}
      </motion.button>
    );

  return (
    <motion.aside
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
      aria-label="Guided walkthrough"
      className="no-print fixed bottom-[68px] left-4 z-[59] w-[min(calc(100vw-32px),370px)] overflow-hidden rounded-[16px] bg-paper shadow-float ring-1 ring-line"
    >
      <div className="flex items-center justify-between bg-void px-4 py-2.5 text-paper">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-jade">
          Walkthrough · {step + 1} / {WALKTHROUGH.length}
        </p>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setMin(true)} className="grid size-7 place-items-center rounded-[6px] hover:bg-white/10" aria-label="Minimize walkthrough">
            <Minus className="size-4" />
          </button>
          <button type="button" onClick={() => setWalkthrough(false)} className="grid size-7 place-items-center rounded-[6px] hover:bg-white/10" aria-label="Close walkthrough">
            <X className="size-4" />
          </button>
        </div>
      </div>
      <div className="p-4">
        {s.proves && (
          <p className="mb-1.5 inline-flex rounded-full bg-leaf px-2 py-0.5 text-[11.5px] font-medium text-leaf-ink">
            Proves: {s.proves === "accuracy" ? "accurate Blackbaud capture" : s.proves === "repeat" ? "repeat sync, no duplicates" : "platform-neutral format"}
          </p>
        )}
        <p className="text-[16px] font-semibold tracking-[-0.01em]">{s.title}</p>
        <p className="mt-1 text-[13.5px] leading-relaxed text-ink">{s.body}</p>
        <div className="mt-3 flex gap-1" aria-hidden>
          {WALKTHROUGH.map((w, i) => (
            <span key={w.id} className={cn("h-1 flex-1 rounded-full", i <= step ? "bg-jade" : "bg-ash")} />
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between gap-2">
          <Button size="sm" variant="ghost" icon={<ChevronLeft className="size-4" />} disabled={step === 0} onClick={() => go(step - 1)}>
            Back
          </Button>
          <div className="flex gap-2">
            {!here && (
              <Button size="sm" variant="outline" onClick={() => go(step)}>
                Open this step
              </Button>
            )}
            {step < WALKTHROUGH.length - 1 ? (
              <Button size="sm" variant="dark" onClick={() => go(step + 1)}>
                Next <ChevronRight className="size-4" />
              </Button>
            ) : (
              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  trackMilestone("Finished the walkthrough");
                  setWalkthrough(false, 0);
                }}
              >
                Finish
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.aside>
  );
}
