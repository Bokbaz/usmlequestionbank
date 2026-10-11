import { Suspense } from "react";
import Link from "next/link";
import { Check, LockKeyhole } from "lucide-react";
import { redirect } from "next/navigation";
import { effectivePlan, getProfile, getUser } from "@/lib/auth";
import { OFFERS, formatUsd, planAllows } from "@/lib/plans";
import { stripeConfigured } from "@/lib/stripe";
import { CheckoutForm } from "@/components/billing/checkout-form";
import { SignupForm } from "@/components/auth/auth-forms";
import { SUPPORT_EMAIL } from "@/lib/utils";
import { aiEnabled } from "@/lib/ai/client";

export const metadata = { title: "Checkout" };

export default async function CheckoutPage({ searchParams }: PageProps<"/checkout">) {
  const params = await searchParams;
  const offer = params.offer === "writer" ? "writer" : "access";
  const user = await getUser();
  const profile = user ? await getProfile() : null;
  const unlocked = planAllows(effectivePlan(profile), "argo");
  if (offer === "access" && unlocked) redirect("/settings/billing?owned=access");
  const selected = OFFERS[offer];
  const next = `/checkout?offer=${offer}`;
  return <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,6fr)] lg:gap-14">
    <section>
      <p className="eyebrow text-brand-strong">Your next step</p>
      <h1 className="heading mt-4 text-[34px] font-bold leading-[1.12] sm:text-[40px]">{offer === "access" ? "The whole bank. Yours for life." : "Turn weak spots into new questions."}</h1>
      <p className="mt-5 text-[16px] text-muted">{selected.name}</p>
      <p className="mt-2 flex items-baseline gap-2"><span className="readout text-[38px] font-bold">{formatUsd(selected.amountUsd)}</span><span className="text-[15px] text-muted">{offer === "access" ? "one payment" : "per month"}</span></p>
      {offer === "writer" && !unlocked && <p className="mt-3 text-[14px] text-muted">Includes Question Bank Lifetime Access for {formatUsd(OFFERS.access.amountUsd)} once. Then only ARGO renews monthly.</p>}
      <ul className="mt-7 hidden gap-3 border-t border-border pt-6 lg:grid">
        {selected.features.map((feature) => <li key={feature} className="flex gap-2.5 text-[14px]"><Check className="mt-0.5 size-4 shrink-0 text-brand-strong" aria-hidden />{feature}</li>)}
      </ul>
      <details className="mt-5 border-y border-border py-3 lg:hidden"><summary className="cursor-pointer text-[14px] font-semibold text-brand-strong">What&apos;s included</summary><ul className="mt-4 grid gap-3">{selected.features.map((feature) => <li key={feature} className="flex gap-2 text-[13px]"><Check className="mt-0.5 size-4 shrink-0 text-brand-strong" aria-hidden />{feature}</li>)}</ul></details>
      <p className="mt-7 hidden gap-2 text-[13px] text-muted lg:flex"><LockKeyhole className="mt-0.5 size-4 shrink-0" aria-hidden />Secure payment by Stripe. Your card details stay with Stripe.</p>
      <p className="mt-4 hidden text-[13px] text-muted lg:block"><Link href="/refunds" className="underline underline-offset-3">Refund policy</Link> · <Link href="/terms" className="underline underline-offset-3">Terms</Link> · <a href={`mailto:${SUPPORT_EMAIL}`} className="underline underline-offset-3">Need help?</a></p>
    </section>
    <section className="min-w-0" aria-label={user ? "Secure checkout" : "Create an account"}>
      {!user ? <div className="rounded-[8px] border border-border bg-surface p-6 sm:p-8"><Suspense><SignupForm nextPath={next} checkout /></Suspense></div> :
        <CheckoutForm offer={offer} unlocked={unlocked} email={user.email ?? ""} configured={stripeConfigured()} writerAvailable={aiEnabled()} />}
      <p className="mt-5 flex items-center gap-2 text-[13px] text-muted lg:hidden"><LockKeyhole className="size-4 shrink-0" aria-hidden />Secure payment by Stripe.</p>
      <p className="mt-3 text-[13px] text-muted lg:hidden"><Link href="/refunds" className="underline underline-offset-3">Refund policy</Link> · <Link href="/terms" className="underline underline-offset-3">Terms</Link> · <a href={`mailto:${SUPPORT_EMAIL}`} className="underline underline-offset-3">Need help?</a></p>
    </section>
  </div>;
}
