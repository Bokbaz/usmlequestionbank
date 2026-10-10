import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { ArgoMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { FREE_FEATURES, OFFERS, formatUsd, planAllows } from "@/lib/plans";
import { cn } from "@/lib/utils";

type Cta = { label: string; href: string; disabled?: boolean };

// One offer, not a tier grid: Full access is the product. Free and the add-on sit beneath it as
// ruled rows on a timing sheet. currentPlan is undefined for signed-out visitors.
export function PricingTable({ currentPlan, hasWriter = false }: { currentPlan?: "free" | "core" | "argo"; hasWriter?: boolean }) {
  const signedIn = currentPlan !== undefined;
  const unlocked = planAllows(currentPlan, "argo");
  const access = OFFERS.access;
  const writer = OFFERS.writer;

  const freeCta: Cta = signedIn
    ? { label: unlocked ? "Included" : "Your plan", href: "/dashboard", disabled: true }
    : { label: "Start free", href: "/signup" };
  const accessCta: Cta = unlocked
    ? { label: "Unlocked", href: "/settings/billing", disabled: true }
    : { label: `Unlock for ${formatUsd(access.amountUsd)}`, href: "/api/stripe/checkout?offer=access" };
  const writerCta: Cta = hasWriter
    ? { label: "Active", href: "/settings/billing", disabled: true }
    : signedIn && !unlocked
      ? { label: "Needs Full access", href: "/settings/billing", disabled: true }
      : { label: "Add it", href: "/api/stripe/checkout?offer=writer" };

  return (
    <div>
      <section className="grid overflow-hidden rounded-[8px] bg-ink text-on-ink shadow-[0_40px_90px_-40px_oklch(0.2_0.025_215/0.6)] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="flex flex-col p-7 md:p-10">
          <div className="flex items-center gap-2">
            <ArgoMark className="size-4 text-on-ink" apex="signal" />
            <h3 className="eyebrow text-[12.5px]">{access.name}</h3>
          </div>
          <div className="mt-8 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="display text-[64px] font-bold leading-none text-signal sm:text-[84px]">{formatUsd(access.amountUsd)}</span>
            <span className="whitespace-nowrap text-[17px] font-bold text-on-ink-muted">once</span>
          </div>
          <p className="mt-5 max-w-[34ch] text-[16px] leading-snug">{access.tagline}</p>
          <dl className="readout mt-6 grid max-w-[300px] gap-2 text-[13px]">
            {[
              ["Renews", "Never"],
              ["Expires", "Never"],
            ].map(([k, v]) => (
              <div key={k} className="flex items-baseline gap-3">
                <dt className="text-on-ink-muted">{k}</dt>
                <span aria-hidden className="h-px flex-1 translate-y-[-3px] border-b border-dashed border-on-ink/25" />
                <dd className="text-signal">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-auto pt-9">
            <CtaButton cta={accessCta} variant="ink" disabledVariant="ink-outline" className="w-full sm:w-auto sm:min-w-[240px]" />
          </div>
        </div>
        <div className="border-t border-on-ink/15 p-7 md:p-10 lg:border-l lg:border-t-0">
          <p className="eyebrow text-on-ink-muted">Everything in the bank</p>
          <ul className="mt-6 grid gap-x-8 gap-y-4 sm:grid-cols-2">
            {access.features.map((f) => (
              <li key={f} className="flex gap-2.5 text-[15px] leading-snug">
                <Check className="mt-0.5 size-4 shrink-0 text-signal" strokeWidth={3} />
                <span className="text-on-ink/90">{f}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="mt-10 border-t-2 border-text">
        <Row
          label="Free"
          price="$0"
          per="forever"
          body={`Try it properly first: ${inSentence(FREE_FEATURES)}.`}
          cta={freeCta}
        />
        <Row
          label="Add-on"
          price={formatUsd(writer.amountUsd)}
          per="a month"
          body={`${writer.name}: ${writer.tagline.charAt(0).toLowerCase()}${writer.tagline.slice(1)} Optional, on top of Full access. Cancel anytime.`}
          cta={writerCta}
        />
      </div>
      <p className="mt-6 text-[13.5px] text-muted">
        Prices in USD. Full access is one payment; only the optional add-on renews monthly.{" "}
        <Link href="/refunds" className="font-semibold text-text underline-offset-2 hover:underline">
          Refund policy
        </Link>
      </p>
    </div>
  );
}

// ["The Daily Challenge", "Basic stats"] -> "the Daily Challenge and basic stats"
function inSentence(items: readonly string[]) {
  const parts = items.map((f) => f.charAt(0).toLowerCase() + f.slice(1));
  return parts.length > 1 ? `${parts.slice(0, -1).join(", ")} and ${parts.at(-1)}` : (parts[0] ?? "");
}

function Row({ label, price, per, body, cta }: { label: string; price: string; per: string; body: string; cta: Cta }) {
  return (
    <div className="grid items-center gap-x-8 gap-y-3 border-b border-border py-6 md:grid-cols-[110px_190px_minmax(0,1fr)_auto]">
      <p className="eyebrow text-brand-strong">{label}</p>
      <p className="flex items-baseline gap-2">
        <span className="display text-[30px] font-bold leading-none">{price}</span>
        <span className="text-[14px] font-bold text-muted">{per}</span>
      </p>
      <p className="max-w-[62ch] text-[15px] leading-snug text-muted">{body}</p>
      <CtaButton cta={cta} variant="secondary" disabledVariant="secondary" arrow className="justify-self-start md:justify-self-end" />
    </div>
  );
}

function CtaButton({
  cta,
  variant,
  disabledVariant,
  arrow,
  className,
}: {
  cta: Cta;
  variant: "ink" | "secondary";
  disabledVariant: "ink-outline" | "secondary";
  arrow?: boolean;
  className?: string;
}) {
  if (cta.disabled)
    return (
      <Button variant={disabledVariant} size="lg" className={className} disabled>
        {cta.label}
      </Button>
    );
  const label = (
    <>
      {cta.label}
      {arrow && <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />}
    </>
  );
  return (
    <Button asChild variant={variant} size="lg" className={cn("group", className)}>
      {/* Checkout is a route handler that redirects to Stripe: use a full navigation. */}
      {cta.href.startsWith("/api/") ? (
        <a href={cta.href}>{label}</a>
      ) : (
        <Link href={cta.href} prefetch={false}>
          {label}
        </Link>
      )}
    </Button>
  );
}
