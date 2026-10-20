"use client";

import { useMemo, useState } from "react";
import { CircleAlert, Clock, LineChart, ListChecks, ShieldCheck, Sparkles, Trophy } from "lucide-react";
import { buildBriefing, type Insight } from "@/core/insights";
import { setRole } from "@/lib/store";
import { fmtDay } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PageHeader, Panel, PanelHeader } from "@/components/ui/display";
import { Accordion, Segmented } from "@/components/ui/overlay";
import { ItemDetail, NoData, useDash } from "@/components/dashboard/common";

const TONE: Record<Insight["tone"], { Icon: typeof Clock; cls: string; label: string }> = {
  urgent: { Icon: CircleAlert, cls: "bg-[#ffe4e6] text-[#9f1239]", label: "Act now" },
  trend: { Icon: LineChart, cls: "bg-[#fff1cc] text-[#7a4b00]", label: "Trend" },
  plan: { Icon: ListChecks, cls: "bg-[#e3edff] text-[#1e40af]", label: "Plan ahead" },
  win: { Icon: Trophy, cls: "bg-leaf text-leaf-ink", label: "Going well" },
};

export default function InsightsPage() {
  const { items, grades, now, role } = useDash();
  const [openId, setOpenId] = useState<string | null>(null);
  const brief = useMemo(() => buildBriefing(items, grades, now, role), [items, grades, now, role]);
  if (!items.length) return <NoData />;
  const verified = items.filter((i) => i.verified).length + grades.length;

  return (
    <>
      <PageHeader
        eyebrow="AI academic briefing"
        title={role === "parent" ? "For Laura: Ava's briefing" : "Your briefing, Ava"}
        description="Written from verified school records only. Every suggestion names the records it used, and none of it ever overwrites school data."
        actions={
          <Segmented
            label="Audience"
            value={role}
            onChange={setRole}
            options={[
              { value: "student", label: "Student voice" },
              { value: "parent", label: "Parent voice" },
            ]}
          />
        }
      />

      <section className="rounded-[24px] border-[1.5px] border-dashed border-[#d8b4fe] bg-paper p-6 sm:p-8" aria-label="Summary">
        <p className="inline-flex items-center gap-1.5 rounded-full bg-[#f3e8ff] px-2.5 py-1 text-[12px] font-medium text-[#6b21a8]">
          <Sparkles className="size-3.5" /> AI-generated suggestion · {verified} verified records in, 0 raw pages
        </p>
        <h2 className="mt-4 font-display text-[34px] leading-[1.08] tracking-[-0.03em] sm:text-[40px]">{brief.headline}</h2>
        <p className="mt-3 max-w-3xl text-[16.5px] leading-relaxed text-ink">{brief.summary}</p>
        <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            ["Open items", brief.stats.open],
            ["Due in 7 days", brief.stats.dueSoon],
            ["Overdue / missing", brief.stats.overdue],
            ["Tests & quizzes (10 days)", brief.stats.assessments],
          ].map(([l, v]) => (
            <div key={l} className="rounded-[14px] bg-fog p-3">
              <p className="text-[12.5px] text-muted">{l}</p>
              <p className="font-display text-[32px] leading-none tracking-[-0.04em] tabular">{v}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <Panel>
          <PanelHeader title="Recommendations" description="Prioritized, with the school records each one is based on" />
          <ul className="space-y-3">
            {brief.insights.map((ins) => {
              const t = TONE[ins.tone];
              return (
                <li key={ins.id} className="rounded-[16px] bg-fog p-4">
                  <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-medium", t.cls)}>
                    <t.Icon className="size-3.5" /> {t.label}
                  </span>
                  <p className="mt-2 text-[16px] font-semibold leading-snug">{ins.title}</p>
                  <p className="mt-1 text-[14.5px] leading-relaxed text-ink">{ins.body}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <span className="text-[12px] text-muted">Based on</span>
                    {ins.basedOn.map((b) => (
                      <button key={b.id} type="button" onClick={() => setOpenId(b.id)} className="inline-flex items-center gap-1 rounded-full bg-paper px-2 py-0.5 text-[12px] text-leaf-ink ring-1 ring-line hover:ring-void">
                        <ShieldCheck className="size-3" /> {b.label}
                      </button>
                    ))}
                  </div>
                </li>
              );
            })}
            {!brief.insights.length && <li className="text-[14px] text-muted">Nothing needs attention right now.</li>}
          </ul>
        </Panel>

        <Panel>
          <PanelHeader title="Suggested plan, next 3 school days" description="Overdue work first, then the evening before each due date" />
          <ol className="space-y-4">
            {brief.plan.map((p) => {
              const total = p.blocks.reduce((m, b) => m + b.minutes, 0);
              return (
                <li key={p.date}>
                  <p className="flex items-baseline justify-between">
                    <span className="text-[14.5px] font-semibold">{fmtDay(p.date)}</span>
                    <span className="text-[12.5px] text-muted tabular">{total} min</span>
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {p.blocks.map((b) => (
                      <li key={b.itemId}>
                        <button type="button" onClick={() => setOpenId(b.itemId)} className="flex w-full items-center gap-3 rounded-[10px] bg-fog px-3 py-2 text-left hover:bg-ash">
                          <span className="w-12 shrink-0 text-[12.5px] font-medium tabular text-muted">{b.minutes}m</span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13.5px] font-medium">{b.title}</span>
                            <span className="block text-[12px] text-muted">
                              {b.course} · {b.reason}
                            </span>
                          </span>
                        </button>
                      </li>
                    ))}
                    {!p.blocks.length && <li className="text-[13px] text-muted">Free evening.</li>}
                  </ul>
                </li>
              );
            })}
          </ol>
        </Panel>
      </div>

      <Panel className="mt-4">
        <PanelHeader title="How this briefing is made" />
        <Accordion
          items={[
            {
              value: "input",
              title: "What goes in",
              content: (
                <p>
                  Only normalized, verified records: assignments, statuses, due dates and grade changes, plus AI-captured items the student confirmed (marked as such). No raw page HTML, no names of classmates, no school credentials.
                </p>
              ),
            },
            {
              value: "model",
              title: "In production vs. this demo",
              content: (
                <p>
                  Production sends that structured input to an LLM through a ClassPano server endpoint (keys never ship in the extension), on zero-retention terms, and requires every claim to cite record ids. Responses are checked against the ids before display. This demo builds the same structure with deterministic rules, so it works offline and never invents facts.
                </p>
              ),
            },
            {
              value: "safety",
              title: "Guardrails for minors",
              content: (
                <p>
                  Supportive, non-judgmental tone. No diagnosis or labels about ability. Parent and student versions are written separately, and a parent sees the student version too. School data always outranks AI output, and “AI-generated” labels are never removed.
                </p>
              ),
            },
          ]}
        />
      </Panel>

      <ItemDetail id={openId} onClose={() => setOpenId(null)} />
    </>
  );
}
