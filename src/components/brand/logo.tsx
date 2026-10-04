import { cn } from "@/lib/utils";

// Constellation "A": the Argo Navis motif. The apex star is gold (a Nugget).
export function ArgoMark({ className, gold = true }: { className?: string; gold?: boolean }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("shrink-0", className)}>
      <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.9">
        <path d="M5.5 27 L16 4.8 L26.5 27" />
        <path d="M10.4 17.6 L21.6 17.6" />
      </g>
      <g fill="currentColor">
        <circle cx="5.5" cy="27" r="2.3" />
        <circle cx="26.5" cy="27" r="2.3" />
        <circle cx="10.4" cy="17.6" r="1.9" />
        <circle cx="21.6" cy="17.6" r="1.9" />
      </g>
      <circle cx="16" cy="4.8" r="3" className={gold ? "fill-gold" : "fill-current"} />
    </svg>
  );
}

export function Logo({ className, tone = "default" }: { className?: string; tone?: "default" | "inverse" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-sans text-[17px] font-[750] tracking-[-0.02em] [font-stretch:112%]",
        tone === "inverse" ? "text-on-ink" : "text-text",
        className,
      )}
    >
      <ArgoMark className={cn("size-[22px]", tone === "inverse" ? "text-on-ink" : "text-brand")} />
      <span>
        Argonaut<span className={cn("ml-1 font-[550]", tone === "inverse" ? "text-on-ink-muted" : "text-muted")}>USMLE</span>
      </span>
    </span>
  );
}
