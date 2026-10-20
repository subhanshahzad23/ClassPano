"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Check, CheckCircle2, ChevronDown, Code2, KeyRound, Loader2, Lock, MousePointerClick, RefreshCw, ShieldCheck, Sparkles, X } from "lucide-react";
import type { ExtractResult } from "@/core/adapters/types";
import { PORTAL_PAGES, type PortalPage, type PortalVersion } from "@/core/portal/data";
import type { SyncRun } from "@/core/schema";
import { fmtClock, fmtField, FIELD_LABEL } from "@/lib/format";
import { cn } from "@/lib/utils";
import { LogoMark } from "@/components/brand/logo";
import { Button, ButtonLink } from "@/components/ui/button";
import { DialogContent, DialogRoot } from "@/components/ui/overlay";

export type SyncPhase = "idle" | "detect" | "read" | "normalize" | "match" | "done" | "error";

const PHASES: { id: Exclude<SyncPhase, "idle" | "done" | "error">; label: string }[] = [
  { id: "detect", label: "Detect platform and page" },
  { id: "read", label: "Read academic data on this page" },
  { id: "normalize", label: "Normalize to cp.academic.v1" },
  { id: "match", label: "Match, dedupe and log changes" },
];

const PAGE_LABEL: Record<string, string> = { assignments: "Assignment Center", schedule: "Schedule", progress: "Progress", class: "Class page", unknown: "Page" };

export function PanelHeader({ subtitle }: { subtitle: string }) {
  return (
    <div className="flex items-center gap-2.5 border-b border-line px-4 py-3">
      <LogoMark className="size-7" />
      <div className="min-w-0 leading-tight">
        <p className="text-[14px] font-semibold">ClassPano Sync</p>
        <p className="truncate text-[12px] text-muted">{subtitle}</p>
      </div>
      <span className="ml-auto shrink-0 whitespace-nowrap rounded-full bg-fog px-2 py-0.5 text-[11px] text-muted">MV3 · v0.4</span>
    </div>
  );
}

export function ConsentScreen({ onAllow, onDecline }: { onAllow: () => void; onDecline: () => void }) {
  return (
    <div className="flex-1 overflow-y-auto p-4">
      <p className="eyebrow text-muted">First time on this site</p>
      <h3 className="mt-2 font-display text-[28px] leading-[1.08] tracking-[-0.03em]">Let ClassPano read this page when you press Sync?</h3>
      <ul className="mt-4 space-y-2.5 text-[13.5px]">
        {[
          { ok: true, t: "Reads assignments, due dates, classes, grades and class announcements on pages you choose." },
          { ok: true, t: "Only when you press Sync. No background monitoring." },
          { ok: false, t: "Never sees, stores or asks for your school password." },
          { ok: false, t: "Never submits, posts or changes anything in your portal." },
        ].map((r) => (
          <li key={r.t} className="flex gap-2.5">
            <span className={cn("mt-0.5 grid size-5 shrink-0 place-items-center rounded-full", r.ok ? "bg-leaf text-leaf-ink" : "bg-[#ffe4e6] text-[#9f1239]")}>{r.ok ? <Check className="size-3" /> : <X className="size-3" />}</span>
            <span className="leading-snug">{r.t}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 rounded-[12px] bg-fog p-3 text-[12.5px] leading-relaxed text-ink">
        <p className="flex items-center gap-1.5 font-medium text-void">
          <KeyRound className="size-3.5" /> Chrome permissions requested
        </p>
        <p className="mt-1">
          <code className="font-mono text-[11.5px]">activeTab</code>, <code className="font-mono text-[11.5px]">scripting</code>, <code className="font-mono text-[11.5px]">storage</code>, <code className="font-mono text-[11.5px]">sidePanel</code>. No “read all websites” permission: access is granted per click, per tab.
        </p>
      </div>
      <p className="mt-3 text-[12px] leading-relaxed text-muted">Students under 13 need a parent or guardian to create the ClassPano account first (COPPA).</p>
      <div className="mt-4 flex flex-col gap-2">
        <Button onClick={onAllow} arrow className="w-full">
          Allow on this site
        </Button>
        <Button variant="ghost" onClick={onDecline} className="w-full">
          Not now
        </Button>
      </div>
    </div>
  );
}

export function SyncProgress({ phase, readCount, adapterLabel, pageKind }: { phase: SyncPhase; readCount: number; adapterLabel: string; pageKind: string }) {
  const idx = PHASES.findIndex((p) => p.id === phase);
  return (
    <ol className="space-y-2.5" aria-live="polite">
      {PHASES.map((p, i) => {
        const state = phase === "done" || i < idx ? "done" : i === idx ? "active" : "todo";
        return (
          <li key={p.id} className="flex items-start gap-2.5 text-[13.5px]">
            <span className={cn("mt-0.5 grid size-5 shrink-0 place-items-center rounded-full", state === "done" ? "bg-jade text-void" : state === "active" ? "bg-void text-paper" : "bg-ash text-muted")}>
              {state === "done" ? <Check className="size-3" /> : state === "active" ? <Loader2 className="size-3 animate-spin" /> : <span className="size-1.5 rounded-full bg-current" />}
            </span>
            <span className={cn(state === "todo" && "text-muted")}>
              {p.label}
              {p.id === "detect" && state !== "todo" && <span className="block text-[12px] text-muted">{adapterLabel} · {PAGE_LABEL[pageKind] ?? pageKind}</span>}
              {p.id === "read" && state !== "todo" && <span className="block text-[12px] text-muted tabular">{readCount} records read</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function Tile({ label, value, tone }: { label: string; value: number; tone?: "jade" | "dark" }) {
  return (
    <div className={cn("rounded-[12px] p-3", tone === "jade" ? "bg-leaf" : tone === "dark" ? "bg-void text-paper" : "bg-fog")}>
      <p className={cn("text-[11.5px]", tone === "dark" ? "text-paper/70" : "text-muted")}>{label}</p>
      <p className="font-display text-[30px] leading-none tracking-[-0.04em] tabular">{value}</p>
    </div>
  );
}

export function SyncResult({ run, raw, sample }: { run: SyncRun; raw?: ExtractResult; sample?: unknown }) {
  const [showAll, setShowAll] = useState(false);
  const [inspect, setInspect] = useState(false);
  const created = run.changes.filter((c) => c.type === "created");
  const updated = run.changes.filter((c) => c.type !== "created");
  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        <Tile label="New" value={run.counts.created} tone={run.counts.created ? "jade" : undefined} />
        <Tile label="Updated" value={run.counts.updated} tone={run.counts.updated ? "jade" : undefined} />
        <Tile label="Unchanged" value={run.counts.unchanged} />
        <Tile label="Duplicates prevented" value={run.counts.duplicatesPrevented} />
      </div>
      <p className="mt-2 flex items-center gap-1.5 rounded-[10px] bg-void px-3 py-2 text-[12.5px] text-paper">
        <CheckCircle2 className="size-4 text-jade" /> 0 duplicates created · {run.durationMs} ms · {fmtClock(run.at)}
      </p>

      {updated.length > 0 && (
        <div className="mt-4">
          <p className="eyebrow mb-2 text-muted">What changed</p>
          <ul className="space-y-2">
            {updated.map((c) => (
              <li key={c.recordId} className="rounded-[10px] border-[1.5px] border-line p-2.5">
                <p className="text-[13.5px] font-medium leading-snug">{c.title}</p>
                <ul className="mt-1 space-y-0.5">
                  {c.fields?.map((f) => (
                    <li key={f.field} className="text-[12.5px] text-ink">
                      <span className="text-muted">{FIELD_LABEL[f.field] ?? f.field}:</span> <span className="line-through decoration-[#9f1239]/50">{fmtField(f.field, f.from)}</span> → <span className="font-medium text-leaf-ink">{fmtField(f.field, f.to)}</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}

      {created.length > 0 && (
        <div className="mt-4">
          <button type="button" onClick={() => setShowAll((v) => !v)} className="flex w-full items-center justify-between text-left">
            <span className="eyebrow text-muted">{created.length} new record{created.length === 1 ? "" : "s"}</span>
            <ChevronDown className={cn("size-4 text-muted transition-transform", showAll && "rotate-180")} />
          </button>
          <AnimatePresence initial={false}>
            {showAll && (
              <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-2 space-y-1 overflow-hidden">
                {created.map((c) => (
                  <li key={c.recordId} className="flex items-center gap-2 text-[13px]">
                    <span className="size-1.5 shrink-0 rounded-full bg-jade" />
                    <span className="truncate">{c.title}</span>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      )}

      {raw && sample != null && (
        <button type="button" onClick={() => setInspect(true)} className="mt-4 flex items-center gap-1.5 text-[13px] font-medium text-leaf-ink hover:underline">
          <Code2 className="size-4" /> Inspect raw → normalized
        </button>
      )}
      {raw && sample != null && (
        <DialogRoot open={inspect} onOpenChange={setInspect}>
          <DialogContent title="What the adapter read, and what ClassPano stored" description="Left: exactly what blackbaud@0.4.0 read from the page. Right: the same record in the platform-neutral cp.academic.v1 format." size="xl">
            <div className="grid gap-3 md:grid-cols-2">
              <JsonBlock title="Raw (from the page)" value={firstRaw(raw)} />
              <JsonBlock title="Normalized (cp.academic.v1)" value={sample} />
            </div>
          </DialogContent>
        </DialogRoot>
      )}
    </div>
  );
}

function firstRaw(raw: ExtractResult) {
  return raw.assignments[0] ?? raw.grades[0] ?? raw.announcements[0] ?? raw.events[0];
}

export function JsonBlock({ title, value, className }: { title: string; value: unknown; className?: string }) {
  return (
    <div className={cn("min-w-0 overflow-hidden rounded-[12px] bg-void text-paper", className)}>
      <p className="border-b border-white/10 px-3 py-2 text-[11px] font-medium uppercase tracking-[0.16em] text-jade">{title}</p>
      <pre className="max-h-[420px] overflow-auto p-3 font-mono text-[11.5px] leading-relaxed text-paper/90">{JSON.stringify(value, null, 2)}</pre>
    </div>
  );
}

export function SessionChecklist({ captured, current, onGo }: { captured: Partial<Record<PortalPage, string>>; current: PortalPage; onGo: (p: PortalPage) => void }) {
  const done = PORTAL_PAGES.filter((p) => captured[p.id]).length;
  return (
    <div className="rounded-[12px] bg-fog p-3">
      <p className="flex items-center justify-between text-[12.5px]">
        <span className="font-medium">Pages captured this sync</span>
        <span className="tabular text-muted">
          {done}/{PORTAL_PAGES.length}
        </span>
      </p>
      <ul className="mt-2 space-y-1">
        {PORTAL_PAGES.map((p) => (
          <li key={p.id}>
            <button type="button" onClick={() => onGo(p.id)} className={cn("flex w-full items-center gap-2 rounded-[8px] px-1.5 py-1 text-left text-[13px] transition-colors hover:bg-paper", p.id === current && "bg-paper")}>
              <span className={cn("grid size-4 place-items-center rounded-full", captured[p.id] ? "bg-jade text-void" : "border-[1.5px] border-line")}>{captured[p.id] && <Check className="size-2.5" />}</span>
              <span className="flex-1">{p.label}</span>
              {p.id === current ? <span className="text-[11px] text-muted">open</span> : !captured[p.id] && <ArrowRight className="size-3.5 text-muted" />}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function TeacherUpdateCard({ version, onUpdate, onReset }: { version: PortalVersion; onUpdate: () => void; onReset: () => void }) {
  if (version === "B")
    return (
      <div className="rounded-[12px] border-[1.5px] border-dashed border-line p-3 text-[12.5px]">
        <p className="flex items-center gap-1.5 font-medium">
          <RefreshCw className="size-3.5" /> Portal updated by teachers (5:35 PM)
        </p>
        <p className="mt-1 text-muted">Sync Assignment Center, Progress and the Biology page again to see what changed.</p>
        <button type="button" onClick={onReset} className="mt-1.5 text-[12px] text-muted underline-offset-2 hover:underline">
          Back to the first-sync state
        </button>
      </div>
    );
  return (
    <div className="rounded-[12px] border-[1.5px] border-dashed border-line p-3">
      <p className="text-[12.5px] font-medium">Prove repeat sync</p>
      <p className="mt-0.5 text-[12.5px] text-muted">Teachers post a grade, extend a due date, mark work missing and add a quiz. Then sync again.</p>
      <Button size="sm" variant="dark" className="mt-2" icon={<Sparkles className="size-3.5" />} onClick={onUpdate}>
        Simulate teacher updates
      </Button>
    </div>
  );
}

export function PanelFooter() {
  return (
    <div className="flex items-center gap-2 border-t border-line px-4 py-2.5 text-[11.5px] text-muted">
      <Lock className="size-3.5" /> Reads only this tab, only when you click. <ShieldCheck className="ml-auto size-3.5 text-leaf-ink" />
    </div>
  );
}

export function IdleHint({ pageLabel }: { pageLabel: string }) {
  return (
    <div className="rounded-[12px] bg-fog p-3 text-[13px]">
      <p className="flex items-center gap-1.5 font-medium">
        <MousePointerClick className="size-4" /> Ready on {pageLabel}
      </p>
      <p className="mt-1 text-muted">Blackbaud Education Management detected. Press Sync to capture what&apos;s on this page.</p>
    </div>
  );
}

export function DashboardCta() {
  return (
    <ButtonLink href="/dashboard" variant="outline" className="w-full" arrow>
      Open Ava&apos;s dashboard
    </ButtonLink>
  );
}

export function SmallLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-[12.5px] font-medium text-leaf-ink hover:underline">
      {children}
    </Link>
  );
}
