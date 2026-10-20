"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { MotionConfig } from "motion/react";
import { Toaster } from "sonner";
import { STORAGE_KEY, useDemo } from "@/lib/store";
import { DemoControl } from "@/components/demo/demo-control";
import { VisitTracker } from "@/components/demo/visit-tracker";

/** Loads persisted demo state once and keeps tabs in sync. */
function StoreHydrator() {
  useEffect(() => {
    void useDemo.persist.rehydrate();
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) void useDemo.persist.rehydrate();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  // The standalone /portal page is the "school website" for the real extension; no demo chrome there.
  const bare = usePathname().startsWith("/portal");
  return (
    <MotionConfig reducedMotion="user">
      <StoreHydrator />
      <VisitTracker />
      {children}
      {!bare && <DemoControl />}
      <Toaster
        position="bottom-right"
        closeButton
        toastOptions={{
          classNames: {
            toast: "!rounded-[12px] !border !border-line !bg-paper !text-void !shadow-float !font-sans",
            title: "!text-[14px] !font-medium",
            description: "!text-[13px] !text-muted",
          },
        }}
      />
    </MotionConfig>
  );
}
