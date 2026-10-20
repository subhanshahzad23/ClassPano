"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useDemo } from "@/lib/store";

/*
 * Sends the owner an email when someone opens the demo (once per session) and
 * a short summary when the tab is hidden. Owners opt out on their own browser
 * by opening any page with ?notrack=1 (and back in with ?notrack=0).
 */

const ENABLED = process.env.NEXT_PUBLIC_TRACKING_ENABLED !== "false";
const KEY = { off: "cp_notrack", vid: "cp_vid", visits: "cp_visits", sid: "cp_sid", sent: "cp_visit_sent", pages: "cp_pages", miles: "cp_milestones", start: "cp_start", summaries: "cp_summaries" };

const safe = <T,>(fn: () => T, fallback: T): T => {
  try {
    return fn();
  } catch {
    return fallback;
  }
};
const rid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

/** Record a notable action for the session summary ("Ran first sync"). */
export function trackMilestone(label: string) {
  safe(() => {
    const list: string[] = JSON.parse(sessionStorage.getItem(KEY.miles) ?? "[]");
    if (!list.includes(label)) sessionStorage.setItem(KEY.miles, JSON.stringify([...list, label].slice(-30)));
  }, undefined);
}

function post(body: object, beacon = false) {
  const data = JSON.stringify(body);
  if (beacon && navigator.sendBeacon) {
    navigator.sendBeacon("/api/track", new Blob([data], { type: "application/json" }));
    return;
  }
  void fetch("/api/track", { method: "POST", body: data, headers: { "content-type": "application/json" }, keepalive: true }).catch(() => {});
}

export function VisitTracker() {
  const pathname = usePathname();
  const lastPath = useRef<{ path: string; at: number } | null>(null);

  // Opt-out handling and the one-per-session visit email.
  useEffect(() => {
    if (!ENABLED) return;
    const params = new URLSearchParams(location.search);
    if (params.get("notrack") === "1") safe(() => localStorage.setItem(KEY.off, "1"), undefined);
    if (params.get("notrack") === "0") safe(() => localStorage.removeItem(KEY.off), undefined);
    if (safe(() => localStorage.getItem(KEY.off) === "1", false)) return;

    const vid = safe(() => localStorage.getItem(KEY.vid), null) ?? rid();
    safe(() => localStorage.setItem(KEY.vid, vid), undefined);
    let sid = safe(() => sessionStorage.getItem(KEY.sid), null);
    if (!sid) {
      sid = rid();
      safe(() => {
        sessionStorage.setItem(KEY.sid, sid!);
        sessionStorage.setItem(KEY.start, String(Date.now()));
        localStorage.setItem(KEY.visits, String(Number(localStorage.getItem(KEY.visits) ?? "0") + 1));
      }, undefined);
    }
    if (safe(() => sessionStorage.getItem(KEY.sent), null)) return;
    safe(() => sessionStorage.setItem(KEY.sent, "1"), undefined);

    const utm: Record<string, string> = {};
    params.forEach((v, k) => k.startsWith("utm_") && (utm[k] = v));
    post({
      event: "visit",
      sid,
      vid,
      visitNumber: safe(() => Number(localStorage.getItem(KEY.visits) ?? "1"), 1),
      path: location.pathname + location.hash,
      referrer: document.referrer,
      utm,
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
      lang: navigator.language,
      screen: `${screen.width}×${screen.height}`,
    });
  }, []);

  // Page-time log for the summary.
  useEffect(() => {
    if (!ENABLED || safe(() => localStorage.getItem(KEY.off) === "1", true)) return;
    const now = Date.now();
    const prev = lastPath.current;
    safe(() => {
      const pages: { path: string; seconds: number }[] = JSON.parse(sessionStorage.getItem(KEY.pages) ?? "[]");
      if (prev) {
        const hit = pages.find((p) => p.path === prev.path);
        if (hit) hit.seconds += (now - prev.at) / 1000;
      }
      if (!pages.some((p) => p.path === pathname)) pages.push({ path: pathname, seconds: 0 });
      sessionStorage.setItem(KEY.pages, JSON.stringify(pages.slice(0, 60)));
    }, undefined);
    lastPath.current = { path: pathname, at: now };
  }, [pathname]);

  // Summary when the visitor leaves or switches away (max 3 per session, only if something new happened).
  useEffect(() => {
    if (!ENABLED) return;
    const send = () => {
      if (safe(() => localStorage.getItem(KEY.off) === "1", true)) return;
      safe(() => {
        const start = Number(sessionStorage.getItem(KEY.start) ?? Date.now());
        const seconds = (Date.now() - start) / 1000;
        if (seconds < 20) return;
        const pages: { path: string; seconds: number }[] = JSON.parse(sessionStorage.getItem(KEY.pages) ?? "[]");
        const cur = lastPath.current;
        if (cur) {
          const hit = pages.find((p) => p.path === cur.path);
          if (hit) hit.seconds += (Date.now() - cur.at) / 1000;
          lastPath.current = { path: cur.path, at: Date.now() };
          sessionStorage.setItem(KEY.pages, JSON.stringify(pages));
        }
        const milestones: string[] = JSON.parse(sessionStorage.getItem(KEY.miles) ?? "[]");
        const sig = `${pages.length}:${milestones.length}`;
        const sent: string[] = JSON.parse(sessionStorage.getItem(KEY.summaries) ?? "[]");
        if (sent.length >= 3 || sent.includes(sig)) return;
        sessionStorage.setItem(KEY.summaries, JSON.stringify([...sent, sig]));
        post(
          {
            event: "summary",
            sid: sessionStorage.getItem(KEY.sid),
            vid: localStorage.getItem(KEY.vid) ?? "",
            visitNumber: Number(localStorage.getItem(KEY.visits) ?? "1"),
            seconds,
            pages: pages.map((p) => ({ ...p, seconds: Math.round(p.seconds) })),
            milestones,
            walkthroughStep: useDemo.getState().walkthrough.step,
            tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
          true,
        );
      }, undefined);
    };
    const onVis = () => document.visibilityState === "hidden" && send();
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pagehide", send);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pagehide", send);
    };
  }, []);

  return null;
}
