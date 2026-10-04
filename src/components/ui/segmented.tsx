"use client";

import { ToggleGroup } from "radix-ui";
import { cn } from "@/lib/utils";

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
  size = "md",
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: React.ReactNode; hint?: string }[];
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <ToggleGroup.Root
      type="single"
      value={value}
      onValueChange={(v) => v && onChange(v as T)}
      className={cn("inline-flex rounded-[8px] border border-border bg-panel p-0.5", className)}
    >
      {options.map((o) => (
        <ToggleGroup.Item
          key={o.value}
          value={o.value}
          title={o.hint}
          className={cn(
            "rounded-[6px] px-3 font-semibold text-muted transition-colors duration-150 hover:text-text data-[state=on]:bg-surface data-[state=on]:text-text data-[state=on]:shadow-[0_1px_2px_oklch(0.2_0.04_265/0.08)]",
            size === "sm" ? "h-7 text-[12.5px]" : "h-8 text-[13.5px]",
          )}
        >
          {o.label}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  );
}
