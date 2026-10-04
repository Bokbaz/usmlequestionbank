import { cn } from "@/lib/utils";

const tones = {
  neutral: "bg-panel text-muted border-border",
  brand: "bg-brand-soft text-brand-strong border-transparent",
  gold: "bg-gold-soft text-gold-ink border-transparent",
  correct: "bg-correct-soft text-correct border-transparent",
  incorrect: "bg-incorrect-soft text-incorrect border-transparent",
  warning: "bg-warning-soft text-warning border-transparent",
  ink: "bg-on-ink/10 text-on-ink border-on-ink/15",
} as const;

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: keyof typeof tones;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-[22px] items-center gap-1 whitespace-nowrap rounded-full border px-2 text-[12px] font-semibold leading-none",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

// The gold diamond marks an ultra-high-yield concept. Never decorative.
export function NuggetGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 12 12" aria-hidden="true" className={cn("size-3 shrink-0", className)}>
      <path d="M6 0.6 L11.4 6 L6 11.4 L0.6 6 Z" className="fill-gold" />
      <path d="M6 2.8 L9.2 6 L6 9.2 L2.8 6 Z" fill="oklch(1 0 0 / 0.35)" />
    </svg>
  );
}

export function NuggetBadge({ className, label = "Nugget" }: { className?: string; label?: string }) {
  return (
    <Badge tone="gold" className={className}>
      <NuggetGlyph />
      {label}
    </Badge>
  );
}
