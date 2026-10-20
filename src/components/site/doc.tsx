import { cn } from "@/lib/utils";

/** Long-form page section with the Launchpad eyebrow + serif heading pattern. */
export function DocSection({ id, eyebrow, title, muted, children, tone = "paper", className }: { id: string; eyebrow: string; title: React.ReactNode; muted?: React.ReactNode; children: React.ReactNode; tone?: "paper" | "fog" | "dark"; className?: string }) {
  return (
    <section id={id} className={cn("scroll-mt-24 py-[clamp(64px,7vw,104px)]", tone === "fog" && "bg-fog", tone === "paper" && "bg-paper", tone === "dark" && "dots-dark on-dark text-paper", className)} aria-labelledby={`${id}-h`}>
      <div className="container-page">
        <p className={cn("eyebrow", tone === "dark" ? "text-muted-display" : "text-muted")}>{eyebrow}</p>
        <h2 id={`${id}-h`} className="display-md mt-3 max-w-4xl">
          {title} {muted && <span className="text-muted-display">{muted}</span>}
        </h2>
        <div className="mt-10">{children}</div>
      </div>
    </section>
  );
}

export function Code({ title, children, className }: { title: string; children: string; className?: string }) {
  return (
    <div className={cn("min-w-0 overflow-hidden rounded-[16px] bg-void text-paper", className)}>
      <p className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5 font-mono text-[12px] text-paper/60">
        <span className="size-2 rounded-full bg-jade" /> {title}
      </p>
      <pre className="overflow-x-auto p-4 font-mono text-[12.5px] leading-relaxed text-paper/90">{children}</pre>
    </div>
  );
}

export function Toc({ items }: { items: { id: string; label: string }[] }) {
  return (
    <nav aria-label="On this page" className="no-scrollbar mt-8 flex gap-1.5 overflow-x-auto">
      {items.map((i) => (
        <a key={i.id} href={`#${i.id}`} className="shrink-0 rounded-full border border-dark-line px-3 py-1.5 text-[13px] text-paper/85 transition-colors hover:border-paper hover:text-paper">
          {i.label}
        </a>
      ))}
    </nav>
  );
}
