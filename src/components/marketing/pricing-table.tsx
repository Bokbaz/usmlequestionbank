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

  const freeCta: Cta = signedIn
    ? { label: unlocked ? "Included" : "Current plan", href: "/dashboard", disabled: true }
    : { label: "Start free", href: "/signup" };
  const accessCta: Cta = unlocked
    ? { label: "Unlocked", href: "/settings/billing", disabled: true }
    : { label: `Unlock for ${formatUsd(access.amountUsd)}`, href: "/api/stripe/checkout?offer=access" };
  const writerCta: Cta = hasWriter
    ? { label: "Active", href: "/settings/billing", disabled: true }
    : signedIn && !unlocked
      ? { label: "Needs Full access first", href: "/settings/billing", disabled: true }
      : { label: `Add for ${formatUsd(writer.amountUsd)} a month`, href: "/api/stripe/checkout?offer=writer" };

  return (
    <div>
      <div className="grid items-stretch gap-4 lg:grid-cols-[1fr_1.2fr_1fr]">
        <Tier
          name="Free"
          tagline="Try it properly before you pay anything."
          price="$0"
          per="forever"
          features={FREE_FEATURES}
          cta={freeCta}
        />
        <Tier
          featured
          name={access.name}
          tagline={access.tagline}
          price={formatUsd(access.amountUsd)}
          per="once"
          note="Pay once. Keep it."
          features={access.features}
          cta={accessCta}
        />
        <Tier
          addon
          name={writer.name}
          tagline={writer.tagline}
          price={formatUsd(writer.amountUsd)}
          per="a month"
          note="Optional, on top of Full access"
          features={writer.features}
          cta={writerCta}
        />
      </div>
      <p className="mt-6 text-center text-[13.5px] text-muted">
        Prices in USD. Full access is one payment; only the optional add-on renews monthly.
      </p>
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
        "relative flex flex-col rounded-[8px] p-7 md:p-8",
        featured
          ? "bg-ink text-on-ink shadow-[0_40px_90px_-40px_oklch(0.2_0.02_262/0.6)] lg:-my-4 lg:py-12"
          : addon
            ? "border border-dashed border-border-strong bg-panel"
            : "border border-border bg-surface",
      )}
    >
      <div className="flex items-center gap-2">
        {featured && <ArgoMark className="size-4 text-on-ink" />}
        {addon && <Plus className="size-4 text-brand-strong" strokeWidth={2.5} />}
        <h3 className="eyebrow text-[12.5px]">{name}</h3>
      </div>
      <div className="mt-6 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
        <span className={cn("display text-[44px] font-[900] leading-none [font-stretch:125%] sm:text-[52px]", featured && "text-brand")}>{price}</span>
        <span className={cn("whitespace-nowrap text-[15px] font-bold", featured ? "text-on-ink-muted" : "text-muted")}>{per}</span>
      </div>
      <p className={cn("mt-4 text-[15px] leading-snug", featured ? "text-on-ink" : "text-text")}>{tagline}</p>
      {note && <p className={cn("mt-1 text-[13.5px] font-bold", featured ? "text-brand" : "text-muted")}>{note}</p>}
      <ul className={cn("mt-7 grid gap-3 border-t pt-6", featured ? "border-on-ink/15" : "border-border")}>
        {features.map((f) => (
          <li key={f} className="flex gap-2.5 text-[14.5px] leading-snug">
            <Check className={cn("mt-0.5 size-4 shrink-0", featured ? "text-brand" : "text-brand-strong")} strokeWidth={3} />
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
