"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/import", label: "Import" },
  { href: "/admin/questions", label: "Questions" },
  { href: "/admin/nuggets", label: "Nugget review" },
  { href: "/admin/analysis", label: "Item analysis" },
  { href: "/admin/daily", label: "Daily" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/feedback", label: "Feedback" },
];

export function AdminTabs() {
  const path = usePathname();
  return (
    <nav aria-label="Admin" className="scrollbar-thin -mx-1 mb-8 flex gap-1 overflow-x-auto border-b border-border px-1">
      {TABS.map((t) => {
        const active = t.href === "/admin" ? path === "/admin" : path.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative shrink-0 px-3 pb-3 pt-1 text-[14px] font-semibold transition-colors duration-150",
              active ? "text-text after:absolute after:inset-x-3 after:-bottom-px after:h-0.5 after:rounded-full after:bg-brand" : "text-muted hover:text-text",
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
