"use client";

import { Component, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { CheckoutElementsProvider, ExpressCheckoutElement, PaymentElement, useCheckoutElements } from "@stripe/react-stripe-js/checkout";
import { loadStripe, type StripeExpressCheckoutElementConfirmEvent } from "@stripe/stripe-js";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckoutSummary } from "@/components/billing/checkout-summary";
import { checkoutAppearance, type CheckoutTheme } from "@/lib/checkout-appearance";
import { OFFERS, formatUsd, type OfferKey } from "@/lib/plans";

const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = key ? loadStripe(key) : null;

class PaymentBoundary extends Component<{ children: ReactNode; summary: ReactNode; retry: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed ? <>{this.props.summary}<PaymentError message="The payment form could not load. Check your connection and try again." retry={this.props.retry} /></> : this.props.children;
  }
}

function PaymentError({ message, retry }: { message: string; retry: () => void }) {
  return <div role="alert" className="p-6"><p className="text-[14px] text-incorrect">{message}</p><Button onClick={retry} className="mt-4">Try again</Button></div>;
}

function PaymentLoading() {
  return <div role="status" className="min-h-[300px] px-5 py-6 sm:px-7">
    <span className="sr-only">Loading secure checkout…</span>
    <div aria-hidden className="grid gap-5 motion-safe:animate-pulse">
      <div className="h-11 rounded-[4px] bg-panel" />
      <div className="h-4 w-28 rounded-[4px] bg-panel" />
      <div className="h-24 rounded-[4px] border border-border bg-panel" />
      <div className="h-11 rounded-[4px] bg-panel" />
    </div>
  </div>;
}

export function CheckoutForm({ offer, unlocked, email, configured, writerAvailable }: { offer: OfferKey; unlocked: boolean; email: string; configured: boolean; writerAvailable: boolean }) {
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme === "dark" ? "dark" : resolvedTheme === "light" ? "light" : null;
  const [includeWriter, setIncludeWriter] = useState(offer === "writer");
  const includesWriter = offer === "writer" || (writerAvailable && includeWriter);
  const [attempt, setAttempt] = useState(0);
  const summary = <CheckoutSummary includesAccess={!unlocked} includesWriter={includesWriter} />;
  const retry = () => setAttempt((n) => n + 1);

  return <div>
    <p className="mb-5 break-words text-[13px] text-muted">Your access will be saved to <strong className="font-semibold text-text">{email}</strong>.</p>
    {offer === "access" && writerAvailable && <label className="mb-6 flex cursor-pointer items-start gap-3 rounded-[6px] border border-border bg-surface p-4">
      <input type="checkbox" checked={includeWriter} onChange={(e) => setIncludeWriter(e.target.checked)} className="mt-1 size-4 shrink-0 accent-brand" />
      <span><span className="block text-[14px] font-semibold">Add ARGO Question Generator</span><span className="mt-1 block text-[13px] text-muted">{formatUsd(OFFERS.writer.amountUsd)}/month. Optional. Cancel anytime; lifetime access stays yours.</span></span>
    </label>}
    {offer === "writer" && !writerAvailable ? <div className="rounded-[8px] border border-border bg-surface p-6" role="status"><p className="font-semibold">ARGO Question Generator is being set up.</p><p className="mt-2 text-[14px] text-muted">You can get lifetime QBank access now and add the generator when it opens.</p><Button asChild className="mt-4"><Link href="/checkout?offer=access">Get lifetime access</Link></Button></div> : configured && stripePromise ? <div className="overflow-hidden rounded-[8px] border border-border bg-surface">
      {theme ? <PaymentBoundary key={`${offer}-${includesWriter}-${attempt}`} summary={summary} retry={retry}>
        <EmbeddedPayment offer={offer} includesAccess={!unlocked} includeWriter={includesWriter} theme={theme} email={email} retry={retry} />
      </PaymentBoundary> : <>{summary}<PaymentLoading /></>}
    </div> : <div className="rounded-[8px] border border-border bg-surface p-6" role="status"><p className="font-semibold">Checkout is being set up.</p><p className="mt-2 text-[14px] text-muted">Please check back shortly. Your selected products will be here.</p></div>}
  </div>;
}

function EmbeddedPayment({ offer, includesAccess, includeWriter, theme, email, retry }: { offer: OfferKey; includesAccess: boolean; includeWriter: boolean; theme: CheckoutTheme; email: string; retry: () => void }) {
  const router = useRouter();
  const requestId = useRef<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    requestId.current ??= crypto.randomUUID();
    async function openCheckout() {
      try {
        const res = await fetch("/api/stripe/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ offer, includeWriter, requestId: requestId.current }) });
        const data = await res.json();
        if (cancelled) return;
        if (data.redirect) { router.replace(data.redirect); return; }
        if (!res.ok || !data.clientSecret) throw new Error(data.error ?? "Checkout couldn't load.");
        setClientSecret(data.clientSecret);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Check your connection and try again.");
      }
    }
    void openCheckout();
    return () => { cancelled = true; };
  }, [offer, includeWriter, router]);

  const options = useMemo(() => ({ clientSecret: clientSecret ?? "", elementsOptions: { appearance: checkoutAppearance(theme) } }), [clientSecret, theme]);
  if (!clientSecret || error) return <>
    <CheckoutSummary includesAccess={includesAccess} includesWriter={includeWriter} />
    {error ? <PaymentError message={error} retry={retry} /> : <PaymentLoading />}
  </>;
  return <CheckoutElementsProvider stripe={stripePromise} options={options}>
    <PaymentDetails includesAccess={includesAccess} includesWriter={includeWriter} email={email} retry={retry} />
  </CheckoutElementsProvider>;
}

function PaymentDetails({ includesAccess, includesWriter, email, retry }: { includesAccess: boolean; includesWriter: boolean; email: string; retry: () => void }) {
  const state = useCheckoutElements();
  const router = useRouter();
  const [walletsAvailable, setWalletsAvailable] = useState(false);
  const [pending, setPending] = useState<"payment" | "promotion" | null>(null);
  const busy = useRef(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [promotionCode, setPromotionCode] = useState("");
  const [promotionError, setPromotionError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const summary = <CheckoutSummary includesAccess={includesAccess} includesWriter={includesWriter} session={state.type === "success" ? state.checkout : undefined} />;

  if (state.type === "error" || loadError) return <>{summary}<PaymentError message={loadError ?? (state.type === "error" ? state.error.message : "Checkout couldn't load.")} retry={retry} /></>;
  if (state.type === "loading") return <>{summary}<PaymentLoading /></>;
  const checkout = state.checkout;

  async function pay(event?: StripeExpressCheckoutElementConfirmEvent) {
    if (busy.current) return;
    busy.current = true;
    setPending("payment");
    setPaymentError(null);
    try {
      const returnPath = `/checkout/return?session_id=${encodeURIComponent(checkout.id)}`;
      const result = await checkout.confirm({ ...(checkout.email ? {} : { email }), redirect: "if_required", ...(event ? { expressCheckoutConfirmEvent: event } : {}) });
      if (result.type === "error") setPaymentError(result.error.message);
      else router.replace(returnPath);
    } catch (e) {
      setPaymentError(e instanceof Error ? e.message : "Payment couldn't complete. Please try again.");
    } finally {
      busy.current = false;
      setPending(null);
    }
  }

  async function updatePromotion(remove = false) {
    if (busy.current) return;
    busy.current = true;
    setPending("promotion");
    setPromotionError(null);
    try {
      const result = remove ? await checkout.removePromotionCode() : await checkout.applyPromotionCode(promotionCode.trim());
      if (result.type === "error") setPromotionError(result.error.message);
      else setPromotionCode("");
    } catch (e) {
      setPromotionError(e instanceof Error ? e.message : "The promotion code couldn't be applied. Please try again.");
    } finally {
      busy.current = false;
      setPending(null);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void pay();
  }

  const appliedPromotion = checkout.discountAmounts?.find((discount) => discount.promotionCode);
  return <>
    {summary}
    <div className="px-5 py-6 sm:px-7">
      <ExpressCheckoutElement onReady={({ availablePaymentMethods }) => setWalletsAvailable(Object.values(availablePaymentMethods ?? {}).some(Boolean))} onConfirm={(event) => { void pay(event); }} onLoadError={() => setWalletsAvailable(false)} />
      {walletsAvailable && <div className="my-5 flex items-center gap-3 text-[12px] text-muted"><span className="h-px flex-1 bg-border" />Or pay below<span className="h-px flex-1 bg-border" /></div>}
      <PaymentElement options={{ layout: "tabs" }} onLoadError={({ error }) => setLoadError(error.message ?? "The payment form could not load.")} />
      <div className="mt-5 border-t border-border pt-4">
        {appliedPromotion ? <div className="flex flex-wrap items-center justify-between gap-2 text-[13px]"><span className="text-brand-strong">Promotion code applied</span><Button type="button" variant="ghost" size="sm" onClick={() => { void updatePromotion(true); }} disabled={pending !== null}>Remove</Button></div> : <details>
          <summary className="cursor-pointer text-[13px] font-semibold text-brand-strong">Add a promotion code</summary>
          <form className="mt-3 flex gap-2" onSubmit={(event) => { event.preventDefault(); void updatePromotion(); }}>
            <Input aria-label="Promotion code" value={promotionCode} onChange={(event) => setPromotionCode(event.target.value)} disabled={pending !== null} autoComplete="off" placeholder="Enter code" />
            <Button type="submit" variant="secondary" className="h-10" loading={pending === "promotion"} disabled={!promotionCode.trim() || pending !== null}>Apply</Button>
          </form>
        </details>}
        {promotionError && <p role="alert" className="mt-2 text-[13px] text-incorrect">{promotionError}</p>}
      </div>
      <form onSubmit={submit} className="mt-5">
        {paymentError && <p role="alert" className="mb-3 text-[14px] text-incorrect">{paymentError}</p>}
        <Button type="submit" size="xl" className="w-full" loading={pending === "payment"} disabled={pending !== null || !checkout.canConfirm}>Pay {checkout.total.total.amount}</Button>
      </form>
      <p className="mt-4 text-[12px] leading-relaxed text-muted">By purchasing, you agree to our <Link href="/terms" className="underline underline-offset-2">Terms</Link> and request immediate access. <Link href="/refunds" className="underline underline-offset-2">Refund policy</Link>.</p>
    </div>
  </>;
}
