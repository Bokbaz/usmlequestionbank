"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dialog } from "radix-ui";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/brand/logo";
import { ADMIN_ITEM, NAV_GROUPS, SETTINGS_ITEM } from "@/components/app/nav-config";
import { UserMenu } from "@/components/app/user-menu";
import { cn } from "@/lib/utils";

type ShellUser = { name: string; email: string; plan: "free" | "core" | "argo"; isAdmin: boolean; streak: number };

function NavLink({ href, label, icon: Icon, pro, locked, onNavigate }: { href: string; label: string; icon: React.ComponentType<{ className?: string }>; pro?: boolean; locked?: boolean; onNavigate?: () => void }) {
  const path = usePathname();
  const active = href === "/dashboard" ? path === href : path === href || path.startsWith(href + "/");
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex h-9 items-center gap-2.5 rounded-[7px] px-2.5 text-[14px] font-semibold transition-colors duration-150",
        active ? "bg-surface text-text shadow-[0_1px_2px_oklch(0.2_0.04_265/0.08)] ring-1 ring-border" : "text-muted hover:bg-sunken hover:text-text",
      )}
    >
      <Icon className={cn("size-[17px] shrink-0", active ? "text-brand" : "text-faint group-hover:text-muted")} />
      <span className="truncate">{label}</span>
      {pro && locked && <span className="ml-auto rounded-[4px] bg-brand-soft px-1.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-brand-strong">Pro</span>}
    </Link>
  );
}

function SidebarBody({ user, onNavigate }: { user: ShellUser; onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center px-4">
        <Link href="/dashboard" onClick={onNavigate} aria-label="Dashboard">
          <Logo />
        </Link>
      </div>
      <nav className="scrollbar-thin flex-1 overflow-y-auto px-3 pb-4" aria-label="App">
        {NAV_GROUPS.map((g) => (
          <div key={g.label} className="mt-4 first:mt-1">
            <p className="eyebrow px-2.5 pb-1.5 text-faint">{g.label}</p>
            <div className="grid gap-0.5">
              {g.items.map((it) => (
                <NavLink key={it.href} {...it} locked={"pro" in it && user.plan !== "argo"} onNavigate={onNavigate} />
              ))}
            </div>
          </div>
        ))}
        <div className="mt-4 grid gap-0.5 border-t border-border pt-4">
          {user.isAdmin && <NavLink {...ADMIN_ITEM} onNavigate={onNavigate} />}
          <NavLink {...SETTINGS_ITEM} onNavigate={onNavigate} />
        </div>
      </nav>
      {user.plan === "free" && (
        <div className="mx-3 mb-3 rounded-[10px] bg-ink p-3.5 text-on-ink">
          <p className="text-[13.5px] font-semibold">Unlock the full bank</p>
          <p className="mt-1 text-[12.5px] leading-snug text-on-ink-muted">Every question, the Library, and ARGO&apos;s adaptive sessions.</p>
          <Link href="/pricing" onClick={onNavigate} className="mt-3 inline-flex h-8 items-center rounded-[6px] bg-on-ink px-3 text-[12.5px] font-semibold text-ink hover:bg-white/90">
            See plans
          </Link>
        </div>
      )}
      <div className="border-t border-border p-3">
        <UserMenu user={user} />
      </div>
    </div>
  );
}

export function Sidebar({ user }: { user: ShellUser }) {
  return (
    <aside className="sticky top-0 hidden h-svh w-[248px] shrink-0 border-r border-border bg-panel lg:block">
      <SidebarBody user={user} />
    </aside>
  );
}

export function MobileTopbar({ user }: { user: ShellUser }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-surface px-4 lg:hidden">
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Trigger asChild>
          <button className="grid size-9 place-items-center rounded-[8px] text-text hover:bg-panel" aria-label="Open navigation">
            <Menu className="size-5" />
          </button>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-ink/40" />
          <Dialog.Content className="fixed inset-y-0 left-0 z-50 w-[280px] border-r border-border bg-panel shadow-[var(--shadow-float)]">
            <Dialog.Title className="sr-only">Navigation</Dialog.Title>
            <Dialog.Close className="absolute right-3 top-3.5 grid size-9 place-items-center rounded-[8px] text-muted hover:bg-sunken" aria-label="Close navigation">
              <X className="size-5" />
            </Dialog.Close>
            <SidebarBody user={user} onNavigate={() => setOpen(false)} />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <Link href="/dashboard" aria-label="Dashboard">
        <Logo />
      </Link>
    </div>
  );
}
