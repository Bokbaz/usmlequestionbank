"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Dialog } from "radix-ui";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/daily", label: "Daily Challenge" },
  { href: "/#argo", label: "ARGO" },
  { href: "/#library", label: "Library" },
  { href: "/pricing", label: "Pricing" },
];

// Transparent over the ink hero, solid once the page scrolls.
export function SiteHeader({ overInk = true }: { overInk?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    createClient()
      .auth.getSession()
      .then(({ data }) => setSignedIn(Boolean(data.session)));
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const inverse = overInk && !scrolled;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 transition-[background-color,border-color,box-shadow] duration-300 ease-[var(--ease-out-quart)]",
        inverse ? "border-b border-transparent bg-transparent" : "border-b border-border bg-surface/95 backdrop-blur-sm",
      )}
    >
      <div className="mx-auto flex h-16 max-w-[1240px] items-center gap-8 px-5 md:px-8">
        <Link href="/" aria-label="Argonaut USMLE home" className="shrink-0">
          <Logo tone={inverse ? "inverse" : "default"} />
        </Link>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "rounded-[6px] px-3 py-2 text-[14px] font-semibold transition-colors duration-150",
                inverse ? "text-on-ink-muted hover:text-on-ink" : "text-muted hover:text-text",
              )}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto hidden items-center gap-2 md:flex">
          {signedIn ? (
            <Button asChild variant={inverse ? "ink" : "primary"} size="md">
              <Link href="/dashboard">Open dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="md" className={inverse ? "text-on-ink-muted hover:bg-on-ink/10 hover:text-on-ink" : ""}>
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild variant={inverse ? "ink" : "primary"} size="md">
                <Link href="/signup">Start free</Link>
              </Button>
            </>
          )}
        </div>
        <MobileMenu inverse={inverse} signedIn={Boolean(signedIn)} />
      </div>
    </header>
  );
}

function MobileMenu({ inverse, signedIn }: { inverse: boolean; signedIn: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          className={cn("ml-auto grid size-10 place-items-center rounded-[8px] md:hidden", inverse ? "text-on-ink" : "text-text")}
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/40" />
        <Dialog.Content className="fixed inset-x-0 top-0 z-50 border-b border-border bg-surface px-5 pb-6 pt-4 shadow-[var(--shadow-float)]">
          <Dialog.Title className="sr-only">Menu</Dialog.Title>
          <div className="flex items-center justify-between">
            <Logo />
            <Dialog.Close className="grid size-10 place-items-center rounded-[8px] text-text" aria-label="Close menu">
              <X className="size-5" />
            </Dialog.Close>
          </div>
          <nav className="mt-4 grid gap-1" aria-label="Mobile">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="rounded-[8px] px-3 py-3 text-[16px] font-semibold text-text hover:bg-panel">
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 grid gap-2">
            {signedIn ? (
              <Button asChild size="lg">
                <Link href="/dashboard">Open dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild size="lg">
                  <Link href="/signup">Start free</Link>
                </Button>
                <Button asChild size="lg" variant="secondary">
                  <Link href="/login">Log in</Link>
                </Button>
              </>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
