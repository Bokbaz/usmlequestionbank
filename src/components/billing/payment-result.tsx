"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SUPPORT_EMAIL } from "@/lib/utils";

type Status = "checking" | "ready" | "processing" | "pending" | "open" | "expired" | "revoked" | "error";

export function PaymentResult({ sessionId }: { sessionId: string }) {
  const [status, setStatus] = useState<Status>("checking");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    let polls = 0;
    async function check() {
      try {
        const response = await fetch(`/api/stripe/status?session_id=${encodeURIComponent(sessionId)}`, { cache: "no-store", signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        if (controller.signal.aborted) return;
        setStatus(data.status);
        if (["processing", "checking", "pending"].includes(data.status) && ++polls < 20) timer = setTimeout(check, 2000);
      } catch { if (!controller.signal.aborted) setStatus("error"); }
    }
    check();
    return () => { controller.abort(); clearTimeout(timer); };
  }, [sessionId, attempt]);
  const ready = status === "ready";
  const copy: Record<Status, [string, string]> = {
    checking: ["Checking your payment", "This usually takes a few seconds."],
    ready: ["You're ready to study.", "Your purchase is confirmed and your access is active."],
    processing: ["Payment confirmed. Activating access.", "Your license is being saved. You can safely close this page; it will appear in Billing."],
    pending: ["Your payment is processing.", "Your payment method is still confirming the payment. Access activates as soon as it succeeds. Please don't pay again."],
    open: ["Your checkout is still open.", "Your purchase hasn't been completed. Return to checkout to finish."],
    expired: ["This checkout has expired.", "Start a new checkout to complete your purchase."],
    revoked: ["This purchase is no longer active.", "Check Billing for your current licenses and payment history."],
    error: ["We couldn't check your payment.", "Try again, or open Billing to check your access. Please don't pay again if you were already charged."],
  };
  return <div className="mx-auto max-w-[600px] py-8 text-center" aria-live="polite">
    {ready ? <CheckCircle2 className="mx-auto size-10 text-correct" aria-hidden /> : <Clock3 className="mx-auto size-10 text-brand-strong" aria-hidden />}
    <h1 className="heading mt-6 text-[32px] font-bold">{copy[status][0]}</h1>
    <p className="mx-auto mt-4 max-w-[52ch] text-[15px] text-muted">{copy[status][1]}</p>
    <div className="mt-8 flex flex-wrap justify-center gap-3">
      {ready && <Button asChild size="lg"><Link href="/qbank">Start practicing</Link></Button>}
      {["open", "expired"].includes(status) && <Button asChild><Link href="/checkout?offer=access">Return to checkout</Link></Button>}
      {["processing", "pending", "error"].includes(status) && <Button variant="secondary" onClick={() => setAttempt((n) => n + 1)}>Check again</Button>}
      <Button asChild variant="secondary"><Link href="/settings/billing">View billing</Link></Button>
    </div>
    <p className="mt-7 text-[13px] text-muted">Need help? <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold text-brand-strong hover:underline">{SUPPORT_EMAIL}</a></p>
  </div>;
}
