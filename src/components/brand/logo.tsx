import { cn } from "@/lib/utils";

/**
 * ClassPano wordmark. The mark is one panoramic card holding two lines of
 * work and a jade "all clear" dot — everything in one view.
 */
export function LogoMark({ className, dark }: { className?: string; dark?: boolean }) {
  const card = dark ? "#ffffff" : "#000000";
  const line = dark ? "#000000" : "#ffffff";
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8", className)} aria-hidden>
      <rect x="2" y="7" width="28" height="18" rx="5.5" fill={card} />
      <rect x="6.5" y="12" width="12" height="2.6" rx="1.3" fill={line} />
      <rect x="6.5" y="17.4" width="7.5" height="2.6" rx="1.3" fill={line} opacity={0.6} />
      <circle cx="23.5" cy="16" r="3.3" fill="#00c27a" />
    </svg>
  );
}

export function Logo({ className, dark, compact, responsive, suffix = "Sync" }: { className?: string; dark?: boolean; compact?: boolean; responsive?: boolean; suffix?: string | null }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark dark={dark} />
      {!compact && (
        <span className={cn("flex items-baseline gap-1.5 text-[19px] leading-none tracking-[-0.02em]", dark ? "text-paper" : "text-void")}>
          <span className="font-semibold">ClassPano</span>
          {suffix && <span className={cn("font-display text-[20px] font-light italic", dark ? "text-muted-display" : "text-muted", responsive && "hidden min-[430px]:inline")}>{suffix}</span>}
        </span>
      )}
    </span>
  );
}
