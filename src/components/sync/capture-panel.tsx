"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Check, ClipboardPaste, GitMerge, Loader2, Quote, ScanText, Sparkles, TextSelect } from "lucide-react";
import { candidateToItem, extractCandidates, type CaptureCandidate } from "@/core/ai-capture";
import { findFuzzyMatch } from "@/core/merge";
import { KIND_LABEL, type ItemKind, type SyncRun } from "@/core/schema";
import { demoNow, saveCaptured, useDemo } from "@/lib/store";
import { cn, sleep } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/form";
import { DialogContent, DialogRoot } from "@/components/ui/overlay";
import { trackMilestone } from "@/components/demo/visit-tracker";
import { TEACHER_SITE } from "./teacher-site";

type Stage = "start" | "reading" | "review" | "saved";

const KINDS: ItemKind[] = ["homework", "test", "quiz", "project", "lab", "essay", "reading", "event", "other"];

/** The side panel when the current site has no platform module. */
export function CapturePanel({ contentRef }: { contentRef: React.RefObject<HTMLDivElement | null> }) {
  const version = useDemo((s) => s.version);
  const items = useDemo((s) => s.items);
  const [stage, setStage] = useState<Stage>("start");
  const [cands, setCands] = useState<(CaptureCandidate & { keep: boolean })[]>([]);
  const [ignored, setIgnored] = useState<string[]>([]);
  const [chars, setChars] = useState(0);
  const [run, setRun] = useState<SyncRun | null>(null);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [paste, setPaste] = useState("");
  const [pasteCourse, setPasteCourse] = useState("");
  const url = `https://${TEACHER_SITE.host}${TEACHER_SITE.path}`;
  const now = demoNow(version);

  const analyze = async (text: string, courseHint: string, fromPage: boolean) => {
    setStage("reading");
    setChars(text.length);
    if (fromPage && contentRef.current) {
      const blocks = Array.from(contentRef.current.querySelectorAll("li, p"));
      for (const b of blocks) {
        b.setAttribute("data-cp-ai", "reading");
        await sleep(110);
      }
      await sleep(300);
      blocks.forEach((b) => b.removeAttribute("data-cp-ai"));
    } else await sleep(900);
    const r = extractCandidates(text, { courseHint, refDate: now.slice(0, 10) });
    setCands(r.candidates.map((c) => ({ ...c, keep: c.suggested })));
    setIgnored(r.ignored);
    setStage("review");
    trackMilestone("Ran AI-assisted capture on an unsupported site");
  };

  const fromPage = () => {
    const root = contentRef.current;
    if (!root) return;
    const sel = window.getSelection();
    const selected = sel && !sel.isCollapsed && root.contains(sel.anchorNode) ? sel.toString() : "";
    void analyze(selected || root.innerText, TEACHER_SITE.courseHint, !selected);
  };

  const matches = useMemo(() => {
    const m: Record<string, string | null> = {};
    for (const c of cands) {
      const it = candidateToItem(c, { url, now });
      const f = findFuzzyMatch(items, it);
      m[c.tempId] = f && f.match.verified ? f.match.title : null;
    }
    return m;
  }, [cands, items, url, now]);

  const keepCount = cands.filter((c) => c.keep).length;
  const update = (id: string, patch: Partial<CaptureCandidate & { keep: boolean }>) => setCands((cs) => cs.map((c) => (c.tempId === id ? { ...c, ...patch } : c)));

  if (stage === "start")
    return (
      <div className="flex-1 overflow-y-auto p-4">
        <div className="rounded-[12px] bg-[#fff6dd] p-3 text-[13px]">
          <p className="flex items-center gap-1.5 font-medium">
            <AlertTriangle className="size-4 text-[#7a4b00]" /> No ClassPano module for this site
          </p>
          <p className="mt-1 text-ink">{TEACHER_SITE.host} isn&apos;t a supported school platform. You can still capture it with AI. You&apos;ll review everything before it&apos;s saved.</p>
        </div>
        <div className="mt-4 space-y-2">
          <Button onClick={fromPage} className="w-full justify-start" icon={<ScanText className="size-4" />} arrow>
            Capture this page with AI
          </Button>
          <p className="flex items-start gap-1.5 px-1 text-[12px] text-muted">
            <TextSelect className="mt-0.5 size-3.5 shrink-0" /> Tip: highlight part of the page first to send only that text.
          </p>
          <Button variant="outline" onClick={() => setPasteOpen(true)} className="w-full justify-start" icon={<ClipboardPaste className="size-4" />}>
            Paste your own text instead
          </Button>
        </div>
        <div className="mt-5 rounded-[12px] bg-fog p-3 text-[12.5px] leading-relaxed text-ink">
          <p className="font-medium text-void">What gets sent</p>
          <p className="mt-1">Only the visible text you choose, with no cookies, form fields or hidden data. It&apos;s processed to extract dates and tasks, then discarded. In this demo the extraction runs locally in your browser.</p>
        </div>
        <PasteDialog open={pasteOpen} onOpenChange={setPasteOpen} text={paste} setText={setPaste} course={pasteCourse} setCourse={setPasteCourse} onRun={() => { setPasteOpen(false); void analyze(paste, pasteCourse || "My class", false); }} />
      </div>
    );

  if (stage === "reading")
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
        <span className="grid size-12 place-items-center rounded-full bg-leaf">
          <Loader2 className="size-5 animate-spin text-leaf-ink" />
        </span>
        <p className="mt-3 text-[15px] font-medium">Reading {chars.toLocaleString()} characters</p>
        <p className="mt-1 text-[13px] text-muted">Looking for tasks, dates and classes…</p>
      </div>
    );

  if (stage === "saved" && run)
    return (
      <div className="flex-1 overflow-y-auto p-4">
        <p className="eyebrow text-muted">Saved after your review</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <div className="rounded-[12px] bg-leaf p-3">
            <p className="text-[11.5px] text-muted">New (AI-extracted)</p>
            <p className="font-display text-[30px] leading-none tracking-[-0.04em]">{run.counts.created}</p>
          </div>
          <div className="rounded-[12px] bg-fog p-3">
            <p className="text-[11.5px] text-muted">Merged into school records</p>
            <p className="font-display text-[30px] leading-none tracking-[-0.04em]">{run.counts.duplicatesPrevented}</p>
          </div>
        </div>
        <ul className="mt-4 space-y-2">
          {run.changes.map((c) => (
            <li key={c.recordId + c.type} className="flex items-start gap-2 text-[13px]">
              {c.type === "merged" ? <GitMerge className="mt-0.5 size-4 shrink-0 text-leaf-ink" /> : <Sparkles className="mt-0.5 size-4 shrink-0 text-[#6b21a8]" />}
              <span>
                {c.type === "merged" ? (
                  <>
                    Merged into Blackbaud record <span className="font-medium">{c.title}</span>. The school version stays authoritative and the teacher-site note is attached.
                  </>
                ) : (
                  <>
                    <span className="font-medium">{c.title}</span>, labeled <em>AI-extracted · confirmed by you</em>
                  </>
                )}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-5 flex flex-col gap-2">
          <Button variant="outline" onClick={() => setStage("start")}>
            Capture again (nothing duplicates)
          </Button>
        </div>
      </div>
    );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <p className="eyebrow text-muted">Review before saving</p>
        <p className="mt-1 text-[13px] text-ink">
          {cands.length} possible items found. Uncheck anything that isn&apos;t real work, and fix titles or dates. Nothing is saved until you confirm.
        </p>
        <ul className="mt-3 space-y-2.5">
          {cands.map((c) => (
            <li key={c.tempId} className={cn("rounded-[12px] border-[1.5px] p-3 transition-colors", c.keep ? "border-void" : "border-line bg-[#fafafa]")}>
              <div className="flex items-start gap-2">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={c.keep}
                  aria-label={`Save ${c.title}`}
                  onClick={() => update(c.tempId, { keep: !c.keep })}
                  className={cn("mt-1 grid size-5 shrink-0 place-items-center rounded-[5px] border-[1.5px]", c.keep ? "border-void bg-void text-paper" : "border-line bg-paper")}
                >
                  {c.keep && <Check className="size-3.5" />}
                </button>
                <div className="min-w-0 flex-1">
                  <Input value={c.title} onChange={(e) => update(c.tempId, { title: e.target.value })} className="h-8 px-2 text-[13.5px] font-medium" aria-label="Title" />
                  <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                    <Select value={c.kind} onChange={(e) => update(c.tempId, { kind: e.target.value as ItemKind })} className="h-8 text-[12.5px]" aria-label="Type">
                      {KINDS.map((k) => (
                        <option key={k} value={k}>
                          {KIND_LABEL[k]}
                        </option>
                      ))}
                    </Select>
                    <Input type="date" value={c.dueAt ?? ""} onChange={(e) => update(c.tempId, { dueAt: e.target.value || undefined })} className="h-8 px-2 text-[12.5px]" aria-label="Due date" />
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-ash">
                      <span className={cn("block h-full rounded-full", c.confidence >= 0.8 ? "bg-jade" : c.confidence >= 0.6 ? "bg-amber" : "bg-coral")} style={{ width: `${c.confidence * 100}%` }} />
                    </span>
                    <span className="text-[11.5px] text-muted tabular">{Math.round(c.confidence * 100)}% confident</span>
                  </div>
                  {(c.flags.length > 0 || matches[c.tempId]) && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {matches[c.tempId] && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-leaf px-2 py-0.5 text-[11px] font-medium text-leaf-ink">
                          <GitMerge className="size-3" /> Matches Blackbaud: {matches[c.tempId]}
                        </span>
                      )}
                      {c.flags.map((f) => (
                        <span key={f} className="rounded-full bg-[#fff1cc] px-2 py-0.5 text-[11px] font-medium text-[#7a4b00]">
                          {f}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="mt-1.5 flex gap-1 text-[11.5px] leading-snug text-muted">
                    <Quote className="mt-0.5 size-3 shrink-0" /> {c.evidence}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
        {ignored.length > 0 && (
          <p className="mt-3 text-[12px] text-muted">
            Skipped {ignored.length} line{ignored.length === 1 ? "" : "s"} with no task or date (e.g. “{ignored[0].slice(0, 48)}…”).
          </p>
        )}
      </div>
      <div className="border-t border-line p-3">
        <Button
          className="w-full"
          disabled={!keepCount}
          onClick={() => {
            const r = saveCaptured(
              cands.filter((c) => c.keep),
              url,
            );
            setRun(r);
            setStage("saved");
            trackMilestone("Saved reviewed AI-captured items");
          }}
        >
          Save {keepCount} confirmed item{keepCount === 1 ? "" : "s"}
        </Button>
        <p className="mt-1.5 text-center text-[11.5px] text-muted">Saved as AI-extracted and kept separate from verified school data</p>
      </div>
    </div>
  );
}

function PasteDialog({ open, onOpenChange, text, setText, course, setCourse, onRun }: { open: boolean; onOpenChange: (v: boolean) => void; text: string; setText: (v: string) => void; course: string; setCourse: (v: string) => void; onRun: () => void }) {
  return (
    <DialogRoot open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title="Try AI capture on your own text"
        description="Paste a class newsletter, an email from a teacher, or a syllabus excerpt. Dates like 11/3, Nov 3 or Friday are understood."
        footer={
          <Button disabled={text.trim().length < 10} onClick={onRun}>
            Extract items
          </Button>
        }
      >
        <div className="space-y-3">
          <Input placeholder="Class name (e.g. Chemistry)" value={course} onChange={(e) => setCourse(e.target.value)} aria-label="Class name" />
          <Textarea rows={8} placeholder={"Reminder: Chapter 5 test on Thursday 11/5.\nLab write-up due Monday, Nov 9."} value={text} onChange={(e) => setText(e.target.value)} aria-label="Text to capture" />
        </div>
      </DialogContent>
    </DialogRoot>
  );
}
