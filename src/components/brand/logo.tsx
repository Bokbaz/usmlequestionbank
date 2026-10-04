import { cn } from "@/lib/utils";

type Tone = "default" | "inverse" | "signal";

// Constellation "A": the Argo Navis motif. The apex star carries the signal colour.
export function ArgoMark({ className, apex = "brand" }: { className?: string; apex?: "brand" | "gold" | "current" }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("shrink-0", className)}>
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="square" fill="none">
        <path d="M5.5 27 L16 4.8 L26.5 27" />
        <path d="M10.4 17.6 L21.6 17.6" />
      </g>
      <g fill="currentColor">
        <rect x="3.2" y="24.7" width="4.6" height="4.6" />
        <rect x="24.2" y="24.7" width="4.6" height="4.6" />
        <rect x="8.5" y="15.7" width="3.8" height="3.8" />
        <rect x="19.7" y="15.7" width="3.8" height="3.8" />
      </g>
      <rect
        x="12.6"
        y="1.4"
        width="6.8"
        height="6.8"
        className={apex === "gold" ? "fill-gold" : apex === "brand" ? "fill-brand" : "fill-current"}
      />
    </svg>
  );
}

export function Logo({ className, tone = "default", size = "md" }: { className?: string; tone?: Tone; size?: "md" | "sm" }) {
  const color = tone === "inverse" ? "text-on-ink" : tone === "signal" ? "text-on-brand" : "text-text";
  const sub = tone === "inverse" ? "text-on-ink-muted" : tone === "signal" ? "text-on-brand-muted" : "text-muted";
  const sm = size === "sm";
  return (
    <span className={cn("inline-flex items-center", sm ? "gap-2" : "gap-2.5", color, className)}>
      <ArgoMark className={sm ? "size-5" : "size-[22px]"} apex={tone === "signal" ? "current" : "brand"} />
      <span className="flex items-baseline gap-1.5 font-display leading-none">
        <span className={cn("font-[850] tracking-[0.02em]", sm ? "text-[13px] [font-stretch:135%]" : "text-[15px] [font-stretch:150%]")}>ARGONAUT</span>
        <span className={cn("font-[700] tracking-[0.12em] [font-stretch:110%]", sm ? "text-[9.5px]" : "text-[10.5px]", sub)}>USMLE</span>
      </span>
    </span>
  );
}
