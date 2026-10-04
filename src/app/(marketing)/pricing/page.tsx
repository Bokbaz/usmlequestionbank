import type { Metadata } from "next";
import { SiteHeader } from "@/components/marketing/site-header";
import { PricingTable } from "@/components/marketing/pricing-table";
import { Faq } from "@/components/marketing/faq";
import { getProfile, effectivePlan } from "@/lib/auth";

export const metadata: Metadata = { title: "Pricing" };

export default async function PricingPage() {
  const profile = await getProfile();
  return (
    <>
      <SiteHeader overInk={false} />
      <main className="bg-bg pt-16">
        <section className="mx-auto max-w-[1240px] px-5 pb-24 pt-20 md:px-8">
          <div className="mx-auto max-w-[760px] text-center">
            <p className="eyebrow text-brand">Pricing</p>
            <h1 className="display mt-5 text-[clamp(40px,5.4vw,76px)] font-[800]">Pay for the bank. Or let ARGO run your prep.</h1>
            <p className="mx-auto mt-6 max-w-[54ch] text-[17px] leading-relaxed text-muted">
              Every plan includes the Daily Challenge. QBank unlocks every question and the full Library; ARGO adds the
              adaptive engine and deep analytics.
            </p>
          </div>
          <div className="mt-14">
            <PricingTable currentPlan={profile ? effectivePlan(profile) : undefined} />
          </div>
        </section>
        <section className="border-t border-border bg-surface">
          <div className="mx-auto max-w-[900px] px-5 py-20 md:px-8">
            <Faq />
          </div>
        </section>
      </main>
    </>
  );
}
