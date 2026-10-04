import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  eyebrow?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4 pb-8 md:flex-row md:items-end md:justify-between", className)}>
      <div className="min-w-0">
        {eyebrow && <div className="eyebrow mb-2 text-faint">{eyebrow}</div>}
        <h1 className="text-[28px] font-[750] leading-tight tracking-[-0.02em] [font-stretch:104%]">{title}</h1>
        {description && <p className="mt-1.5 max-w-[68ch] text-[15px] text-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function SectionTitle({ children, action, className }: { children: React.ReactNode; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("mb-3 flex items-center justify-between gap-4", className)}>
      <h2 className="text-[16px] font-[700] tracking-[-0.01em]">{children}</h2>
      {action}
    </div>
  );
}

export function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("rounded-[10px] border border-border bg-surface", className)}>{children}</div>;
}

export function EmptyState({
  title,
  body,
  action,
  icon,
  className,
}: {
  title: string;
  body?: React.ReactNode;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-start gap-2 rounded-[10px] border border-dashed border-border-strong bg-surface px-6 py-8", className)}>
      {icon}
      <p className="text-[15px] font-semibold">{title}</p>
      {body && <p className="max-w-[56ch] text-[14px] text-muted">{body}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
