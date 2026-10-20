"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, CalendarClock, CircleAlert, History, RefreshCw, Sparkles } from "lucide-react";
import { buildBriefing } from "@/core/insights";
import { KIND_LABEL } from "@/core/schema";
import { SCHOOL } from "@/core/portal/data";
import { courseColor, daysUntil, dueLabel, FIELD_LABEL, fmtClock, fmtField, fmtLongDay, isOpen, isWork } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button, ButtonLink } from "@/components/ui/button";
import { PageHeader, Panel, PanelHeader } from "@/components/ui/display";
import { CourseDot, ItemDetail, ItemRow, NoData, SourceBadge, useDash } from "@/components/dashboard/common";

export default function OverviewPage() {
  const { items, grades, syncs, now, role } = useDash();
  const [openId, setOpenId] = useState<string | null>(null);
  const parent = role === "parent";

  const open = useMemo(
    () =>
      items
        .filter(isOpen)
        .sort((a, b) => {
          const la = a.status === "missing" || a.status === "overdue" ? 0 : 1;
          const lb = b.status === "missing" || b.status === "overdue" ? 0 : 1;
          return la - lb || (a.dueAt ?? "9") .localeCompare(b.dueAt ?? "9");
        }),
    [items],
  );
  const attention = open.filter((i) => i.status === "missing" || i.status === "overdue" || (i.dueAt && daysUntil(i.dueAt, now) <= 1));
  const assessments = open.filter((i) => (i.kind === "test" || i.kind === "quiz") && i.dueAt && daysUntil(i.dueAt, now) >= 0).slice(0, 4);
  const changes = useMemo(() => {
    const list = [
      ...items.flatMap((i) => i.history.map((h) => ({ ...h, title: i.title, id: i.id, courseKey: i.courseKey }))),
      ...grades.flatMap((g) => g.history.map((h) => ({ ...h, title: `${g.courseName} grade`, id: g.id, courseKey: g.courseKey }))),
    ];
    return list.sort((a, b) => (a.at < b.at ? 1 : -1)).slice(0, 6);
  }, [items, grades]);
  const brief = useMemo(() => buildBriefing(items, grades, now, role), [items, grades, now, role]);

  // Mon–Fri of the current week
  const week = useMemo(() => {
    const d = new Date(now.slice(0, 10) + "T12:00:00Z");
    const monday = new Date(d.getTime() - ((d.getUTCDay() + 6) % 7) * 86400000);
    return Array.from({ length: 5 }, (_, i) => new Date(monday.getTime() + i * 86400000).toISOString().slice(0, 10));
  }, [now]);

  if (!items.length) return <NoData />;
  const next = open[0];
  const verifiedCount = items.filter((i) => i.verified).length;

  return (
    <>
      <PageHeader
        eyebrow={`${fmtLongDay(now.slice(0, 10))} · ${SCHOOL.term}`}
        title={parent ? "Ava's week at a glance" : "Good afternoon, Ava"}
        description={`Synced from ${SCHOOL.name} (Blackbaud) · last sync ${syncs[0] ? fmtClock(syncs[0].at) : "—"} · ${items.length + grades.length} records`}
        actions={
          <ButtonLink href="/sync" variant="outline" icon={<RefreshCw className="size-4" />}>
            Sync again
          </ButtonLink>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.55fr_1fr]">
        <section className="dots-dark on-dark relative overflow-hidden rounded-[24px] p-6 text-paper sm:p-8" aria-label="Next up">
          <p className="eyebrow text-muted-display">{parent ? "The one thing to raise tonight" : "Next up"}</p>
          {next ? (
            <>
              <h2 className="mt-3 font-display text-[34px] leading-[1.06] tracking-[-0.03em] sm:text-[40px]">{next.title}</h2>
              <p className="mt-2 text-[15px] text-paper/75">
                {next.courseName} · {KIND_LABEL[next.kind]} · {next.status === "missing" || next.status === "overdue" ? `marked ${next.status}` : dueLabel(next.dueAt, now).toLowerCase()}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button arrow onClick={() => setOpenId(next.id)}>
                  View details
                </Button>
                <ButtonLink href="/dashboard/assignments" variant="ghost-dark">
                  All assignments
                </ButtonLink>
              </div>
              <ul className="mt-7 space-y-2.5">
                {open.slice(1, 5).map((i) => (
                  <li key={i.id}>
                    <button type="button" onClick={() => setOpenId(i.id)} className="flex items-center gap-3 text-left text-[14.5px] text-paper/85 hover:text-paper">
                      <span className="size-5 shrink-0 rounded-full border-[1.5px] border-paper/50" />
                      <span className="truncate">{i.title}</span>
                      <span className="hidden shrink-0 text-[12.5px] text-paper/50 sm:inline">· {dueLabel(i.dueAt, now)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <h2 className="mt-3 font-display text-[36px] tracking-[-0.03em]">All caught up.</h2>
          )}
          <div className="absolute bottom-6 right-6 hidden rotate-[4deg] rounded-[2px] bg-lemon px-4 py-2.5 text-[13.5px] font-medium text-void shadow-[0_10px_20px_-10px_rgba(0,0,0,0.6)] sm:block">
            {brief.stats.dueSoon} due in the next 7 days
          </div>
        </section>

        <Panel>
          <PanelHeader title="This week" description="Work due each school day" />
          <div className="grid grid-cols-5 gap-2">
            {week.map((d) => {
              const due = items.filter((i) => isWork(i) && i.dueAt === d);
              const today = d === now.slice(0, 10);
              return (
                <div key={d} className={cn("rounded-[12px] p-2 text-center", today ? "bg-void text-paper" : "bg-fog")}>
                  <p className={cn("text-[11.5px]", today ? "text-paper/70" : "text-muted")}>{new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "short" }).format(new Date(d + "T12:00:00Z"))}</p>
                  <p className="font-display text-[26px] leading-tight tracking-[-0.03em] tabular">{due.length}</p>
                  <div className="mt-1 flex h-1.5 justify-center gap-0.5">
                    {due.slice(0, 5).map((i) => (
                      <span key={i.id} className="h-1.5 w-1.5 rounded-full" style={{ background: courseColor(i.courseKey) }} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="eyebrow mb-1 mt-5 flex items-center gap-1.5 text-muted">
            <CalendarClock className="size-3.5" /> Tests &amp; quizzes ahead
          </p>
          <div className="-mx-2">
            {assessments.map((i) => (
              <ItemRow key={i.id} item={i} now={now} onOpen={setOpenId} />
            ))}
            {!assessments.length && <p className="px-2 py-2 text-[13.5px] text-muted">None in the next two weeks.</p>}
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel>
          <PanelHeader
            title="Needs attention"
            description={`${attention.length} item${attention.length === 1 ? "" : "s"}`}
            actions={
              <Link href="/dashboard/assignments" className="text-[13.5px] hover:underline">
                Assignments
              </Link>
            }
          />
          <div className="-mx-2">
            {attention.slice(0, 6).map((i) => (
              <ItemRow key={i.id} item={i} now={now} onOpen={setOpenId} />
            ))}
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="What changed" description="Detected by repeat syncs" actions={<History className="size-4 text-muted" />} />
          {changes.length ? (
            <ul className="space-y-3">
              {changes.map((c, i) => (
                <li key={i}>
                  <button type="button" onClick={() => setOpenId(c.id)} className="w-full text-left">
                    <p className="flex items-center gap-2 text-[14px] font-medium">
                      <CourseDot courseKey={c.courseKey} /> <span className="truncate">{c.title}</span>
                    </p>
                    <p className="mt-0.5 pl-[18px] text-[12.5px] text-muted">
                      {FIELD_LABEL[c.field] ?? c.field}: {fmtField(c.field, c.from)} → <span className="font-medium text-void">{fmtField(c.field, c.to)}</span> · {fmtClock(c.at)}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-[12px] bg-fog p-4 text-[13.5px] text-muted">
              Nothing has changed since the first sync. Try <span className="font-medium text-void">Simulate teacher updates</span> in the extension, then sync again.
              <ButtonLink href="/sync" size="sm" variant="outline" className="mt-3">
                Open the extension
              </ButtonLink>
            </div>
          )}
        </Panel>

        <Panel>
          <PanelHeader
            title="Grades"
            description="Cumulative, from Progress"
            actions={
              <Link href="/dashboard/grades" className="text-[13.5px] hover:underline">
                All
              </Link>
            }
          />
          {grades.length ? (
            <ul className="space-y-2.5">
              {grades.map((g) => {
                const last = [...g.history].reverse().find((h) => h.field === "percent");
                const delta = last ? Number(last.to) - Number(last.from) : 0;
                return (
                  <li key={g.id}>
                    <button type="button" onClick={() => setOpenId(g.id)} className="flex w-full items-center gap-3 text-left">
                      <CourseDot courseKey={g.courseKey} />
                      <span className="min-w-0 flex-1 truncate text-[14px]">{g.courseName}</span>
                      {delta !== 0 && (
                        <span className={cn("inline-flex items-center text-[12px] font-medium", delta > 0 ? "text-leaf-ink" : "text-[#9f1239]")}>
                          {delta > 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
                          {Math.abs(delta).toFixed(1)}
                        </span>
                      )}
                      <span className="w-14 text-right text-[14px] font-semibold tabular">{g.percent.toFixed(1)}%</span>
                      <span className="w-7 text-right text-[12.5px] text-muted">{g.letter}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="rounded-[12px] bg-fog p-4 text-[13.5px] text-muted">Sync the Progress page to bring grades in.</p>
          )}
          {grades[0] && (
            <p className="mt-4">
              <SourceBadge item={grades[0]} />
            </p>
          )}
        </Panel>
      </div>

      <section className="mt-4 rounded-[24px] border-[1.5px] border-dashed border-[#d8b4fe] bg-paper p-6 sm:p-8" aria-label="AI briefing preview">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-[#f3e8ff] px-2.5 py-1 text-[12px] font-medium text-[#6b21a8]">
            <Sparkles className="size-3.5" /> AI-generated · based on {verifiedCount} verified school records
          </p>
          <ButtonLink href="/dashboard/insights" variant="dark" size="sm" arrow>
            Open the briefing
          </ButtonLink>
        </div>
        <p className="mt-4 font-display text-[28px] leading-[1.15] tracking-[-0.025em]">{brief.headline}</p>
        <p className="mt-2 max-w-3xl text-[15.5px] leading-relaxed text-ink">{brief.summary}</p>
        {brief.stats.overdue > 0 && (
          <p className="mt-3 inline-flex items-center gap-1.5 text-[13px] text-[#9f1239]">
            <CircleAlert className="size-4" /> {brief.stats.overdue} overdue or missing
          </p>
        )}
      </section>

      <ItemDetail id={openId} onClose={() => setOpenId(null)} />
    </>
  );
}
