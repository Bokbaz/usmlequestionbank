"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function SubscriptionControls({ subscriptionId, cancelAtPeriodEnd, ends }: { subscriptionId: string; cancelAtPeriodEnd: boolean; ends: string }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [canceled, setCanceled] = useState(cancelAtPeriodEnd);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  function update(cancel: boolean) {
    setError(null);
    start(async () => {
      try {
        const response = await fetch("/api/stripe/subscription", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subscriptionId, cancel }) });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        setCanceled(data.cancelAtPeriodEnd);
        setConfirm(false);
        router.refresh();
      } catch (e) { setError(e instanceof Error ? e.message : "Couldn't update subscription."); }
    });
  }
  return <div className="text-[13px]">
    {confirm ? <div className="rounded-[6px] border border-border bg-panel p-4">
      <p className="max-w-[46ch]">Stop ARGO renewals? You keep the generator until {ends}. Your lifetime QBank access continues.</p>
      <div className="mt-3 flex flex-wrap gap-2"><Button size="sm" variant="secondary" onClick={() => setConfirm(false)} disabled={pending}>Keep subscription</Button><Button size="sm" variant="danger" loading={pending} onClick={() => update(true)}>Stop renewals</Button></div>
    </div> : canceled ? <div><p className="mb-2 text-muted" role="status">Renewal stopped. Access ends {ends}.</p><Button size="sm" variant="secondary" loading={pending} onClick={() => update(false)}>Resume subscription</Button></div> : <Button size="sm" variant="ghost" onClick={() => setConfirm(true)}>Cancel subscription</Button>}
    {error && <p role="alert" className="mt-3 max-w-[46ch] text-incorrect">{error}</p>}
  </div>;
}
