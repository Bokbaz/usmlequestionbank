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

// Transparent over the signal-orange hero, solid once the page scrolls.
export function SiteHeader({ overHero = true }: { overHero?: boolean }) {
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

  const signal = overHero && !scrolled;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 transition-[background-color,border-color,box-shadow] duration-300 ease-[var(--ease-out-quart)]",
        signal ? "on-signal border-b border-transparent bg-transparent" : "border-b border-border bg-surface",
      )}
    >
      <div className="mx-auto flex h-16 max-w-[1320px] items-center gap-8 px-5 md:px-8">
        <Link href="/" aria-label="Argonaut USMLE home" className="shrink-0">
          <Logo tone={signal ? "signal" : "default"} />
        </Link>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "rounded-[4px] px-3 py-2 text-[14px] font-bold transition-colors duration-150",
                signal ? "text-on-brand hover:bg-on-brand/10" : "text-muted hover:text-text",
              )}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto hidden items-center gap-2 md:flex">
          {signedIn ? (
            <Button asChild variant={signal ? "carbon" : "primary"} size="md">
              <Link href="/dashboard">Open dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="md" className={signal ? "text-on-brand hover:bg-on-brand/10 hover:text-on-brand" : ""}>
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild variant={signal ? "carbon" : "primary"} size="md">
                <Link href="/signup">Start free</Link>
              </Button>
            </>
          )}
        </div>
        <MobileMenu signal={signal} signedIn={Boolean(signedIn)} />
      </div>
    </header>
  );
}

function MobileMenu({ signal, signedIn }: { signal: boolean; signedIn: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          className={cn("ml-auto grid size-10 place-items-center rounded-[4px] md:hidden", signal ? "text-on-brand" : "text-text")}
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
            <Dialog.Close className="grid size-10 place-items-center rounded-[4px] text-text" aria-label="Close menu">
              <X className="size-5" />
            </Dialog.Close>
          </div>
          <nav className="mt-4 grid gap-1" aria-label="Mobile">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="rounded-[4px] px-3 py-3 text-[16px] font-bold text-text hover:bg-panel">
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
