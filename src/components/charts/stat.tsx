import { cn } from "@/lib/utils";

// Stat tile: label, value (proportional figures), optional context line.
export function Stat({ label, value, context, tone, className }: { label: string; value: React.ReactNode; context?: React.ReactNode; tone?: "good" | "bad"; className?: string }) {
  return (
    <div className={cn("min-w-0", className)}>
      <p className="text-[13px] text-muted">{label}</p>
      <p className="mt-1 text-[26px] font-[700] leading-none tracking-[-0.02em]">{value}</p>
      {context && <p className={cn("mt-1.5 text-[12.5px]", tone === "good" ? "text-correct" : tone === "bad" ? "text-incorrect" : "text-muted")}>{context}</p>}
    </div>
  );
}

// A row of stats separated by hairlines (not a grid of identical cards).
export function StatRow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 gap-x-6 gap-y-5 rounded-[10px] border border-border bg-surface p-5 md:flex md:divide-x md:divide-border md:p-0", className)}>
      {children}
    </div>
  );
}

export function StatCell({ children }: { children: React.ReactNode }) {
  return <div className="min-w-0 md:flex-1 md:px-5 md:py-4">{children}</div>;
}
