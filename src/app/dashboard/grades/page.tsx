"use client";

import { useState } from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { courseColor, isOpen } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/display";
import { ItemDetail, NoData, SourceBadge, useDash } from "@/components/dashboard/common";

export default function GradesPage() {
  const { items, grades } = useDash();
  const [openId, setOpenId] = useState<string | null>(null);
  if (!items.length && !grades.length) return <NoData />;

  return (
    <>
      <PageHeader eyebrow="Fall 2026 · Quarter 1" title="Grades" description="Cumulative grades read from the Progress page. Each repeat sync compares them with the last one, so changes show up here with the reason when ClassPano can find it." />
      {!grades.length ? (
        <div className="rounded-[20px] bg-paper p-8 text-center">
          <p className="text-[16px] font-semibold">No grades yet</p>
          <p className="mt-1 text-[14px] text-muted">Open Progress in the portal and press Sync.</p>
          <ButtonLink href="/sync" className="mt-4" arrow>
            Open the portal
          </ButtonLink>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {grades.map((g) => {
            const pts = [...g.history.filter((h) => h.field === "percent").map((h) => Number(h.from)), g.percent];
            const delta = pts.length > 1 ? pts[pts.length - 1] - pts[pts.length - 2] : 0;
            const open = items.filter((i) => i.courseKey === g.courseKey && isOpen(i));
            const missing = open.filter((i) => i.status === "missing" || i.status === "overdue");
            return (
              <button key={g.id} type="button" onClick={() => setOpenId(g.id)} className="rounded-[20px] bg-paper p-5 text-left transition-colors hover:bg-[#fafafa]">
                <div className="flex items-center gap-2">
                  <span className="size-3 rounded-[3px]" style={{ background: courseColor(g.courseKey) }} />
                  <p className="text-[15px] font-semibold">{g.courseName}</p>
                  <span className="ml-auto rounded-full bg-fog px-2 py-0.5 text-[12px] font-semibold">{g.letter}</span>
                </div>
                <p className="mt-1 text-[12.5px] text-muted">{g.teacher}</p>
                <div className="mt-4 flex items-end justify-between">
                  <p className="font-display text-[48px] leading-none tracking-[-0.04em] tabular">
                    {g.percent.toFixed(1)}
                    <span className="text-[22px] text-muted">%</span>
                  </p>
                  <span className={cn("inline-flex items-center gap-0.5 rounded-full px-2 py-1 text-[12.5px] font-medium", delta > 0 ? "bg-leaf text-leaf-ink" : delta < 0 ? "bg-[#ffe4e6] text-[#9f1239]" : "bg-fog text-muted")}>
                    {delta > 0 ? <ArrowUpRight className="size-3.5" /> : delta < 0 ? <ArrowDownRight className="size-3.5" /> : <Minus className="size-3.5" />}
                    {delta === 0 ? "No change" : `${Math.abs(delta).toFixed(1)} pts`}
                  </span>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-ash">
                  <div className="h-full rounded-full" style={{ width: `${g.percent}%`, background: courseColor(g.courseKey) }} />
                </div>
                <p className="mt-3 text-[13px] text-muted">
                  {open.length} open item{open.length === 1 ? "" : "s"}
                  {missing.length ? <span className="font-medium text-[#9f1239]"> · {missing.length} missing</span> : ""}
                </p>
                <p className="mt-2">
                  <SourceBadge item={g} />
                </p>
              </button>
            );
          })}
        </div>
      )}
      <ItemDetail id={openId} onClose={() => setOpenId(null)} />
    </>
  );
}
