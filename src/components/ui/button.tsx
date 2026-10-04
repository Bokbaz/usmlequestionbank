import * as React from "react";
import { Slot } from "radix-ui";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const variants = {
  primary: "bg-brand text-on-brand hover:bg-brand-hover active:translate-y-px disabled:bg-border-strong disabled:text-surface",
  secondary:
    "bg-surface text-text border border-border hover:border-border-strong hover:bg-panel active:bg-sunken disabled:text-faint",
  ghost: "text-muted hover:text-text hover:bg-panel active:bg-sunken disabled:text-faint",
  danger: "bg-incorrect text-surface hover:brightness-95 active:translate-y-px",
  // The call to action on carbon (ink) surfaces: signal orange.
  ink: "bg-brand text-on-brand hover:bg-brand-hover active:translate-y-px",
  "ink-outline": "border border-on-ink/30 text-on-ink hover:bg-on-ink/10 active:bg-on-ink/15",
  // For signal-orange surfaces: carbon fill and carbon outline.
  carbon: "bg-ink text-on-ink hover:bg-ink-2 active:translate-y-px",
  "carbon-outline": "border-2 border-on-brand text-on-brand hover:bg-on-brand/10 active:bg-on-brand/15",
  gold: "bg-gold text-[oklch(0.25_0.06_70)] hover:brightness-105 active:translate-y-px",
} as const;

const sizes = {
  sm: "h-8 px-3 text-[13px] gap-1.5 rounded-[4px]",
  md: "h-9 px-4 text-[14px] gap-2 rounded-[4px]",
  lg: "h-11 px-5 text-[15px] gap-2 rounded-[5px]",
  xl: "h-13 px-6 text-[16px] gap-2.5 rounded-[6px]",
  icon: "size-9 rounded-[4px]",
  "icon-sm": "size-8 rounded-[4px]",
} as const;

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  loading?: boolean;
  asChild?: boolean;
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", loading, asChild, disabled, children, ...props },
  ref,
) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex select-none items-center justify-center whitespace-nowrap font-bold transition-[background-color,border-color,color,transform,filter] duration-150 ease-[var(--ease-out-quart)] disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {asChild ? (
        children
      ) : (
        <>
          {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {children}
        </>
      )}
    </Comp>
  );
});
