import { LockKeyhole } from "lucide-react";
import type { StripeCheckoutSession } from "@stripe/stripe-js";
import { Logo } from "@/components/brand/logo";
import { OFFERS, formatUsd } from "@/lib/plans";

export function CheckoutSummary({ includesAccess, includesWriter, session }: { includesAccess: boolean; includesWriter: boolean; session?: StripeCheckoutSession }) {
  const total = (includesAccess ? OFFERS.access.amountUsd : 0) + (includesWriter ? OFFERS.writer.amountUsd : 0);
  const accessAmount = session?.lineItems.find((item) => !item.recurring)?.unitAmount.amount ?? formatUsd(OFFERS.access.amountUsd);
  const writerAmount = session?.lineItems.find((item) => item.recurring)?.unitAmount.amount ?? formatUsd(OFFERS.writer.amountUsd);
  const renewalAmount = session?.recurring?.dueNext.total.amount ?? formatUsd(OFFERS.writer.amountUsd);

  return <header className="border-b border-border px-5 py-6 sm:px-7">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Logo />
      <span className="inline-flex items-center gap-1.5 text-[12px] text-muted"><LockKeyhole className="size-3.5" aria-hidden />Secure checkout</span>
    </div>
    <h2 className="heading mt-6 text-[22px] font-semibold">Your purchase</h2>
    <dl className="mt-4 grid gap-4">
      {includesAccess && <div className="flex items-start justify-between gap-4">
        <dt className="min-w-0"><span className="block text-[14px] font-semibold">{OFFERS.access.name}</span><span className="mt-1 block text-[12px] text-muted">Full QBank, Library, ARGO sessions and analytics. Yours for life.</span></dt>
        <dd className="shrink-0 text-right"><span className="readout block text-[16px] font-semibold">{accessAmount}</span><span className="text-[12px] text-muted">once</span></dd>
      </div>}
      {includesWriter && <div className="flex items-start justify-between gap-4">
        <dt className="min-w-0"><span className="block text-[14px] font-semibold">{OFFERS.writer.name}</span><span className="mt-1 block text-[12px] text-muted">Fresh questions for your weak spots. Cancel anytime.</span></dt>
        <dd className="shrink-0 text-right"><span className="readout block text-[16px] font-semibold">{writerAmount}</span><span className="text-[12px] text-muted">per month</span></dd>
      </div>}
      {session && session.total.discount.minorUnitsAmount > 0 && <div className="flex items-baseline justify-between gap-4 text-[13px] text-brand-strong"><dt>Discount</dt><dd className="readout">−{session.total.discount.amount}</dd></div>}
      <div className="flex items-baseline justify-between gap-4 border-t border-border pt-4">
        <dt className="text-[14px] font-semibold">Due today <span className="font-normal text-muted">({session?.currency.toUpperCase() ?? "USD"})</span></dt>
        <dd className="readout text-[24px] font-semibold" aria-live="polite">{session?.total.total.amount ?? formatUsd(total)}</dd>
      </div>
    </dl>
    {!session && <p className="mt-2 text-[12px] text-muted">Before any discount. Loading your final total…</p>}
    <p className="mt-3 text-[13px] text-muted">{includesWriter
      ? `Then ${renewalAmount}/month for ARGO only. Cancel anytime.${includesAccess ? " Lifetime QBank access stays yours." : " Your existing lifetime QBank access stays yours."}`
      : "One payment. No subscription or expiry date."}</p>
  </header>;
}
