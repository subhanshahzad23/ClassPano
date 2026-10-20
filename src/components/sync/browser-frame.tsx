"use client";

import { ArrowLeft, ArrowRight, Lock, Puzzle, RotateCw, X } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

/*
 * A simplified Chrome window: tab strip, toolbar with the ClassPano Sync
 * action icon, the page, and Chrome's side panel on the right (where an MV3
 * extension's sidePanel renders). Stacks vertically below 1024px.
 */
export function BrowserFrame({
  tabTitle,
  favicon,
  host,
  path,
  badge,
  panelOpen,
  onTogglePanel,
  panel,
  children,
}: {
  tabTitle: string;
  favicon: React.ReactNode;
  host: string;
  path: string;
  badge?: string;
  panelOpen: boolean;
  onTogglePanel: () => void;
  panel: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-[16px] bg-paper shadow-panel ring-1 ring-black/5">
      <div className="flex items-end gap-3 bg-[#dee1e6] px-3 pt-2" aria-hidden>
        <div className="mb-2.5 hidden gap-1.5 sm:flex">
          <span className="size-3 rounded-full bg-[#ff5f57]" />
          <span className="size-3 rounded-full bg-[#febc2e]" />
          <span className="size-3 rounded-full bg-[#28c840]" />
        </div>
        <div className="flex h-9 min-w-0 max-w-[280px] flex-1 items-center gap-2 rounded-t-[10px] bg-paper px-3 text-[12.5px]">
          <span className="grid size-4 shrink-0 place-items-center">{favicon}</span>
          <span className="truncate">{tabTitle}</span>
          <X className="ml-auto size-3.5 shrink-0 text-muted" />
        </div>
      </div>
      <div className="flex items-center gap-1.5 border-b border-line bg-paper px-2 py-1.5 sm:gap-2 sm:px-3">
        <span className="hidden items-center gap-1 text-muted sm:flex" aria-hidden>
          <ArrowLeft className="size-4" />
          <ArrowRight className="size-4" />
          <RotateCw className="size-4" />
        </span>
        <div className="flex h-8 min-w-0 flex-1 items-center gap-2 rounded-full bg-fog px-3 text-[12.5px]" aria-label="Address bar">
          <Lock className="size-3.5 shrink-0 text-muted" aria-hidden />
          <span className="truncate">
            <span className="text-void">{host}</span>
            <span className="text-muted">{path}</span>
          </span>
        </div>
        <Puzzle className="hidden size-4 text-muted sm:block" aria-hidden />
        <button
          type="button"
          onClick={onTogglePanel}
          aria-pressed={panelOpen}
          aria-label={panelOpen ? "Close ClassPano Sync side panel" : "Open ClassPano Sync side panel"}
          className={cn("relative grid size-8 place-items-center rounded-full transition-colors hover:bg-fog", panelOpen && "bg-leaf")}
        >
          <LogoMark className="size-5" />
          {badge && <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-jade px-1 text-[9.5px] font-bold text-void">{badge}</span>}
        </button>
      </div>
      <div className="flex flex-col lg:flex-row">
        <div data-browser-content className="relative h-[480px] min-w-0 flex-1 overflow-auto lg:h-[680px]">{children}</div>
        {panelOpen && <aside className="order-first flex max-h-[720px] flex-col border-b border-line bg-paper lg:order-none lg:h-[680px] lg:max-h-none lg:w-[380px] lg:shrink-0 lg:border-b-0 lg:border-l">{panel}</aside>}
      </div>
    </div>
  );
}

/** Scrolls an element into view inside the simulated browser only (never the page). */
export function scrollWithinFrame(el: Element) {
  const c = el.closest("[data-browser-content]") as HTMLElement | null;
  if (!c) return;
  const r = el.getBoundingClientRect();
  const cr = c.getBoundingClientRect();
  if (r.top >= cr.top + 40 && r.bottom <= cr.bottom - 40) return;
  c.scrollTo({ top: c.scrollTop + (r.top - cr.top) - cr.height / 3, behavior: "smooth" });
}
