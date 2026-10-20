"use client";

import { useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Fingerprint, Globe, ScanSearch, ShieldCheck } from "lucide-react";
import type { ExtractResult } from "@/core/adapters/types";
import { blackbaudAdapter } from "@/core/adapters/blackbaud";
import { PORTAL_PAGES, SCHOOL, type PortalPage } from "@/core/portal/data";
import type { SyncRun } from "@/core/schema";
import { grantConsent, setVersion, syncFromDom, useDemo, useHydrated } from "@/lib/store";
import { sleep } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/display";
import { Segmented } from "@/components/ui/overlay";
import { Crest, PortalView } from "@/components/sync/portal-view";
import { BrowserFrame, scrollWithinFrame } from "@/components/sync/browser-frame";
import { CapturePanel } from "@/components/sync/capture-panel";
import { TEACHER_SITE, TeacherSite } from "@/components/sync/teacher-site";
import { ConsentScreen, DashboardCta, IdleHint, PanelFooter, PanelHeader, SessionChecklist, SyncProgress, SyncResult, TeacherUpdateCard, type SyncPhase } from "@/components/sync/sync-panel";
import { trackMilestone } from "@/components/demo/visit-tracker";

type Tab = "portal" | "capture";

export function SyncView() {
  const params = useSearchParams();
  const router = useRouter();
  const hydrated = useHydrated();
  const tab: Tab = params.get("tab") === "capture" ? "capture" : "portal";
  const [page, setPage] = useState<PortalPage>("assignment-center");
  const [panelOpen, setPanelOpen] = useState(true);
  const portalRef = useRef<HTMLDivElement>(null);
  const teacherRef = useRef<HTMLDivElement>(null);

  const switchTab = (t: Tab) => {
    router.replace(t === "capture" ? "/sync?tab=capture" : "/sync", { scroll: false });
  };

  const count = useDemo((s) => Object.keys(s.items).length);

  return (
    <div className="container-page pt-8 sm:pt-10">
      <header className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="eyebrow text-muted">Interactive · runs the real adapter code against the page</p>
          <h1 className="mt-2 font-display text-[38px] leading-[1.04] tracking-[-0.035em] sm:text-[52px]">Ava&apos;s school portal, with ClassPano Sync.</h1>
          <p className="mt-3 max-w-2xl text-[16px] leading-relaxed text-muted">
            Ava is already signed in to her school&apos;s Blackbaud-style portal. The ClassPano panel is the Chrome extension&apos;s side panel. Press Sync on each page she visits.
          </p>
        </div>
        <Segmented
          label="Site in the browser"
          value={tab}
          onChange={switchTab}
          options={[
            { value: "portal", label: "Blackbaud portal · supported" },
            { value: "capture", label: "Teacher website · AI capture" },
          ]}
          className="no-scrollbar max-w-full self-start overflow-x-auto lg:self-auto"
        />
      </header>

      {tab === "portal" ? (
        <PortalTab page={page} setPage={setPage} panelOpen={panelOpen} setPanelOpen={setPanelOpen} portalRef={portalRef} hydrated={hydrated} count={count} />
      ) : (
        <BrowserFrame
          tabTitle={TEACHER_SITE.title}
          favicon={<span className="size-3.5 rounded-[3px] bg-[#2f6f73]" />}
          host={TEACHER_SITE.host}
          path={TEACHER_SITE.path}
          panelOpen={panelOpen}
          onTogglePanel={() => setPanelOpen((v) => !v)}
          panel={
            <>
              <PanelHeader subtitle="Unsupported site · AI-assisted capture" />
              <CapturePanel key="capture" contentRef={teacherRef} />
              <PanelFooter />
            </>
          }
        >
          <TeacherSite ref={teacherRef} />
        </BrowserFrame>
      )}

      <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {[
          { Icon: ScanSearch, t: "Real parsing, not a slideshow", b: "The adapter runs querySelectorAll over the portal's HTML, the same code the MV3 prototype injects into a tab." },
          { Icon: Fingerprint, t: "Identity + fingerprint", b: "Records are keyed by Blackbaud's own assignment id. A hash of the mutable fields tells unchanged from updated." },
          { Icon: Globe, t: "One format for every platform", b: "Raw page data becomes cp.academic.v1 before it's stored, so the dashboard never knows which platform supplied it." },
          { Icon: ShieldCheck, t: "Nothing leaves this browser", b: "In this demo, synced records live in your browser's storage. Reset or delete them any time." },
        ].map(({ Icon, t, b }) => (
          <div key={t} className="rounded-[20px] bg-paper p-5">
            <Icon className="size-5 text-leaf-ink" aria-hidden />
            <p className="mt-3 text-[15px] font-semibold">{t}</p>
            <p className="mt-1 text-[14px] leading-relaxed text-muted">{b}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PortalTab({
  page,
  setPage,
  panelOpen,
  setPanelOpen,
  portalRef,
  hydrated,
  count,
}: {
  page: PortalPage;
  setPage: (p: PortalPage) => void;
  panelOpen: boolean;
  setPanelOpen: (fn: (v: boolean) => boolean) => void;
  portalRef: React.RefObject<HTMLDivElement | null>;
  hydrated: boolean;
  count: number;
}) {
  const version = useDemo((s) => s.version);
  const consent = useDemo((s) => s.consent);
  const captured = useDemo((s) => s.captured);
  const [declined, setDeclined] = useState(false);
  const [phaseRaw, setPhase] = useState<SyncPhase>("idle");
  // A new page or new portal content starts a fresh sync cycle.
  const cycle = `${page}:${version}`;
  const [phaseCycle, setPhaseCycle] = useState(cycle);
  const phase: SyncPhase = phaseCycle === cycle ? phaseRaw : "idle";
  const [readCount, setReadCount] = useState(0);
  const [run, setRun] = useState<SyncRun | null>(null);
  const [raw, setRaw] = useState<ExtractResult | undefined>();
  const [sample, setSample] = useState<unknown>();
  const [error, setError] = useState("");
  const busy = !["idle", "done", "error"].includes(phase);
  const meta = PORTAL_PAGES.find((p) => p.id === page)!;
  const pageKind = { "assignment-center": "assignments", schedule: "schedule", progress: "progress", "class-biology": "class" }[page];

  const doSync = async () => {
    const root = portalRef.current;
    if (!root || busy) return;
    setError("");
    setReadCount(0);
    setPhaseCycle(cycle);
    setPhase("detect");
    await sleep(500);
    const r = await syncFromDom(root, page, meta.path);
    if (!r.ok) {
      setError(r.message);
      setPhase("error");
      return;
    }
    setPhase("read");
    const nodes = Array.from(root.querySelectorAll("[data-assignment-id], [data-event-id], .wbp-progress-row, .wbp-bulletin"));
    nodes.forEach((n) => n.removeAttribute("data-cp-scan"));
    const step = Math.max(28, Math.min(90, 1300 / Math.max(1, nodes.length)));
    for (let i = 0; i < nodes.length; i++) {
      nodes[i].setAttribute("data-cp-scan", "reading");
      if (i === 0 || i % 3 === 0) scrollWithinFrame(nodes[i]);
      setReadCount(i + 1);
      await sleep(step);
      nodes[i].setAttribute("data-cp-scan", "done");
    }
    setPhase("normalize");
    await sleep(450);
    setPhase("match");
    await sleep(500);
    const ext = r.raw.assignments[0]?.externalId ?? r.raw.announcements[0]?.externalId ?? r.raw.events[0]?.externalId;
    const s = useDemo.getState();
    setSample(ext ? Object.values(s.items).find((i) => i.source.externalId === ext) : Object.values(s.grades).find((g) => g.source.externalId === r.raw.grades[0]?.courseExternalId));
    setRaw(r.raw);
    setRun(r.run);
    setPhase("done");
    trackMilestone(`Synced ${meta.label}${version === "B" ? " after teacher updates" : ""}`);
    if (r.run.counts.updated && version === "B") toast.success(`${r.run.counts.updated} records updated, 0 duplicates. Every change is logged.`);
  };

  return (
    <BrowserFrame
      tabTitle={`${meta.label} - myWestbrook`}
      favicon={<Crest className="size-4" />}
      host={SCHOOL.host}
      path={meta.path}
      badge={count ? String(count) : undefined}
      panelOpen={panelOpen}
      onTogglePanel={() => setPanelOpen((v) => !v)}
      panel={
        <>
          <PanelHeader subtitle={consent ? `${blackbaudAdapter.name} · ${meta.label}` : "Permission needed"} />
          {!hydrated ? (
            <div className="flex-1" />
          ) : !consent ? (
            declined ? (
              <div className="flex-1 p-4">
                <Notice title="ClassPano won't read this site">You can allow it any time. Until then, nothing on this page is read.</Notice>
                <Button variant="outline" className="mt-3 w-full" onClick={() => setDeclined(false)}>
                  Review permission
                </Button>
              </div>
            ) : (
              <ConsentScreen
                onAllow={() => {
                  grantConsent(true);
                  trackMilestone("Allowed the extension on the portal");
                }}
                onDecline={() => setDeclined(true)}
              />
            )
          ) : (
            <>
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
                {phase === "idle" && <IdleHint pageLabel={meta.label} />}
                {busy && <SyncProgress phase={phase} readCount={readCount} adapterLabel={`${blackbaudAdapter.id}@${blackbaudAdapter.version}`} pageKind={pageKind} />}
                {phase === "done" && run && <SyncResult run={run} raw={raw} sample={sample} />}
                {phase === "error" && <Notice tone="amber" title="Nothing captured">{error}</Notice>}
                <SessionChecklist captured={captured} current={page} onGo={setPage} />
                {captured["assignment-center"] && (
                  <TeacherUpdateCard
                    version={version}
                    onUpdate={() => {
                      setVersion("B");
                      trackMilestone("Simulated teacher updates");
                      toast("Teachers updated the portal at 5:35 PM", { description: "A grade posted, a due date moved, work marked missing and a quiz added. Sync again." });
                      setPage("assignment-center");
                    }}
                    onReset={() => setVersion("A")}
                  />
                )}
                {Object.keys(captured).length > 0 && <DashboardCta />}
              </div>
              <div className="border-t border-line p-3">
                <Button onClick={doSync} loading={busy} className="w-full" arrow>
                  {busy ? "Syncing…" : phase === "done" ? "Sync this page again" : "Sync this page"}
                </Button>
              </div>
            </>
          )}
          <PanelFooter />
        </>
      }
    >
      <PortalView ref={portalRef} page={page} version={version} onNavigate={setPage} />
    </BrowserFrame>
  );
}
