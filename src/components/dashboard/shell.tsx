"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { ArrowLeft, BookOpenCheck, CalendarDays, ChevronRight, Database, GraduationCap, LayoutGrid, Menu as MenuIcon, PlugZap, RefreshCw, Sparkles, X } from "lucide-react";
import { SCHOOL } from "@/core/portal/data";
import { setRole, useDemo, useHydrated } from "@/lib/store";
import { fmtClock, isOpen } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/logo";
import { Avatar, Skeleton } from "@/components/ui/display";
import { Segmented, Sheet } from "@/components/ui/overlay";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutGrid;
  badge?: number;
}

function useNav(): NavItem[] {
  const items = useDemo((s) => s.items);
  const open = useMemo(() => Object.values(items).filter(isOpen).length, [items]);
  return [
    { href: "/dashboard", label: "Overview", icon: LayoutGrid },
    { href: "/dashboard/assignments", label: "Assignments", icon: BookOpenCheck, badge: open || undefined },
    { href: "/dashboard/grades", label: "Grades", icon: GraduationCap },
    { href: "/dashboard/calendar", label: "Calendar", icon: CalendarDays },
    { href: "/dashboard/insights", label: "AI briefing", icon: Sparkles },
    { href: "/dashboard/sources", label: "Sources & syncs", icon: PlugZap },
    { href: "/dashboard/data", label: "Your data", icon: Database },
  ];
}

const isActive = (pathname: string, href: string) => (href === "/dashboard" ? pathname === href : pathname === href || pathname.startsWith(href + "/"));

function SidebarNav({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Dashboard" className="flex flex-col gap-0.5">
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn("group relative flex h-10 items-center gap-3 rounded-[10px] px-3 text-[14.5px] transition-colors", active ? "bg-fog font-medium text-void" : "text-[#3d3d3d] hover:bg-fog/70 hover:text-void")}
          >
            {active && <motion.span layoutId="nav-active" className="absolute left-0 top-2 h-6 w-[3px] rounded-full bg-jade" transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }} />}
            <Icon className="size-[18px] shrink-0" strokeWidth={1.75} aria-hidden />
            <span className="flex-1 truncate">{item.label}</span>
            {item.badge ? <span className="grid h-5 min-w-5 place-items-center rounded-full bg-void px-1.5 text-[11px] font-semibold text-paper tabular">{item.badge}</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}

function ShellSkeleton() {
  return (
    <div className="flex min-h-dvh bg-fog" aria-busy="true" aria-label="Loading the dashboard">
      <div className="hidden w-[248px] shrink-0 flex-col gap-3 bg-paper p-5 lg:flex">
        <Skeleton className="h-8 w-40" />
        <div className="mt-6 space-y-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      </div>
      <div className="flex-1 p-6 lg:p-10">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-4 h-10 w-72" />
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    </div>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const hydrated = useHydrated();
  const pathname = usePathname();
  const items = useNav();
  const role = useDemo((s) => s.role);
  const lastSync = useDemo((s) => s.syncs[0]?.at);
  const [mobileOpen, setMobileOpen] = useState(false);
  const section = items.find((i) => isActive(pathname, i.href));

  if (!hydrated) return <ShellSkeleton />;

  const sidebar = (onNavigate?: () => void) => (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center px-5">
        <Link href="/dashboard" onClick={onNavigate} aria-label="ClassPano dashboard home">
          <Logo suffix={null} />
        </Link>
      </div>
      <div className="px-5 pb-3">
        <p className="eyebrow text-muted">{role === "parent" ? "Parent view" : "Student dashboard"}</p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3">
        <SidebarNav items={items} onNavigate={onNavigate} />
        <div className="mx-1 mt-6 rounded-[14px] bg-fog p-3">
          <p className="text-[12.5px] font-medium">{SCHOOL.name}</p>
          <p className="text-[12px] text-muted">Blackbaud · {lastSync ? `synced ${fmtClock(lastSync)}` : "not synced yet"}</p>
          <Link href="/sync" onClick={onNavigate} className="mt-2 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-leaf-ink hover:underline">
            <RefreshCw className="size-3.5" /> Sync from the portal
          </Link>
        </div>
      </div>
      <div className="border-t border-line p-4">
        <Link href="/" className="flex items-center gap-2 rounded-[8px] px-2 py-2 text-[13.5px] text-muted hover:bg-fog hover:text-void">
          <ArrowLeft className="size-4" aria-hidden /> Back to the pitch
        </Link>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-dvh bg-fog">
      <aside className="hidden w-[248px] shrink-0 border-r border-line bg-paper lg:block">
        <div className="sticky top-0 h-dvh">{sidebar()}</div>
      </aside>
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen} title="Navigation">
        <button type="button" onClick={() => setMobileOpen(false)} className="absolute right-3 top-3 grid size-10 place-items-center rounded-[8px] hover:bg-fog" aria-label="Close navigation">
          <X className="size-5" />
        </button>
        {sidebar(() => setMobileOpen(false))}
      </Sheet>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-line/70 bg-fog/90 backdrop-blur supports-[backdrop-filter]:bg-fog/75">
          <div className="flex h-16 items-center gap-2 px-3 sm:px-6">
            <button type="button" onClick={() => setMobileOpen(true)} className="grid size-10 place-items-center rounded-[10px] hover:bg-paper lg:hidden" aria-label="Open navigation">
              <MenuIcon className="size-5" />
            </button>
            <Link href="/dashboard" className="lg:hidden" aria-label="Dashboard home">
              <Logo compact />
            </Link>
            <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1.5 text-[14px] text-muted md:flex">
              <span className="shrink-0">{role === "parent" ? "Parent view" : "Student dashboard"}</span>
              {section && (
                <>
                  <ChevronRight className="size-3.5 shrink-0" aria-hidden />
                  <span className="font-medium text-void" aria-current="page">
                    {section.label}
                  </span>
                </>
              )}
            </nav>
            <div className="flex-1" />
            <Segmented
              label="View as"
              value={role}
              onChange={setRole}
              options={[
                { value: "student", label: "Student" },
                { value: "parent", label: "Parent" },
              ]}
            />
            <span className="ml-1 flex items-center gap-2">
              <Avatar name={role === "parent" ? SCHOOL.parent : SCHOOL.student} hue={role === "parent" ? 210 : 280} size={32} />
              <span className="hidden text-left leading-tight xl:block">
                <span className="block text-[13.5px] font-medium">{role === "parent" ? SCHOOL.parent : SCHOOL.student}</span>
                <span className="block text-[12px] text-muted">{role === "parent" ? "Parent of Ava" : `${SCHOOL.grade} · ${SCHOOL.name}`}</span>
              </span>
            </span>
          </div>
        </header>
        <motion.main
          id="main"
          key={pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
          className="mx-auto w-full max-w-[1240px] flex-1 px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pt-10"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
