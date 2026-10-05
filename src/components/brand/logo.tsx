import { cn } from "@/lib/utils";

type Tone = "default" | "inverse" | "signal";

// Constellation "A": the Argo Navis motif (Branding/argonaut_icon.svg). The apex star carries the brand colour.
export function ArgoMark({ className, apex = "brand" }: { className?: string; apex?: "brand" | "signal" | "gold" | "current" }) {
  return (
    <svg viewBox="0 0 256 256" aria-hidden="true" className={cn("shrink-0", className)}>
      <g fill="none" stroke="currentColor" strokeWidth="20" strokeLinecap="square" strokeLinejoin="miter">
        <path d="M48 214 L128 42 L208 214" />
        <path d="M83 147 H173" />
      </g>
      <g fill="currentColor">
        <rect x="34" y="200" width="28" height="28" rx="2" />
        <rect x="194" y="200" width="28" height="28" rx="2" />
        <rect x="70" y="134" width="26" height="26" rx="2" />
        <rect x="160" y="134" width="26" height="26" rx="2" />
      </g>
      <path
        d="M128 12 L136.5 33.5 L158 42 L136.5 50.5 L128 72 L119.5 50.5 L98 42 L119.5 33.5 Z"
        className={apex === "gold" ? "fill-gold" : apex === "brand" ? "fill-brand" : apex === "signal" ? "fill-signal" : "fill-current"}
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
      <ArgoMark className={sm ? "size-5" : "size-[22px]"} apex={tone === "default" ? "brand" : "signal"} />
      <span className="flex items-baseline gap-1.5 font-display leading-none">
        <span className={cn("font-bold tracking-[0.06em]", sm ? "text-[13px]" : "text-[15px]")}>ARGONAUT</span>
        <span className={cn("font-[700] tracking-[0.12em]", sm ? "text-[9.5px]" : "text-[10.5px]", sub)}>USMLE</span>
      </span>
    </span>
  );
}
