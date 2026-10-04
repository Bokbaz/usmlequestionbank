"use client";

import Link from "next/link";
import { useState } from "react";
import { Check } from "lucide-react";
import { ArgoMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { PLANS, PRICES, type PriceKey } from "@/lib/plans";
import { cn } from "@/lib/utils";

export function PricingTable({ currentPlan }: { currentPlan?: "free" | "core" | "argo" }) {
  const [term, setTerm] = useState<"1m" | "3m">("3m");
  const core = PRICES[`core_${term}` as PriceKey];
  const argo = PRICES[`argo_${term}` as PriceKey];

  return (
    <div>
      <div className="flex justify-center">
        <Segmented
          value={term}
          onChange={setTerm}
          options={[
            { value: "1m", label: "Monthly" },
            { value: "3m", label: "3 months" },
          ]}
        />
      </div>
      <div className="mt-10 grid gap-5 lg:grid-cols-3">
        <Tier
          name={PLANS.free.name}
          tagline={PLANS.free.tagline}
          price="$0"
          per="forever"
          features={PLANS.free.features}
          cta={currentPlan ? { label: currentPlan === "free" ? "Current plan" : "Included", href: "/dashboard", disabled: true } : { label: "Start free", href: "/signup" }}
        />
        <Tier
          name={PLANS.core.name}
          tagline={PLANS.core.tagline}
          price={`$${core.amountUsd}`}
          per={core.months === 1 ? "per month" : `for ${core.months} months`}
          note={core.months > 1 ? `$${core.perMonthUsd.toFixed(0)}/month · ${core.badge}` : undefined}
          features={PLANS.core.features}
          cta={
            currentPlan === "core" || currentPlan === "argo"
              ? { label: currentPlan === "core" ? "Current plan" : "Included", href: "/settings/billing", disabled: true }
              : { label: "Get QBank", href: `/api/stripe/checkout?price=core_${term}` }
          }
        />
        <Tier
          featured
          name={PLANS.argo.name}
          tagline={PLANS.argo.tagline}
          price={`$${argo.amountUsd}`}
          per={argo.months === 1 ? "per month" : `for ${argo.months} months`}
          note={argo.months > 1 ? `$${argo.perMonthUsd.toFixed(0)}/month · ${argo.badge}` : undefined}
          features={PLANS.argo.features}
          cta={
            currentPlan === "argo"
              ? { label: "Current plan", href: "/settings/billing", disabled: true }
              : { label: "Get QBank + ARGO", href: `/api/stripe/checkout?price=argo_${term}` }
          }
        />
      </div>
      <p className="mt-6 text-center text-[13px] text-muted">Prices in USD. Cancel anytime from your account settings.</p>
    </div>
  );
}

function Tier({
  name,
  tagline,
  price,
  per,
  note,
  features,
  cta,
  featured,
}: {
  name: string;
  tagline: string;
  price: string;
  per: string;
  note?: string;
  features: string[];
  cta: { label: string; href: string; disabled?: boolean };
  featured?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative flex flex-col rounded-[14px] border p-7",
        featured ? "border-transparent bg-ink text-on-ink shadow-[0_40px_90px_-40px_oklch(0.2_0.08_266/0.6)]" : "border-border bg-surface",
      )}
    >
      <div className="flex items-center gap-2">
        {featured && <ArgoMark className="size-4 text-on-ink" />}
        <h3 className="text-[18px] font-[750] tracking-[-0.01em]">{name}</h3>
      </div>
      <p className={cn("mt-1.5 text-[14px] leading-snug", featured ? "text-on-ink-muted" : "text-muted")}>{tagline}</p>
      <div className="mt-6 flex items-baseline gap-2">
        <span className="text-[44px] font-[750] leading-none tracking-[-0.03em]">{price}</span>
        <span className={cn("text-[14px]", featured ? "text-on-ink-muted" : "text-muted")}>{per}</span>
      </div>
      <p className={cn("mt-2 h-5 text-[13px] font-semibold", featured ? "text-on-ink-muted" : "text-muted")}>{note}</p>
      <ul className="mt-6 grid gap-2.5">
        {features.map((f) => (
          <li key={f} className="flex gap-2.5 text-[14px] leading-snug">
            <Check className={cn("mt-0.5 size-4 shrink-0", featured ? "text-on-ink" : "text-brand")} strokeWidth={2.5} />
            <span className={featured ? "text-on-ink/90" : "text-text"}>{f}</span>
          </li>
        ))}
      </ul>
      <div className="mt-auto pt-8">
        {cta.disabled ? (
          <Button variant={featured ? "ink-outline" : "secondary"} size="lg" className="w-full" disabled>
            {cta.label}
          </Button>
        ) : (
          <Button asChild variant={featured ? "ink" : "secondary"} size="lg" className="w-full">
            <Link href={cta.href} prefetch={false}>
              {cta.label}
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
