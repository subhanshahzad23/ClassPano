"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { KIND_LABEL } from "@/core/schema";
import { daysUntil, dueLabel, fmtShort, isOpen, isWork } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/form";
import { PageHeader, Panel } from "@/components/ui/display";
import { Segmented } from "@/components/ui/overlay";
import { CourseDot, ItemDetail, NoData, SourceBadge, StatusPill, useDash } from "@/components/dashboard/common";

type Filter = "upcoming" | "late" | "done" | "all";

export default function AssignmentsPage() {
  const { items, now } = useDash();
  const [filter, setFilter] = useState<Filter>("upcoming");
  const [course, setCourse] = useState<string>("all");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const work = useMemo(() => items.filter(isWork), [items]);
  const courses = useMemo(() => [...new Map(work.map((i) => [i.courseKey, i.courseName])).entries()].sort((a, b) => a[1].localeCompare(b[1])), [work]);
  const list = useMemo(() => {
    let l = work;
    if (filter === "upcoming") l = l.filter((i) => isOpen(i) && i.status !== "missing" && i.status !== "overdue" && (!i.dueAt || daysUntil(i.dueAt, now) >= 0));
    if (filter === "late") l = l.filter((i) => i.status === "missing" || i.status === "overdue");
    if (filter === "done") l = l.filter((i) => i.status === "submitted" || i.status === "graded");
    if (course !== "all") l = l.filter((i) => i.courseKey === course);
    if (q.trim()) l = l.filter((i) => `${i.title} ${i.courseName} ${i.details ?? ""}`.toLowerCase().includes(q.toLowerCase()));
    return [...l].sort((a, b) => (a.dueAt ?? "9").localeCompare(b.dueAt ?? "9"));
  }, [work, filter, course, q, now]);

  if (!items.length) return <NoData />;
  const lateCount = work.filter((i) => i.status === "missing" || i.status === "overdue").length;

  return (
    <>
      <PageHeader eyebrow="All classes" title="Assignments" description="Every assignment ClassPano has synced, from Blackbaud and from pages you captured with AI. Select one for details, sources and change history." />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <Segmented
          label="Filter"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "upcoming", label: "Upcoming" },
            { value: "late", label: `Overdue & missing${lateCount ? ` (${lateCount})` : ""}` },
            { value: "done", label: "Done" },
            { value: "all", label: "All" },
          ]}
          className="no-scrollbar max-w-full overflow-x-auto"
        />
        <div className="relative lg:ml-auto lg:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search assignments" className="pl-9" aria-label="Search assignments" />
        </div>
      </div>
      <div className="no-scrollbar mb-4 flex gap-1.5 overflow-x-auto">
        {[["all", "All classes"] as const, ...courses].map(([k, n]) => (
          <button
            key={k}
            type="button"
            onClick={() => setCourse(k)}
            className={cn("inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[13px] transition-colors", course === k ? "bg-void text-paper" : "bg-paper text-ink hover:bg-ash")}
          >
            {k !== "all" && <CourseDot courseKey={k} />}
            {n}
          </button>
        ))}
      </div>

      <Panel className="p-0 sm:p-0">
        {/* Table on md+, cards on mobile */}
        <div className="hidden md:block">
          <table className="w-full text-left text-[14px]">
            <thead>
              <tr className="border-b border-line text-[12.5px] text-muted">
                <th className="px-5 py-3 font-medium">Assignment</th>
                <th className="px-3 py-3 font-medium">Type</th>
                <th className="px-3 py-3 font-medium">Due</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Source</th>
              </tr>
            </thead>
            <tbody>
              {list.map((i) => (
                <tr key={i.id} onClick={() => setOpenId(i.id)} className="cursor-pointer border-b border-line/70 last:border-0 hover:bg-[#fafafa]">
                  <td className="px-5 py-3">
                    <button type="button" className="flex items-start gap-2.5 text-left" onClick={() => setOpenId(i.id)}>
                      <CourseDot courseKey={i.courseKey} className="mt-1.5" />
                      <span>
                        <span className="block font-medium">{i.title}</span>
                        <span className="block text-[12.5px] text-muted">
                          {i.courseName}
                          {i.history.length ? ` · changed ${i.history.length}×` : ""}
                          {i.notes?.length ? " · also on teacher site" : ""}
                        </span>
                      </span>
                    </button>
                  </td>
                  <td className="px-3 py-3 text-ink">{KIND_LABEL[i.kind]}</td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <span className="block">{fmtShort(i.dueAt)}</span>
                    <span className="block text-[12px] text-muted">{dueLabel(i.dueAt, now)}</span>
                  </td>
                  <td className="px-3 py-3">
                    <StatusPill status={i.status} score={i.score} points={i.pointsPossible} />
                  </td>
                  <td className="px-5 py-3">
                    <SourceBadge item={i} compact />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="divide-y divide-line md:hidden">
          {list.map((i) => (
            <li key={i.id}>
              <button type="button" onClick={() => setOpenId(i.id)} className="w-full px-4 py-3 text-left">
                <p className="flex items-center gap-2 text-[15px] font-medium">
                  <CourseDot courseKey={i.courseKey} /> {i.title}
                </p>
                <p className="mt-0.5 pl-[18px] text-[12.5px] text-muted">
                  {i.courseName} · {KIND_LABEL[i.kind]} · {dueLabel(i.dueAt, now)}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2 pl-[18px]">
                  <StatusPill status={i.status} score={i.score} points={i.pointsPossible} />
                  <SourceBadge item={i} compact />
                </div>
              </button>
            </li>
          ))}
        </ul>
        {!list.length && <p className="px-5 py-10 text-center text-[14px] text-muted">Nothing matches these filters.</p>}
      </Panel>

      <ItemDetail id={openId} onClose={() => setOpenId(null)} />
    </>
  );
}
