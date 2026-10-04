import * as React from "react";
import { Slot } from "radix-ui";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const variants = {
  primary:
    "bg-brand text-on-brand hover:bg-brand-strong active:translate-y-px shadow-[inset_0_1px_0_oklch(1_0_0/0.12)] disabled:bg-border-strong disabled:text-surface",
  secondary:
    "bg-surface text-text border border-border hover:border-border-strong hover:bg-panel active:bg-sunken disabled:text-faint",
  ghost: "text-muted hover:text-text hover:bg-panel active:bg-sunken disabled:text-faint",
  danger: "bg-incorrect text-surface hover:brightness-95 active:translate-y-px",
  ink: "bg-on-ink text-ink hover:bg-white/90 active:translate-y-px",
  "ink-outline": "border border-on-ink/25 text-on-ink hover:bg-on-ink/10 active:bg-on-ink/15",
  gold: "bg-gold text-[oklch(0.25_0.06_70)] hover:brightness-105 active:translate-y-px",
} as const;

const sizes = {
  sm: "h-8 px-3 text-[13px] gap-1.5 rounded-[6px]",
  md: "h-9 px-4 text-[14px] gap-2 rounded-[6px]",
  lg: "h-11 px-5 text-[15px] gap-2 rounded-[8px]",
  xl: "h-13 px-6 text-[16px] gap-2.5 rounded-[10px]",
  icon: "size-9 rounded-[6px]",
  "icon-sm": "size-8 rounded-[6px]",
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
        "inline-flex select-none items-center justify-center whitespace-nowrap font-semibold transition-[background-color,border-color,color,transform,filter] duration-150 ease-[var(--ease-out-quart)] disabled:cursor-not-allowed",
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
