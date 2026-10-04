import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          "h-10 w-full rounded-[6px] border border-border bg-surface px-3 text-[15px] text-text placeholder:text-faint transition-[border-color,box-shadow] duration-150 hover:border-border-strong focus:border-brand-strong focus:outline-none focus:ring-3 focus:ring-[var(--brand-ring)] disabled:cursor-not-allowed disabled:bg-panel disabled:text-faint aria-[invalid=true]:border-incorrect",
          className,
        )}
        {...props}
      />
    );
  },
);

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(
          "w-full rounded-[6px] border border-border bg-surface px-3 py-2 text-[15px] text-text placeholder:text-faint transition-[border-color,box-shadow] duration-150 hover:border-border-strong focus:border-brand-strong focus:outline-none focus:ring-3 focus:ring-[var(--brand-ring)] disabled:cursor-not-allowed disabled:bg-panel",
          className,
        )}
        {...props}
      />
    );
  },
);

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("text-[13px] font-semibold text-text", className)} {...props} />;
}

export function Field({
  label,
  hint,
  error,
  htmlFor,
  children,
  className,
}: {
  label: string;
  hint?: React.ReactNode;
  error?: string | null;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p className="text-[13px] font-medium text-incorrect" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-[13px] text-muted">{hint}</p>
      ) : null}
    </div>
  );
}
