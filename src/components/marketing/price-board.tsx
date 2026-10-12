"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { animate, motion, useInView, useReducedMotion } from "motion/react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

export type BoardRow = { key: string; name: string; usd: number; label: string; argonaut?: boolean };

// A number that rolls up from zero the first time it scrolls into view. Screen readers and
// crawlers get the final value; the rolling digits are decoration.
export function CountUp({ to, prefix = "", suffix = "", duration = 1.6, delay = 0, className }: {
  to: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const reduce = useReducedMotion();
  const [value, setValue] = useState(0);
  const fmt = (n: number) => `${prefix}${Math.round(n).toLocaleString("en-US")}${suffix}`;

  useEffect(() => {
    if (!inView || reduce) return;
    const controls = animate(0, to, { duration, delay, ease: EASE, onUpdate: setValue });
    return () => controls.stop();
  }, [inView, reduce, to, duration, delay]);

  return (
    <span ref={ref} className={cn("readout tabular-nums", className)}>
      <span className="sr-only">{fmt(to)}</span>
      <span aria-hidden>{fmt(reduce ? to : value)}</span>
    </span>
  );
}

// The pricing page's first screen: Argonaut's price, then every other bank's, as bars on one scale.
export function PriceBoard({ rows, checked, compareHref }: { rows: BoardRow[]; checked: string; compareHref: string }) {
  const reduce = useReducedMotion();
  const max = Math.max(...rows.map((r) => r.usd));
  const us = rows.find((r) => r.argonaut)!;
  const others = rows.filter((r) => !r.argonaut).sort((a, b) => b.usd - a.usd);
  const priciest = others[0];

  return (
    <div>
      <ol className="grid gap-3 sm:gap-4">
        {[us, ...others].map((r, i) => (
          <li
            key={r.key}
            className={cn(
              "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-5 gap-y-3 rounded-[8px] px-4 py-4 sm:px-6 md:grid-cols-[176px_minmax(0,1fr)_200px]",
              r.argonaut ? "bg-signal/12 ring-2 ring-signal" : "bg-on-ink/[0.04] ring-1 ring-on-ink/12",
            )}
          >
            <div className="min-w-0">
              {r.argonaut ? (
                <Logo tone="inverse" />
              ) : (
                <span className="font-display text-[19px] font-bold tracking-[-0.02em] text-on-ink sm:text-[21px]">{r.name}</span>
              )}
            </div>
            <div className="order-last col-span-2 md:order-none md:col-span-1">
              <div className="h-3 overflow-hidden rounded-full bg-on-ink/[0.07] sm:h-4">
                <motion.div
                  className={cn("h-full origin-left rounded-full", r.argonaut ? "bg-signal" : "bg-on-ink-muted/70")}
                  style={{ width: `${Math.max((r.usd / max) * 100, 2.5)}%` }}
                  initial={reduce ? false : { scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.4, delay: 0.15 + i * 0.12, ease: EASE }}
                />
              </div>
            </div>
            <div className="text-right">
              <p className={cn("display text-[34px] font-bold leading-none sm:text-[44px]", r.argonaut ? "text-signal" : "text-on-ink")}>
                <CountUp to={r.usd} prefix="$" delay={0.15 + i * 0.12} className="font-display tracking-[-0.04em]" />
              </p>
              <p className={cn("mt-1.5 text-[12.5px] leading-tight", r.argonaut ? "font-semibold text-signal" : "text-on-ink-muted")}>{r.label}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-8 grid items-center gap-6 md:grid-cols-[minmax(0,1fr)_auto]">
        <p className="display text-[clamp(26px,3.4vw,44px)] font-bold">
          {priciest.name} costs{" "}
          <span className="text-signal">
            <CountUp to={Math.round(priciest.usd / us.usd)} suffix="×" duration={2} delay={0.6} className="font-display tracking-[-0.04em]" />
          </span>{" "}
          more.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="ink" size="lg" className="group">
            <Link href="/checkout?offer=access" prefetch={false}>
              Own it for ${us.usd}
              <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </Button>
          <Button asChild variant="ink-outline" size="lg">
            <Link href="/free-usmle-practice-questions">Try free questions</Link>
          </Button>
        </div>
      </div>

      <p className="mt-8 max-w-[90ch] text-[12.5px] leading-relaxed text-on-ink-muted">
        Other banks&apos; prices as listed on their own websites, checked {checked}; they change, so check before you buy. UWorld, AMBOSS, Kaplan and
        USMLE-Rx are trademarks of their owners; Argonaut isn&apos;t affiliated with any of them.{" "}
        <Link href={compareHref} className="font-semibold text-on-ink underline underline-offset-2">
          Full comparison
        </Link>
      </p>
    </div>
  );
}
