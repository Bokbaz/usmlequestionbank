"use client";

import * as React from "react";
import { Checkbox as RCheckbox, Switch as RSwitch, Tooltip as RTooltip, Progress as RProgress } from "radix-ui";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export function Checkbox({
  checked,
  onCheckedChange,
  className,
  ...props
}: React.ComponentProps<typeof RCheckbox.Root>) {
  return (
    <RCheckbox.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      className={cn(
        "grid size-[18px] shrink-0 place-items-center rounded-[4px] border border-border-strong bg-surface transition-colors duration-150 hover:border-brand data-[state=checked]:border-brand data-[state=checked]:bg-brand data-[state=indeterminate]:border-brand data-[state=indeterminate]:bg-brand disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <RCheckbox.Indicator className="text-on-brand">
        {checked === "indeterminate" ? <Minus className="size-3.5" strokeWidth={3} /> : <Check className="size-3.5" strokeWidth={3} />}
      </RCheckbox.Indicator>
    </RCheckbox.Root>
  );
}

export function Switch({ className, ...props }: React.ComponentProps<typeof RSwitch.Root>) {
  return (
    <RSwitch.Root
      className={cn(
        "relative h-[22px] w-[38px] shrink-0 rounded-full bg-border-strong transition-colors duration-200 data-[state=checked]:bg-brand disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <RSwitch.Thumb className="block size-[18px] translate-x-[2px] rounded-full bg-surface shadow-sm transition-transform duration-200 ease-[var(--ease-out-quart)] data-[state=checked]:translate-x-[18px]" />
    </RSwitch.Root>
  );
}

export function Tooltip({ content, children, side = "top" }: { content: React.ReactNode; children: React.ReactNode; side?: "top" | "bottom" | "left" | "right" }) {
  return (
    <RTooltip.Provider delayDuration={250}>
      <RTooltip.Root>
        <RTooltip.Trigger asChild>{children}</RTooltip.Trigger>
        <RTooltip.Portal>
          <RTooltip.Content
            side={side}
            sideOffset={6}
            className="z-50 max-w-[260px] rounded-[6px] bg-ink px-2.5 py-1.5 text-[12.5px] font-medium leading-snug text-on-ink shadow-[var(--shadow-float)]"
          >
            {content}
          </RTooltip.Content>
        </RTooltip.Portal>
      </RTooltip.Root>
    </RTooltip.Provider>
  );
}

export function ProgressBar({ value, className, tone = "brand" }: { value: number; className?: string; tone?: "brand" | "correct" | "gold" | "incorrect" }) {
  const color = { brand: "bg-brand", correct: "bg-correct", gold: "bg-gold", incorrect: "bg-incorrect" }[tone];
  return (
    <RProgress.Root value={value} className={cn("relative h-1.5 w-full overflow-hidden rounded-full bg-sunken", className)}>
      <RProgress.Indicator
        className={cn("h-full rounded-full transition-[width] duration-500 ease-[var(--ease-out-quart)]", color)}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </RProgress.Root>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-[6px] bg-sunken", className)} />;
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded-[4px] border border-border bg-panel px-1 font-sans text-[11px] font-semibold text-muted">
      {children}
    </kbd>
  );
}
