import type { Metadata } from "next";
import Link from "next/link";
import { Check, Minus } from "lucide-react";
import { Breadcrumbs, Container, ContentPage, FactSheet, Section } from "@/components/marketing/content";
import { Faq, PRODUCT_FAQ } from "@/components/marketing/faq";
import { PricingTableLive } from "@/components/marketing/pricing-table-live";
import { JsonLd } from "@/components/seo/json-ld";
import { REFUND_DAYS, REFUND_MAX_ANSWERED } from "@/lib/legal";
import { OFFERS, formatUsd } from "@/lib/plans";
import { getBankStats } from "@/lib/public/content";
import { pageMetadata } from "@/lib/seo/metadata";
import { breadcrumbs, faqPage, fullAccessProduct, webPage, writerAddonProduct } from "@/lib/seo/schema";

export const revalidate = 3600;

const TITLE = "Argonaut USMLE Pricing | $48 One-Time Access";
const DESCRIPTION =
  "Compare Argonaut's free plan, $48 one-time Full access and the optional $4.99/month question-writing add-on: what's included, access terms and refunds.";

export const metadata: Metadata = pageMetadata({ title: { absolute: TITLE }, description: DESCRIPTION, path: "/pricing" });

const PRICING_FAQ = PRODUCT_FAQ.filter((f) =>
  ["Is it a subscription?", "What does the question-writing add-on do?", "Can I get a refund?", "Which exams do you cover?", "How is this different from the big question banks?", "How do I reach you?"].includes(f.q),
);

type Cell = boolean | string;

export default async function PricingPage() {
  const stats = await getBankStats().catch(() => null);
  const access = formatUsd(OFFERS.access.amountUsd);
  const writer = formatUsd(OFFERS.writer.amountUsd);
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Pricing", path: "/pricing" },
  ];
  const n = (x?: number) => (x == null ? "" : x.toLocaleString("en-US"));

  // What each option includes, in plain rows (audit A14: limits, duration and add-ons in one place).
  const rows: [string, Cell, Cell][] = [
    ["Exams", "Step 1 and Step 2 CK samples", "Step 1 and Step 2 CK, in full"],
    [
      "Questions",
      stats ? `${n(stats.publicQuestions)} free questions with full explanations` : "Free questions with full explanations",
      stats ? `All ${n(stats.total)} (${n(stats.exams.step1.total)} Step 1, ${n(stats.exams.step2ck.total)} Step 2 CK)` : "Every question",
    ],
    ["Account needed", "No for free questions; a free account for stats and the leaderboard", "Yes"],
    ["Every answer choice explained", true, true],
    ["Tutor and timed modes", "On the free questions", true],
    ["Library chapters", stats ? `${n(stats.freeChapters)} free chapters` : "Free chapters", stats ? `All ${n(stats.chapters)}` : "All chapters"],
    ["Daily Challenge and leaderboard", true, true],
    ["ARGO sessions built around your weak spots", false, true],
    ["Analytics: mastery map, error types, timing, retention", "Basic stats", true],
    ["Nuggets, flashcards and notebook", false, true],
    ["ARGO question writing", false, `Optional add-on, ${writer} a month`],
    ["Price", "$0", `${access} once`],
    ["Renews", "No", "No (only the optional add-on renews monthly)"],
    ["Expires", "No", "No, for as long as Argonaut runs"],
  ];

  return (
    <ContentPage>
      <Container className="pb-24 pt-8 md:pt-12">
        <Breadcrumbs items={crumbs} />
        <div className="mt-10 grid gap-6 border-b-2 border-text pb-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <p className="eyebrow text-brand-strong">{access} once · Step 1 + Step 2 CK</p>
            <h1 className="display mt-6 text-[clamp(40px,5.6vw,84px)] font-bold">
              <span className="mb-3 block text-[0.34em] leading-tight tracking-[-0.02em] text-muted">USMLE question bank pricing</span>{" "}
              Pay once. Get everything.
            </h1>
          </div>
          <p className="max-w-[40ch] text-[18px] leading-relaxed text-muted lg:col-span-4">
            {access} unlocks every question for Step 1 and Step 2 CK, the full Library and all of ARGO. No subscription, no expiry date. Add question writing
            for {writer} a month if you want new questions built around your misses.
          </p>
        </div>
        <div className="mt-16">
          <PricingTableLive />
        </div>
      </Container>

      <Section tone="surface" eyebrow="Compare" title="What's included" intro={<p>Everything free stays free. Full access adds the rest, once.</p>}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-[14px] sm:text-[15px]">
            <caption className="sr-only">Free and Full access compared</caption>
            <thead>
              <tr className="border-b-2 border-text">
                <th scope="col" className="w-[34%] py-3 pr-3 text-[12.5px] font-semibold uppercase tracking-[0.08em] text-muted sm:w-[38%] sm:pr-4">
                  <span className="sr-only">Feature</span>
                </th>
                <th scope="col" className="py-3 pr-4 text-[17px] font-bold">Free</th>
                <th scope="col" className="py-3 text-[17px] font-bold">Full access, {access} once</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([label, free, full]) => (
                <tr key={label} className="border-b border-border align-top">
                  <th scope="row" className="py-3 pr-4 font-semibold">
                    {label}
                  </th>
                  {[free, full].map((c, i) => (
                    <td key={i} className="py-3 pr-4 text-muted">
                      {c === true ? (
                        <Check className="size-4 text-brand-strong" strokeWidth={3} aria-label="Included" />
                      ) : c === false ? (
                        <Minus className="size-4 text-faint" aria-label="Not included" />
                      ) : (
                        <span className="text-text">{c}</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section eyebrow="Access terms" title="The small print, up front">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <h3 className="text-[18px] font-bold">What &quot;lifetime access&quot; means</h3>
            <p className="mt-2 text-[16px] leading-relaxed text-muted">
              Full access has no renewal and no expiry date. It lasts for as long as Argonaut runs the service. We keep improving the product and may change
              individual features, but we won&apos;t take away the question bank and analytics you paid for while the service runs. If we ever close, you get
              at least 60 days&apos; notice by email. The{" "}
              <Link href="/terms" className="font-semibold text-text underline underline-offset-2">
                terms of service
              </Link>{" "}
              have the full wording.
            </p>
          </div>
          <div>
            <h3 className="text-[18px] font-bold">Refunds</h3>
            <p className="mt-2 text-[16px] leading-relaxed text-muted">
              Email us within {REFUND_DAYS} days of buying Full access, with fewer than {REFUND_MAX_ANSWERED} questions answered, and we refund the full{" "}
              {access}. Add-on renewals can be cancelled any time in Plan and billing. The{" "}
              <Link href="/refunds" className="font-semibold text-text underline underline-offset-2">
                refund policy
              </Link>{" "}
              covers every case.
            </p>
          </div>
          <div>
            <h3 className="text-[18px] font-bold">The add-on</h3>
            <p className="mt-2 text-[16px] leading-relaxed text-muted">
              ARGO question writing is the only part that renews: {writer} a month, sold only to Full access accounts. It writes new questions on topics where
              you&apos;ve used up the bank&apos;s questions. Cancel any time; it works until the end of the month you&apos;ve paid for.
            </p>
          </div>
          <FactSheet
            className="self-start"
            rows={[
              ["Currency", "US dollars"],
              ["Payments", "Stripe"],
              ["Full access", `${access}, charged once`],
              ["Add-on", `${writer}, monthly`],
              ["Free plan", "No card needed"],
            ]}
          />
        </div>
      </Section>

      <section className="border-t border-border bg-surface">
        <Container className="grid gap-12 py-24 lg:grid-cols-12">
          <h2 className="display text-[clamp(32px,3.6vw,52px)] font-bold lg:col-span-4">Straight answers.</h2>
          <div className="lg:col-span-8">
            <Faq items={PRICING_FAQ} />
          </div>
        </Container>
      </section>

      <JsonLd
        graph={[
          breadcrumbs(crumbs),
          webPage({ path: "/pricing", name: TITLE, description: DESCRIPTION, crumbs }),
          fullAccessProduct(stats?.total),
          writerAddonProduct(),
          faqPage("/pricing", PRICING_FAQ),
        ]}
      />
    </ContentPage>
  );
}
