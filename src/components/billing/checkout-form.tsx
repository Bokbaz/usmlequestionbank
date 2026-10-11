"use client";

import { Component, useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { OFFERS, formatUsd, type OfferKey } from "@/lib/plans";

const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = key ? loadStripe(key) : null;

class PaymentBoundary extends Component<{ children: ReactNode; retry: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <div role="alert" className="p-6"><p className="text-[14px] text-muted">The payment form could not load. Check your connection and try again.</p><Button onClick={this.props.retry} className="mt-4">Try again</Button></div> : this.props.children; }
}

export function CheckoutForm({ offer, unlocked, email, configured, writerAvailable }: { offer: OfferKey; unlocked: boolean; email: string; configured: boolean; writerAvailable: boolean }) {
  const [includeWriter, setIncludeWriter] = useState(offer === "writer");
  const [attempt, setAttempt] = useState(0);
  return <div>
    <p className="mb-5 break-words text-[13px] text-muted">Your access will be saved to <strong className="font-semibold text-text">{email}</strong>.</p>
    {offer === "access" && writerAvailable && <label className="mb-6 flex cursor-pointer items-start gap-3 rounded-[6px] border border-border bg-surface p-4">
      <input type="checkbox" checked={includeWriter} onChange={(e) => setIncludeWriter(e.target.checked)} className="mt-1 size-4 shrink-0 accent-brand" />
      <span><span className="block text-[14px] font-semibold">Add ARGO Question Generator</span><span className="mt-1 block text-[13px] text-muted">{formatUsd(OFFERS.writer.amountUsd)}/month. Optional. Cancel anytime; lifetime access stays yours.</span></span>
    </label>}
    {offer === "writer" && !writerAvailable ? <div className="rounded-[8px] border border-border bg-surface p-6" role="status"><p className="font-semibold">ARGO Question Generator is being set up.</p><p className="mt-2 text-[14px] text-muted">You can get lifetime QBank access now and add the generator when it opens.</p><Button asChild className="mt-4"><Link href="/checkout?offer=access">Get lifetime access</Link></Button></div> : configured && stripePromise ? <div className="overflow-hidden rounded-[8px] border border-border bg-[#f8fafb]">
      <PaymentBoundary key={`${includeWriter}-${attempt}`} retry={() => setAttempt((n) => n + 1)}>
        <EmbeddedPayment offer={offer} includeWriter={includeWriter} retry={() => setAttempt((n) => n + 1)} />
      </PaymentBoundary>
    </div> : <div className="rounded-[8px] border border-border bg-surface p-6" role="status"><p className="font-semibold">Checkout is being set up.</p><p className="mt-2 text-[14px] text-muted">Please check back shortly. Your selected products will be here.</p></div>}
    {includeWriter && !unlocked && <p className="mt-4 text-[13px] text-muted">Due today: {formatUsd(OFFERS.access.amountUsd + OFFERS.writer.amountUsd)} before any discount. After today, only {formatUsd(OFFERS.writer.amountUsd)}/month renews.</p>}
  </div>;
}

function EmbeddedPayment({ offer, includeWriter, retry }: { offer: OfferKey; includeWriter: boolean; retry: () => void }) {
  const router = useRouter();
  const requestId = useRef<string | null>(null);
  const sessionId = useRef<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fetchClientSecret = useCallback(async () => {
    requestId.current ??= crypto.randomUUID();
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ offer, includeWriter, requestId: requestId.current }) });
      const data = await res.json();
      if (data.redirect) { router.replace(data.redirect); throw new Error("Opening billing settings…"); }
      if (!res.ok || !data.clientSecret) throw new Error(data.error ?? "Checkout couldn't load.");
      sessionId.current = data.sessionId;
      return data.clientSecret as string;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Check your connection and try again.");
      throw e;
    }
  }, [offer, includeWriter, router]);
  const options = useMemo(() => ({ fetchClientSecret, onComplete: () => { if (sessionId.current) router.replace(`/checkout/return?session_id=${encodeURIComponent(sessionId.current)}`); } }), [fetchClientSecret, router]);
  if (error) return <div role="alert" className="p-6"><p className="text-[14px] text-incorrect">{error}</p><Button onClick={retry} className="mt-4">Try again</Button></div>;
  return <EmbeddedCheckoutProvider stripe={stripePromise} options={options}><EmbeddedCheckout className="min-h-[360px]" /></EmbeddedCheckoutProvider>;
}
