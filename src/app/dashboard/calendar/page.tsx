"use client";

import { useMemo, useState } from "react";
import { KIND_LABEL } from "@/core/schema";
import { courseColor } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/display";
import { ItemDetail, NoData, useDash } from "@/components/dashboard/common";

const wd = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "short" });
const md = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "short", day: "numeric" });

export default function CalendarPage() {
  const { items, now } = useDash();
  const [openId, setOpenId] = useState<string | null>(null);
  const days = useMemo(() => {
    const d = new Date(now.slice(0, 10) + "T12:00:00Z");
    const monday = new Date(d.getTime() - ((d.getUTCDay() + 6) % 7) * 86400000);
    const out: string[] = [];
    for (let i = 0; i < 12; i++) {
      const x = new Date(monday.getTime() + i * 86400000);
      if (x.getUTCDay() !== 0 && x.getUTCDay() !== 6) out.push(x.toISOString().slice(0, 10));
    }
    return out;
  }, [now]);
  if (!items.length) return <NoData />;

  return (
    <>
      <PageHeader eyebrow="Two weeks" title="Calendar" description="Due dates, tests and school events from every source in one grid. Tests and quizzes are outlined so they stand out." />
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-5">
        {days.map((d) => {
          const list = items.filter((i) => i.dueAt === d && i.kind !== "announcement").sort((a, b) => (a.kind === "event" ? -1 : b.kind === "event" ? 1 : 0));
          const today = d === now.slice(0, 10);
          return (
            <div key={d} className={cn("min-h-[150px] rounded-[16px] bg-paper p-3", today && "ring-2 ring-void")}>
              <p className="flex items-baseline justify-between">
                <span className="text-[12.5px] text-muted">{wd.format(new Date(d + "T12:00:00Z"))}</span>
                <span className={cn("font-display text-[22px] tracking-[-0.03em]", today && "rounded-full bg-void px-2 text-paper")}>{md.format(new Date(d + "T12:00:00Z"))}</span>
              </p>
              <ul className="mt-2 space-y-1.5">
                {list.map((i) => {
                  const assess = i.kind === "test" || i.kind === "quiz";
                  return (
                    <li key={i.id}>
                      <button
                        type="button"
                        onClick={() => setOpenId(i.id)}
                        className={cn("w-full rounded-[8px] px-2 py-1.5 text-left text-[12.5px] leading-snug transition-colors hover:brightness-95", i.kind === "event" ? "bg-fog text-muted" : "", assess && "ring-[1.5px] ring-void")}
                        style={i.kind !== "event" ? { background: `${courseColor(i.courseKey)}26` } : undefined}
                      >
                        <span className="block text-[10.5px] font-medium uppercase tracking-[0.06em] text-muted">
                          {i.kind === "event" ? "School event" : `${KIND_LABEL[i.kind]} · ${i.courseName}`}
                        </span>
                        <span className={cn("block font-medium text-void", (i.status === "submitted" || i.status === "graded") && "line-through decoration-black/30")}>{i.title}</span>
                        {!i.verified && <span className="block text-[10.5px] text-[#6b21a8]">AI-extracted</span>}
                      </button>
                    </li>
                  );
                })}
                {!list.length && <li className="px-1 text-[12.5px] text-muted">Nothing due</li>}
              </ul>
            </div>
          );
        })}
      </div>
      <ItemDetail id={openId} onClose={() => setOpenId(null)} />
    </>
  );
}
