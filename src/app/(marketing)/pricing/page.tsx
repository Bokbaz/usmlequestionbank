import type { Metadata } from "next";
import { SiteHeader } from "@/components/marketing/site-header";
import { PricingTable } from "@/components/marketing/pricing-table";
import { Faq } from "@/components/marketing/faq";
import { getProfile, effectivePlan } from "@/lib/auth";
import { writerAddonActive } from "@/lib/billing";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Pricing" };

export default async function PricingPage() {
  const profile = await getProfile();
  const hasWriter = profile ? await writerAddonActive(await createClient(), profile.id) : false;
  return (
    <>
      <SiteHeader overHero={false} />
      <main className="bg-bg pt-16">
        <section className="mx-auto max-w-[1320px] px-5 pb-24 pt-16 md:px-8 md:pt-20">
          <div className="grid gap-6 border-b-2 border-text pb-10 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-8">
              <p className="eyebrow text-brand-strong">Pricing</p>
              <h1 className="display mt-6 text-[clamp(40px,5.6vw,84px)] font-bold">Pay once. Get everything.</h1>
            </div>
            <p className="max-w-[40ch] text-[18px] leading-relaxed text-muted lg:col-span-4">
              $48 unlocks every question, the full Library and all of ARGO. No subscription, no expiry date. Add question
              writing for $4.99 a month if you want new questions built around your misses.
            </p>
          </div>
          <div className="mt-16">
            <PricingTable currentPlan={profile ? effectivePlan(profile) : undefined} hasWriter={hasWriter} />
          </div>
        </section>
        <section className="border-t border-border bg-surface">
          <div className="mx-auto grid max-w-[1320px] gap-12 px-5 py-24 md:px-8 lg:grid-cols-12">
            <h2 className="display text-[clamp(32px,3.6vw,52px)] font-bold lg:col-span-4">Straight answers.</h2>
            <div className="lg:col-span-8">
              <Faq />
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
