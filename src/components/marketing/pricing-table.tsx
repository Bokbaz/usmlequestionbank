import Link from "next/link";
import { Check, Plus } from "lucide-react";
import { ArgoMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { FREE_FEATURES, OFFERS, formatUsd, planAllows } from "@/lib/plans";
import { cn } from "@/lib/utils";

type Cta = { label: string; href: string; disabled?: boolean };

// currentPlan is undefined for signed-out visitors.
export function PricingTable({ currentPlan, hasWriter = false }: { currentPlan?: "free" | "core" | "argo"; hasWriter?: boolean }) {
  const signedIn = currentPlan !== undefined;
  const unlocked = planAllows(currentPlan, "argo");
  const access = OFFERS.access;
  const writer = OFFERS.writer;

  const freeCta: Cta = signedIn ? { label: unlocked ? "Included" : "Current plan", href: "/dashboard", disabled: true } : { label: "Start free", href: "/signup" };
  const accessCta: Cta = unlocked ? { label: "Unlocked", href: "/settings/billing", disabled: true } : { label: `Unlock for ${formatUsd(access.amountUsd)}`, href: "/api/stripe/checkout?offer=access" };
  const writerCta: Cta = hasWriter
    ? { label: "Active", href: "/settings/billing", disabled: true }
    : signedIn && !unlocked
      ? { label: "Requires Full access", href: "/settings/billing", disabled: true }
      : { label: `Add for ${formatUsd(writer.amountUsd)} a month`, href: "/api/stripe/checkout?offer=writer" };

  return (
    <div>
      <div className="grid gap-5 lg:grid-cols-[1fr_1.15fr_1fr]">
        <Tier name="Free" tagline="Play the Daily Challenge and sample the bank." price="$0" per="forever" features={FREE_FEATURES} cta={freeCta} />
        <Tier
          featured
          name={access.name}
          tagline={access.tagline}
          price={formatUsd(access.amountUsd)}
          per="one time"
          note="No renewals. Access does not expire."
          features={access.features}
          cta={accessCta}
        />
        <Tier
          addon
          name={writer.name}
          tagline={writer.tagline}
          price={formatUsd(writer.amountUsd)}
          per="per month"
          note="Optional add-on to Full access"
          features={writer.features}
          cta={writerCta}
        />
      </div>
      <p className="mt-6 text-center text-[13px] text-muted">Prices in USD. Full access is a single payment; only the optional add-on renews monthly.</p>
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
  addon,
}: {
  name: string;
  tagline: string;
  price: string;
  per: string;
  note?: string;
  features: readonly string[];
  cta: Cta;
  featured?: boolean;
  addon?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative flex flex-col rounded-[14px] border p-7",
        featured ? "border-transparent bg-ink text-on-ink shadow-[0_40px_90px_-40px_oklch(0.2_0.08_266/0.6)]" : addon ? "border-dashed border-border-strong bg-panel" : "border-border bg-surface",
      )}
    >
      <div className="flex items-center gap-2">
        {featured && <ArgoMark className="size-4 text-on-ink" />}
        {addon && <Plus className="size-4 text-brand" strokeWidth={2.5} />}
        <h3 className="text-[18px] font-[750] tracking-[-0.01em]">{name}</h3>
      </div>
      <p className={cn("mt-1.5 text-[14px] leading-snug", featured ? "text-on-ink-muted" : "text-muted")}>{tagline}</p>
      <div className="mt-6 flex items-baseline gap-2">
        <span className="text-[44px] font-[750] leading-none tracking-[-0.03em]">{price}</span>
        <span className={cn("text-[14px]", featured ? "text-on-ink-muted" : "text-muted")}>{per}</span>
      </div>
      <p className={cn("mt-2 min-h-5 text-[13px] font-semibold", featured ? "text-on-ink-muted" : "text-muted")}>{note}</p>
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
          <Button asChild variant={featured ? "ink" : addon ? "primary" : "secondary"} size="lg" className="w-full">
            {/* Checkout is a route handler that redirects to Stripe: use a full navigation. */}
            {cta.href.startsWith("/api/") ? (
              <a href={cta.href}>{cta.label}</a>
            ) : (
              <Link href={cta.href} prefetch={false}>
                {cta.label}
              </Link>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
