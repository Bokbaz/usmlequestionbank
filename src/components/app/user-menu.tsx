"use client";

import Link from "next/link";
import { useTransition } from "react";
import { DropdownMenu } from "radix-ui";
import { useTheme } from "next-themes";
import { ChevronsUpDown, CreditCard, LogOut, Moon, Settings, Sun } from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { PLAN_NAME } from "@/lib/plans";

type ShellUser = { name: string; email: string; plan: "free" | "core" | "argo"; isAdmin: boolean; streak: number };

export function UserMenu({ user }: { user: ShellUser }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [signingOut, startSignOut] = useTransition();
  const initials = user.name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className="flex w-full items-center gap-2.5 rounded-[8px] p-1.5 text-left transition-colors hover:bg-sunken">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand text-[12px] font-bold text-on-brand">{initials || "A"}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13.5px] font-semibold text-text">{user.name}</span>
          <span className="block truncate text-[12px] text-muted">
            {user.isAdmin ? "Admin" : PLAN_NAME[user.plan]}
            {user.streak > 0 ? ` · ${user.streak}-day streak` : ""}
          </span>
        </span>
        <ChevronsUpDown className="size-4 shrink-0 text-faint" />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          side="top"
          align="start"
          sideOffset={8}
          className="z-50 w-[230px] rounded-[10px] border border-border bg-surface p-1.5 shadow-[var(--shadow-float)]"
        >
          <div className="px-2.5 py-2">
            <p className="truncate text-[13px] font-semibold">{user.name}</p>
            <p className="truncate text-[12px] text-muted">{user.email}</p>
          </div>
          <DropdownMenu.Separator className="my-1 h-px bg-border" />
          <Item href="/settings" icon={Settings} label="Settings" />
          <Item href="/settings/billing" icon={CreditCard} label="Plan and billing" />
          <DropdownMenu.Item
            onSelect={(e) => {
              e.preventDefault();
              setTheme(resolvedTheme === "dark" ? "light" : "dark");
            }}
            className="flex h-9 cursor-pointer items-center gap-2.5 rounded-[6px] px-2.5 text-[13.5px] font-medium text-text outline-none data-[highlighted]:bg-panel"
          >
            {resolvedTheme === "dark" ? <Sun className="size-4 text-muted" /> : <Moon className="size-4 text-muted" />}
            {resolvedTheme === "dark" ? "Light theme" : "Dark theme"}
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="my-1 h-px bg-border" />
          {/* A <form> inside the menu never submits: selecting the item closes the menu and
              unmounts the button first. Call the action from onSelect instead. */}
          <DropdownMenu.Item
            disabled={signingOut}
            onSelect={() => startSignOut(() => signOut())}
            className="flex h-9 cursor-pointer items-center gap-2.5 rounded-[6px] px-2.5 text-[13.5px] font-medium text-text outline-none data-[disabled]:opacity-60 data-[highlighted]:bg-panel"
          >
            <LogOut className="size-4 text-muted" /> {signingOut ? "Signing out…" : "Sign out"}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function Item({ href, icon: Icon, label }: { href: string; icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <DropdownMenu.Item asChild>
      <Link href={href} className="flex h-9 items-center gap-2.5 rounded-[6px] px-2.5 text-[13.5px] font-medium text-text outline-none data-[highlighted]:bg-panel">
        <Icon className="size-4 text-muted" />
        {label}
      </Link>
    </DropdownMenu.Item>
  );
}
