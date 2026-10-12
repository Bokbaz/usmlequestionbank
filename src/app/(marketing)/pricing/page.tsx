import type { Metadata } from "next";
import Link from "next/link";
import { Check, Minus } from "lucide-react";
import { Breadcrumbs, Container, ContentPage, FactSheet, Section } from "@/components/marketing/content";
import { Faq, PRODUCT_FAQ } from "@/components/marketing/faq";
import { CountUp, PriceBoard, type BoardRow } from "@/components/marketing/price-board";
import { PricingTableLive } from "@/components/marketing/pricing-table-live";
import { JsonLd } from "@/components/seo/json-ld";
import { REFUND_DAYS, REFUND_MAX_ANSWERED } from "@/lib/legal";
import { OFFERS, formatUsd } from "@/lib/plans";
import { CHECKED, COMPETITORS } from "@/lib/public/competitors";
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

  const boardRows: BoardRow[] = [
    { key: "argonaut", name: "Argonaut", usd: OFFERS.access.amountUsd, label: "Both exams. Forever.", argonaut: true },
    ...COMPETITORS.map((c) => ({ key: c.key, name: c.name, usd: c.headline.usd, label: c.headline.label })),
  ];
  type Fact = { label: string; sub: string; to?: number; prefix?: string; suffix?: string; text?: string };
  const facts: Fact[] = [
    stats
      ? { to: stats.publicQuestions, label: "free questions", sub: "Full explanations. No card, no account." }
      : { text: "Free", label: "questions to start", sub: "Full explanations. No card, no account." },
    stats
      ? { to: stats.total, label: "questions in the bank", sub: "Step 1 and Step 2 CK, one payment." }
      : { text: "All", label: "questions in the bank", sub: "Step 1 and Step 2 CK, one payment." },
    { to: 1, label: "payment, ever", sub: "Lifetime access. Full access never renews." },
    { to: REFUND_DAYS, suffix: " days", label: "full refund", sub: `Not for you? Email us within ${REFUND_DAYS} days, under ${REFUND_MAX_ANSWERED} questions answered.` },
  ];

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
      <section className="bg-ink text-on-ink">
        <Container className="pb-16 pt-8 md:pb-24 md:pt-12">
          <Breadcrumbs items={crumbs} className="[&_a:hover]:text-on-ink [&_ol]:text-on-ink-muted [&_span]:text-on-ink" />
          <p className="eyebrow mt-10 text-signal">USMLE question bank pricing</p>
          <h1 className="display mt-5 text-[clamp(44px,7vw,104px)] font-bold">
            Pay once. <span className="text-signal">Own it for life.</span>
          </h1>
          <p className="mt-5 max-w-[52ch] text-[18px] leading-relaxed text-on-ink-muted">
            Step 1 and Step 2 CK, every question, all of ARGO. No subscription, no clock, no renewals.
          </p>
          <div className="mt-12 md:mt-16">
            <PriceBoard rows={boardRows} checked={CHECKED} compareHref="/guides/usmle-question-bank-comparison" />
          </div>
        </Container>
      </section>

      <section className="border-b border-border bg-surface">
        <Container className="grid gap-px overflow-hidden py-0 sm:grid-cols-2 lg:grid-cols-4">
          {facts.map((f) => (
            <div key={f.label} className="border-b border-border py-10 sm:px-6 lg:border-b-0 lg:border-r lg:last:border-r-0 lg:first:pl-0">
              <p className="display text-[clamp(48px,5vw,72px)] font-bold text-brand-strong">
                {f.text ?? <CountUp to={f.to!} prefix={f.prefix} suffix={f.suffix} className="font-display tracking-[-0.04em]" />}
              </p>
              <p className="mt-3 text-[17px] font-bold leading-snug">{f.label}</p>
              <p className="mt-1 text-[14.5px] leading-snug text-muted">{f.sub}</p>
            </div>
          ))}
        </Container>
      </section>

      <section className="bg-bg">
        <Container className="py-20 md:py-28">
          <p className="display max-w-[18ch] text-[clamp(36px,5.2vw,76px)] font-bold">
            Exam-standard questions. <span className="text-brand-strong">Not exam-standard prices.</span>
          </p>
          <p className="mt-6 max-w-[56ch] text-[18px] leading-relaxed text-muted">
            Education shouldn&apos;t be gatekept. Every question is written to the NBME Item-Writing Guide and approved by a clinician, at a price a
            student can actually pay.{" "}
            <Link href="/editorial-policy" className="font-semibold text-text underline underline-offset-2">
              How we write questions
            </Link>
          </p>
          <div className="mt-14">
            <PricingTableLive />
          </div>
        </Container>
      </section>

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
