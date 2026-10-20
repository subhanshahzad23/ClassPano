"use client";

import { Fragment, useMemo, useState } from "react";
import { ChevronDown, CircleDashed, PlugZap, ShieldCheck, Sparkles } from "lucide-react";
import { ADAPTERS, PLANNED_PLATFORMS } from "@/core/adapters/registry";
import { BB_SELECTORS } from "@/core/adapters/blackbaud";
import { FIELD_LABEL, fmtClock, fmtField, fmtShort } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Badge, PageHeader, Panel, PanelHeader } from "@/components/ui/display";
import { ButtonLink } from "@/components/ui/button";
import { NoData, useDash } from "@/components/dashboard/common";

const PAGE_LABEL: Record<string, string> = { assignments: "Assignment Center", schedule: "Schedule", progress: "Progress", class: "Class page", unknown: "Captured page" };

export default function SourcesPage() {
  const { items, syncs } = useDash();
  const [open, setOpen] = useState<string | null>(null);
  const bySource = useMemo(() => {
    const m = new Map<string, number>();
    items.forEach((i) => m.set(i.source.platform, (m.get(i.source.platform) ?? 0) + 1));
    return m;
  }, [items]);
  if (!items.length && !syncs.length) return <NoData />;
  const bbLast = syncs.find((s) => s.platform === "blackbaud");
  const aiLast = syncs.find((s) => s.method === "ai_capture");

  return (
    <>
      <PageHeader eyebrow="Connections" title="Sources & syncs" description="Where Ava's data comes from, which module read it, and a log of every sync with exactly what it changed." />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Panel>
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-leaf-ink" />
            <p className="text-[16px] font-semibold">Blackbaud Education Management</p>
          </div>
          <p className="mt-1 text-[13.5px] text-muted">Westbrook Academy · platform module</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Badge tone="green">Connected</Badge>
            <Badge>{ADAPTERS[0].id}@{ADAPTERS[0].version}</Badge>
            <Badge>{bySource.get("blackbaud") ?? 0} records</Badge>
          </div>
          <p className="mt-3 text-[13.5px]">Last sync {bbLast ? `${fmtShort(bbLast.at)}, ${fmtClock(bbLast.at)}` : "—"}</p>
          <details className="group mt-3 rounded-[12px] bg-fog p-3 text-[12.5px]">
            <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
              Module health: selectors OK <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
            </summary>
            <ul className="mt-2 space-y-1 font-mono text-[11px] text-ink">
              {Object.entries(BB_SELECTORS)
                .filter(([, v]) => typeof v === "string")
                .slice(0, 8)
                .map(([k, v]) => (
                  <li key={k} className="truncate">
                    <span className="text-muted">{k}:</span> {String(v)}
                  </li>
                ))}
            </ul>
          </details>
        </Panel>
        <Panel>
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-[#6b21a8]" />
            <p className="text-[16px] font-semibold">AI-assisted capture</p>
          </div>
          <p className="mt-1 text-[13.5px] text-muted">Unsupported sites, reviewed before saving</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Badge tone="purple">{aiLast ? "Used" : "Available"}</Badge>
            <Badge>{bySource.get("generic") ?? 0} records</Badge>
          </div>
          <p className="mt-3 text-[13.5px]">{aiLast ? `Last capture ${fmtClock(aiLast.at)} · mrpatel-algebra.classpages.test` : "Try it on Mr. Patel's class website."}</p>
          <ButtonLink href="/sync?tab=capture" size="sm" variant="outline" className="mt-3">
            Capture a page
          </ButtonLink>
        </Panel>
        <Panel>
          <div className="flex items-center gap-2">
            <PlugZap className="size-5" />
            <p className="text-[16px] font-semibold">More platforms</p>
          </div>
          <p className="mt-1 text-[13.5px] text-muted">Same module interface, same output format</p>
          <ul className="mt-3 space-y-2 text-[13.5px]">
            <li className="flex items-center justify-between gap-2">
              Canvas LMS <Badge tone="blue">{ADAPTERS[1].version}</Badge>
            </li>
            {PLANNED_PLATFORMS.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-2">
                <span>
                  {p.name}
                  <span className="block text-[12px] text-muted">{p.note}</span>
                </span>
                <CircleDashed className="size-4 shrink-0 text-muted" />
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel className="mt-4 p-0 sm:p-0">
        <div className="px-5 pt-5 sm:px-6 sm:pt-6">
          <PanelHeader title="Sync log" description="Newest first. Select a row to see field-level changes." />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-[13.5px]">
            <thead>
              <tr className="border-y border-line text-[12px] text-muted">
                <th className="px-5 py-2.5 font-medium">When</th>
                <th className="px-3 py-2.5 font-medium">Source · page</th>
                <th className="px-3 py-2.5 text-right font-medium">New</th>
                <th className="px-3 py-2.5 text-right font-medium">Updated</th>
                <th className="px-3 py-2.5 text-right font-medium">Unchanged</th>
                <th className="px-3 py-2.5 text-right font-medium">Dupes prevented</th>
                <th className="px-5 py-2.5 text-right font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {syncs.map((s) => (
                <Fragment key={s.id}>
                  <tr onClick={() => setOpen(open === s.id ? null : s.id)} className={cn("cursor-pointer border-b border-line/70 hover:bg-[#fafafa]", open === s.id && "bg-[#fafafa]")}>
                    <td className="whitespace-nowrap px-5 py-2.5">
                      <ChevronDown className={cn("mr-1.5 inline size-3.5 text-muted transition-transform", open === s.id && "rotate-180")} />
                      {fmtClock(s.at)}
                    </td>
                    <td className="px-3 py-2.5">
                      {s.method === "ai_capture" ? "AI capture" : s.adapter === "import" ? "Extension import" : "Blackbaud"} · {PAGE_LABEL[s.pageKind] ?? s.pageKind}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular">{s.counts.created}</td>
                    <td className="px-3 py-2.5 text-right tabular">{s.counts.updated}</td>
                    <td className="px-3 py-2.5 text-right tabular">{s.counts.unchanged}</td>
                    <td className="px-3 py-2.5 text-right tabular">{s.counts.duplicatesPrevented}</td>
                    <td className="px-5 py-2.5 text-right tabular text-muted">{s.durationMs} ms</td>
                  </tr>
                  {open === s.id && (
                    <tr className="border-b border-line/70 bg-[#fafafa]">
                      <td colSpan={7} className="px-5 pb-4 pt-1">
                        {s.changes.filter((c) => c.type !== "created").length ? (
                          <ul className="space-y-1 text-[13px]">
                            {s.changes
                              .filter((c) => c.type !== "created")
                              .map((c) => (
                                <li key={c.recordId + c.type}>
                                  <span className="font-medium">{c.title}</span>
                                  {c.type === "merged" ? " · merged from teacher site" : ""}
                                  {c.fields?.map((f) => (
                                    <span key={f.field} className="text-muted">
                                      {" "}
                                      · {FIELD_LABEL[f.field] ?? f.field}: {fmtField(f.field, f.from)} → <span className="text-void">{fmtField(f.field, f.to)}</span>
                                    </span>
                                  ))}
                                </li>
                              ))}
                          </ul>
                        ) : (
                          <p className="text-[13px] text-muted">{s.counts.created ? `${s.counts.created} records created; nothing updated.` : "No changes. Every record matched its stored fingerprint."}</p>
                        )}
                        <p className="mt-2 font-mono text-[11px] text-muted">
                          {s.id} · {s.adapter} · {s.url}
                        </p>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
