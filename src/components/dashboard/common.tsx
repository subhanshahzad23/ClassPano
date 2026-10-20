"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertCircle, CheckCircle2, CircleDashed, Clock, GitMerge, History, Info, Loader2, RefreshCw, ShieldCheck, Sparkles, XCircle } from "lucide-react";
import { KIND_LABEL, STATUS_LABEL, type AcademicItem, type GradeRecord, type ItemStatus } from "@/core/schema";
import { demoNow, loadSampleSync, useDemo } from "@/lib/store";
import { courseColor, dueLabel, FIELD_LABEL, fmtClock, fmtDay, fmtField, fmtShort, STATUS_TONE } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Badge, EmptyState } from "@/components/ui/display";
import { Button, ButtonLink } from "@/components/ui/button";
import { DialogContent, DialogRoot } from "@/components/ui/overlay";

export function useDash() {
  const itemsMap = useDemo((s) => s.items);
  const gradesMap = useDemo((s) => s.grades);
  const syncs = useDemo((s) => s.syncs);
  const version = useDemo((s) => s.version);
  const role = useDemo((s) => s.role);
  const items = useMemo(() => Object.values(itemsMap), [itemsMap]);
  const grades = useMemo(() => Object.values(gradesMap).sort((a, b) => a.courseName.localeCompare(b.courseName)), [gradesMap]);
  return { items, grades, itemsMap, gradesMap, syncs, now: demoNow(version), role, version };
}

export function NoData() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <EmptyState
      className="bg-paper py-16"
      icon={<RefreshCw className="size-5" />}
      title="No school data yet"
      description="Run a sync from the simulated Blackbaud portal, or load the result of a completed first sync across all four portal pages."
      action={
        <>
          <ButtonLink href="/sync" arrow>
            Run the first sync
          </ButtonLink>
          <Button
            variant="outline"
            loading={busy}
            onClick={async () => {
              setBusy(true);
              await loadSampleSync();
              setBusy(false);
              toast.success("Loaded a completed first sync.");
              router.refresh();
            }}
          >
            Load a completed sync
          </Button>
        </>
      }
    />
  );
}

const STATUS_ICON: Record<ItemStatus, typeof Clock> = {
  to_do: CircleDashed,
  in_progress: Loader2,
  submitted: CheckCircle2,
  graded: CheckCircle2,
  overdue: AlertCircle,
  missing: XCircle,
  excused: Info,
  info: Info,
};

export function StatusPill({ status, score, points }: { status: ItemStatus; score?: number; points?: number }) {
  const Icon = STATUS_ICON[status];
  return (
    <Badge tone={STATUS_TONE[status]} icon={<Icon className="size-3.5" aria-hidden />}>
      {STATUS_LABEL[status]}
      {status === "graded" && score != null && points ? ` · ${score}/${points}` : ""}
    </Badge>
  );
}

const PLATFORM_LABEL: Record<string, string> = { blackbaud: "Blackbaud", canvas: "Canvas", generic: "Teacher site", schoology: "Schoology", google_classroom: "Google Classroom", facts: "FACTS" };

export function SourceBadge({ item, compact }: { item: AcademicItem | GradeRecord; compact?: boolean }) {
  const verified = "verified" in item ? item.verified : true;
  if (verified)
    return (
      <span className="inline-flex items-center gap-1 whitespace-nowrap text-[12px] text-leaf-ink">
        <ShieldCheck className="size-3.5" aria-hidden /> {compact ? PLATFORM_LABEL[item.source.platform] : `Verified · ${PLATFORM_LABEL[item.source.platform] ?? item.source.platform}`}
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap text-[12px] text-[#6b21a8]">
      <Sparkles className="size-3.5" aria-hidden /> {compact ? "AI-extracted" : `AI-extracted · confirmed by you`}
    </span>
  );
}

export function CourseDot({ courseKey, className }: { courseKey: string; className?: string }) {
  return <span className={cn("inline-block size-2.5 shrink-0 rounded-full", className)} style={{ background: courseColor(courseKey) }} aria-hidden />;
}

export function ItemRow({ item, now, onOpen, showCourse = true }: { item: AcademicItem; now: string; onOpen: (id: string) => void; showCourse?: boolean }) {
  const late = item.status === "missing" || item.status === "overdue";
  return (
    <button type="button" onClick={() => onOpen(item.id)} className="flex w-full items-center gap-3 rounded-[12px] px-2 py-2.5 text-left transition-colors hover:bg-fog">
      <CourseDot courseKey={item.courseKey} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14.5px] font-medium">{item.title}</span>
        <span className="block truncate text-[12.5px] text-muted">
          {showCourse ? `${item.courseName} · ` : ""}
          {KIND_LABEL[item.kind]}
          {item.history.length ? ` · changed ${item.history.length}×` : ""}
        </span>
      </span>
      <span className={cn("shrink-0 text-right text-[12.5px]", late ? "font-medium text-[#9f1239]" : "text-muted")}>{late ? STATUS_LABEL[item.status] : dueLabel(item.dueAt, now)}</span>
    </button>
  );
}

export function ItemDetail({ id, onClose }: { id: string | null; onClose: () => void }) {
  const item = useDemo((s) => (id ? s.items[id] : undefined));
  const grade = useDemo((s) => (id ? s.grades[id] : undefined));
  const open = !!id && (!!item || !!grade);
  return (
    <DialogRoot open={open} onOpenChange={(v) => !v && onClose()}>
      {item ? (
        <DialogContent title={item.title} description={`${item.courseName} · ${KIND_LABEL[item.kind]}`} size="lg">
          <div className="flex flex-wrap items-center gap-2">
            {item.kind !== "announcement" && item.kind !== "event" && <StatusPill status={item.status} score={item.score} points={item.pointsPossible} />}
            <SourceBadge item={item} />
            {item.confidence != null && <Badge tone="purple">{Math.round(item.confidence * 100)}% extraction confidence</Badge>}
          </div>
          <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 text-[14px] sm:grid-cols-3">
            {[
              ["Due", fmtDay(item.dueAt)],
              ["Assigned", fmtDay(item.assignedAt)],
              ["Points", item.pointsPossible ? `${item.score != null ? `${item.score} / ` : ""}${item.pointsPossible}` : "—"],
              ["Teacher", item.teacher ?? "—"],
              ["First seen", `${fmtShort(item.firstSeenAt)}, ${fmtClock(item.firstSeenAt)}`],
              ["Last seen", `${fmtShort(item.lastSeenAt)}, ${fmtClock(item.lastSeenAt)}`],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-[12.5px] text-muted">{k}</dt>
                <dd className="mt-0.5">{v}</dd>
              </div>
            ))}
          </dl>
          {item.details && <p className="mt-5 rounded-[12px] bg-fog p-3 text-[14.5px] leading-relaxed">{item.details}</p>}
          {item.notes?.length ? (
            <div className="mt-4">
              <p className="eyebrow mb-2 flex items-center gap-1.5 text-muted">
                <GitMerge className="size-3.5" /> Also mentioned elsewhere
              </p>
              <ul className="space-y-1 text-[13.5px]">
                {item.notes.map((n) => (
                  <li key={n} className="rounded-[10px] border-[1.5px] border-dashed border-line px-3 py-2">
                    {n}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className="mt-5">
            <p className="eyebrow mb-2 flex items-center gap-1.5 text-muted">
              <History className="size-3.5" /> Change history
            </p>
            {item.history.length ? (
              <ol className="space-y-1.5 border-l-2 border-line pl-4">
                {item.history.map((h, i) => (
                  <li key={i} className="relative text-[13.5px]">
                    <span className="absolute -left-[21px] top-1.5 size-2.5 rounded-full bg-jade" />
                    <span className="text-muted">{fmtClock(h.at)} · </span>
                    {FIELD_LABEL[h.field] ?? h.field}: <s className="text-muted">{fmtField(h.field, h.from)}</s> → <b>{fmtField(h.field, h.to)}</b>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-[13.5px] text-muted">No changes since it was first synced.</p>
            )}
          </div>
          <div className="mt-5 rounded-[12px] bg-void p-3 font-mono text-[11.5px] leading-relaxed text-paper/85">
            <p>source.platform: {item.source.platform} · adapter: {item.source.adapter}</p>
            <p>source.page: {item.source.pageKind} · externalId: {item.source.externalId ?? "—"}</p>
            <p className="truncate">identityKey: {item.identityKey}</p>
            <p>fingerprint: {item.fingerprint}</p>
          </div>
        </DialogContent>
      ) : grade ? (
        <DialogContent title={`${grade.courseName}: ${grade.percent.toFixed(1)}%`} description={`${grade.teacher ?? ""} · ${grade.term}`} size="md">
          <SourceBadge item={grade} />
          <ol className="mt-4 space-y-1.5 border-l-2 border-line pl-4">
            {grade.history.length ? (
              grade.history.map((h, i) => (
                <li key={i} className="text-[13.5px]">
                  {FIELD_LABEL[h.field] ?? h.field}: <s className="text-muted">{fmtField(h.field, h.from)}</s> → <b>{fmtField(h.field, h.to)}</b> <span className="text-muted">· {fmtClock(h.at)}</span>
                </li>
              ))
            ) : (
              <li className="text-[13.5px] text-muted">No changes since the first sync.</li>
            )}
          </ol>
        </DialogContent>
      ) : null}
    </DialogRoot>
  );
}
