"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { PORTAL_PAGES, type PortalPage } from "@/core/portal/data";
import { PortalView } from "@/components/sync/portal-view";

/*
 * The simulated portal as a real, standalone page. Load the MV3 prototype,
 * open this page and click the extension: the Blackbaud module recognizes it
 * by its DOM signature. Add ?v=B to see the "after teacher updates" content.
 */
function Standalone() {
  const { page } = useParams<{ page: string }>();
  const params = useSearchParams();
  const router = useRouter();
  const current = (PORTAL_PAGES.find((p) => p.id === page)?.id ?? "assignment-center") as PortalPage;
  const v = params.get("v") === "B" ? "B" : "A";
  return (
    <main id="main" className="min-h-dvh bg-[#eef1f4]">
      <PortalView page={current} version={v} onNavigate={(p) => router.push(`/portal/${p}${v === "B" ? "?v=B" : ""}`)} />
      <p className="px-4 pb-6 text-center text-[12px] text-[#7b8794]">
        Simulated school portal for the ClassPano MV3 prototype · fictional data ·{" "}
        <a className="underline" href={v === "B" ? `/portal/${current}` : `/portal/${current}?v=B`}>
          {v === "B" ? "Show first-sync content" : "Show content after teacher updates"}
        </a>{" "}
        · <a className="underline" href="/extension">Back to the demo</a>
      </p>
    </main>
  );
}

export default function PortalPageRoute() {
  return (
    <Suspense fallback={null}>
      <Standalone />
    </Suspense>
  );
}
