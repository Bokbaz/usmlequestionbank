import Link from "next/link";
import { cn } from "@/lib/utils";

export function SettingsNav({ active }: { active: "profile" | "billing" }) {
  return <nav aria-label="Settings" className="mb-7 flex gap-6 border-b border-border">
    {([ ["profile", "Profile and preferences", "/settings"], ["billing", "Billing", "/settings/billing"] ] as const).map(([id, label, href]) =>
      <Link key={id} href={href} aria-current={active === id ? "page" : undefined} className={cn("border-b-2 py-3 text-[14px] font-semibold", active === id ? "border-brand-strong text-text" : "border-transparent text-muted hover:text-text")}>{label}</Link>)}
  </nav>;
}
