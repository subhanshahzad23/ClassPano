"use client";

import { forwardRef, useMemo } from "react";
import { Bell, ChevronDown, Search } from "lucide-react";
import { PORTAL_PAGES, SCHOOL, type PortalPage, type PortalVersion } from "@/core/portal/data";
import { renderPortalPage } from "@/core/portal/render";
import { cn } from "@/lib/utils";

/** Westbrook Academy crest — a generic shield, not any vendor's branding. */
export function Crest({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-6", className)} aria-hidden>
      <path d="M12 2 L20 5 V11 C20 16.5 16.5 20.5 12 22 C7.5 20.5 4 16.5 4 11 V5 Z" fill="#b5302a" />
      <path d="M12 6 L16 7.5 V11 C16 14 14.4 16.4 12 17.5 C9.6 16.4 8 14 8 11 V7.5 Z" fill="#fff" opacity="0.9" />
      <path d="M10 10.5 h4 M12 8.5 v6" stroke="#1d3557" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/**
 * The simulated student portal. The page body is plain HTML from
 * renderPortalPage(); the ClassPano adapter reads it through the forwarded ref
 * exactly as a content script reads a real page.
 */
export const PortalView = forwardRef<HTMLDivElement, { page: PortalPage; version: PortalVersion; onNavigate: (p: PortalPage) => void }>(function PortalView({ page, version, onNavigate }, ref) {
  const html = useMemo(() => renderPortalPage(page, version), [page, version]);
  return (
    <div className="wbp min-h-full" data-portal-shell="education-management">
      <div className="flex h-12 items-center gap-3 bg-[#1d3557] px-4 text-white">
        <Crest />
        <span className="text-[15px] font-semibold tracking-[-0.01em]">myWestbrook</span>
        <span className="hidden text-[12px] text-white/60 md:inline">{SCHOOL.name} · Student</span>
        <span className="ml-auto flex items-center gap-3 text-white/80">
          <Search className="hidden size-4 sm:block" aria-hidden />
          <Bell className="size-4" aria-hidden />
          <span className="flex items-center gap-1.5 text-[12.5px]">
            <span className="grid size-6 place-items-center rounded-full bg-white/15 text-[10px] font-semibold">AT</span>
            <span className="hidden sm:inline">{SCHOOL.student}</span>
            <ChevronDown className="size-3.5" aria-hidden />
          </span>
        </span>
      </div>
      <nav className="no-scrollbar flex gap-1 overflow-x-auto border-b border-[#d8dde3] bg-white px-2" aria-label="Portal pages">
        {PORTAL_PAGES.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onNavigate(p.id)}
            aria-current={p.id === page ? "page" : undefined}
            className={cn(
              "shrink-0 border-b-2 px-3 py-2.5 text-[13px] transition-colors",
              p.id === page ? "border-[#b5302a] font-semibold text-[#1d3557]" : "border-transparent text-[#3b4a5a] hover:text-[#1d3557]",
            )}
          >
            {p.label}
          </button>
        ))}
      </nav>
      <div ref={ref} dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
});
