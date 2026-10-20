import { Suspense } from "react";
import type { Metadata } from "next";
import { SiteNav } from "@/components/site/site-nav";
import { SyncView } from "./view";

export const metadata: Metadata = { title: "Extension + school portal" };

export default function SyncPage() {
  return (
    <>
      <SiteNav />
      <main id="main" className="min-h-dvh bg-fog pb-28">
        <Suspense fallback={null}>
          <SyncView />
        </Suspense>
      </main>
    </>
  );
}
