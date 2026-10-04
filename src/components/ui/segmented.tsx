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
      className={cn("inline-flex rounded-[6px] border border-border bg-panel p-0.5", className)}
    >
      {options.map((o) => (
        <ToggleGroup.Item
          key={o.value}
          value={o.value}
          title={o.hint}
          className={cn(
            "rounded-[4px] px-3 font-bold text-muted transition-colors duration-150 hover:text-text data-[state=on]:bg-text data-[state=on]:text-bg",
            size === "sm" ? "h-7 text-[12.5px]" : "h-8 text-[13.5px]",
          )}
        >
          {o.label}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  );
}
