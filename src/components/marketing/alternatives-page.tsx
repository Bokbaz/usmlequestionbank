import Link from "next/link";
import { Check } from "lucide-react";
import { Prose, Section, SourceNote } from "@/components/marketing/content";
import { GuideShell } from "@/components/marketing/guide-shell";
import {
  BankProfile,
  Disclosure,
  InlineCta,
  MetricTable,
  QuickTable,
  argonautBank,
  argonautProsCons,
  argonautQuickRow,
  quickRows,
} from "@/components/marketing/qbank-compare";
import { ALTERNATIVES, type AlternativesPageKey } from "@/lib/public/alternatives";
import { argonautFacts } from "@/lib/public/argonaut-facts";
import { CHECKED, NBME_ITEM_WRITING_GUIDE, USMLE_CONTENT_OUTLINE, USMLE_SAMPLE_QUESTIONS, competitor } from "@/lib/public/competitors";
import { getBankStats } from "@/lib/public/content";
import { itemList } from "@/lib/seo/schema";

const LINK = "font-semibold text-text underline decoration-brand-strong decoration-2 underline-offset-4";

// "<Competitor> alternatives": why students look elsewhere, Argonaut first, the other options
// fairly, what the competitor still does best, and free options.
export async function AlternativesPage({ pageKey }: { pageKey: AlternativesPageKey }) {
  const page = ALTERNATIVES[pageKey];
  const stats = await getBankStats();
  const a = argonautFacts(stats);
  const them = competitor(page.key);
  const others = page.order.map(competitor);
  const argo = argonautProsCons(a);
  const sources = [...them.sources, ...others.flatMap((c) => c.sources), USMLE_SAMPLE_QUESTIONS, NBME_ITEM_WRITING_GUIDE, USMLE_CONTENT_OUTLINE];
  const faq = page.faq(a);
  const siblings = (["uworld", "amboss", "kaplan", "usmle-rx"] as const).filter((k) => k !== page.key).map((k) => ALTERNATIVES[k].path);

  return (
    <GuideShell
      path={page.path}
      kind="Comparison"
      summary={
        <p>
          <strong className="font-semibold text-text">Short answer:</strong> {page.summary(a)}
        </p>
      }
      faq={faq}
      cta={{
        title: `Switch from ${them.name} for ${a.price}.`,
        body: `Try ${a.free} free questions first, no account needed. Full access covers Step 1 and Step 2 CK, once, with no expiry.`,
        primary: { href: "/free-usmle-practice-questions", label: "Try free questions" },
        secondary: { href: "/pricing", label: `Get full access, ${a.price}` },
      }}
      related={["/guides/best-usmle-question-bank", ...siblings]}
      citations={sources.map((s) => s.url)}
      schema={[
        itemList(page.path, `${them.name} alternatives`, [
          { name: "Argonaut", path: "/pricing" },
          ...others.map((c) => ({ name: c.name, path: c.source })),
        ]),
      ]}
    >
      <Disclosure sources={sources} />

      <Section tone="surface" eyebrow="Why switch" title={`Why students look for a ${them.name} alternative`}>
        <ul className="grid gap-0">
          {them.leaveReasons.map((r, i) => (
            <li key={r} className="grid grid-cols-[44px_1fr] gap-2 border-t border-border py-4 text-[16.5px] leading-relaxed first:border-t-2 first:border-text">
              <span className="readout pt-0.5 text-[14px] text-brand-strong">{String(i + 1).padStart(2, "0")}</span>
              {r}
            </li>
          ))}
        </ul>
        <SourceNote className="mt-4">
          From{" "}
          <a href={them.source} target="_blank" rel="noreferrer">
            {them.name}&apos;s website
          </a>
          , checked {CHECKED}.
        </SourceNote>
      </Section>

      <Section eyebrow="At a glance" title={`${them.name} and its alternatives`} split={false}>
        <QuickTable
          rows={[...quickRows([them.key]), argonautQuickRow(a), ...quickRows(page.order)]}
          caption={`${them.name} and four alternatives compared on price, access, questions and free trials, as of ${CHECKED}`}
        />
        <SourceNote className="mt-6">
          Prices and counts as listed on each company&apos;s website, checked {CHECKED}. Counts are as advertised and include different things. Argonaut figures
          are live from our bank.
        </SourceNote>
      </Section>

      <Section tone="surface" eyebrow="The alternatives" title={`The best ${them.name} alternatives, ranked`} split={false}>
        <div className="grid gap-16">
          <BankProfile
            id="argonaut"
            rank={1}
            name="Argonaut"
            verdict={`best overall ${them.name} alternative`}
            bestFor={`Students who want exam-accurate questions and adaptive practice for both exams, without ${them.name}'s price.`}
            price={`${a.price} once for Step 1 and Step 2 CK, no expiry.`}
            pros={argo.pros}
            cons={argo.cons}
          >
            <h4 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-muted">Argonaut vs {them.name}</h4>
            <div aria-hidden className="mt-3 hidden gap-x-6 border-b-2 border-text pb-2 text-[13px] font-semibold md:grid md:grid-cols-[180px_1fr_1fr]">
              <span />
              <span>Argonaut</span>
              <span>{them.name}</span>
            </div>
            <dl className="grid border-t border-border text-[15.5px] leading-relaxed md:border-t-0">
              {[
                ["Price", a.metrics.price, them.metrics.price],
                ["How questions are made", a.metrics.accuracy, them.metrics.accuracy],
                ["Who picks your next questions", a.metrics.adaptive, them.metrics.adaptive],
                ["Free to try", a.metrics.free, them.metrics.free],
              ].map(([k, ours, theirs]) => (
                <div key={k} className="grid gap-x-6 gap-y-1 border-b border-border py-3 md:grid-cols-[180px_1fr_1fr]">
                  <dt className="font-semibold">{k}</dt>
                  <dd>
                    <span className="font-semibold md:sr-only">Argonaut: </span>
                    {ours}
                  </dd>
                  <dd className="text-muted">
                    <span className="font-semibold text-text md:sr-only">{them.name}: </span>
                    {theirs}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-[14px] text-muted">
              More detail: <Link href="/editorial-policy" className={LINK}>editorial policy</Link> ·{" "}
              <Link href="/features/argo" className={LINK}>how ARGO works</Link>
            </p>
            <div className="mt-8">
              <InlineCta a={a} />
            </div>
          </BankProfile>
          {others.map((c, i) => (
            <BankProfile
              key={c.key}
              id={c.key}
              rank={i + 2}
              name={c.name}
              bestFor={c.bestFor}
              price={`${c.price}.`}
              pros={c.pros}
              cons={c.cons}
              source={c.sources[0]}
            />
          ))}
        </div>
      </Section>

      <Section eyebrow="Side by side" title="Six metrics compared" split={false}>
        <MetricTable
          banks={[argonautBank(a), { ...them }, ...others.map((c) => ({ ...c }))]}
          leaders={{ accuracy: "argonaut", price: "argonaut", questions: "uworld", free: "argonaut", adaptive: "argonaut", updates: "argonaut" }}
          caption={`${them.name} and its alternatives compared on six metrics, as of ${CHECKED}`}
        />
        <p className="mt-6 max-w-[68ch] text-[15.5px] leading-relaxed text-muted">
          How we compare each metric, and why, is in{" "}
          <Link href="/guides/best-usmle-question-bank" className={LINK}>
            the best USMLE question bank in 2026
          </Link>
          .
        </p>
      </Section>

      <Section tone="surface" eyebrow="To be fair" title={`What ${them.name} still does best`}>
        <ul className="grid gap-3 text-[16.5px] leading-relaxed">
          {them.pros.map((p) => (
            <li key={p} className="flex gap-3">
              <Check aria-hidden className="mt-1.5 size-4 shrink-0 text-faint" strokeWidth={3} />
              {p}
            </li>
          ))}
        </ul>
        <p className="mt-6 max-w-[64ch] text-[16.5px] leading-relaxed">{page.stay}</p>
      </Section>

      <Section eyebrow="Free options" title={`Free ${them.name} alternatives`}>
        <Prose>
          <p>No free resource replaces a full bank, but these cost nothing and don&apos;t expire:</p>
          <ul>
            <li>
              <Link href="/free-usmle-practice-questions">{a.free} free Argonaut questions</Link>, Step 1 and Step 2 CK, with every answer choice explained.
              No account needed.
            </li>
            <li>
              <Link href="/library">{a.freeChapters} free high-yield Library chapters</Link> and the <Link href="/daily">Daily USMLE Challenge</Link>.
            </li>
            <li>
              The USMLE program&apos;s own{" "}
              <a href={USMLE_SAMPLE_QUESTIONS.url} target="_blank" rel="noreferrer">
                sample test questions
              </a>{" "}
              on usmle.org: the best benchmark for any bank&apos;s style.
            </li>
          </ul>
        </Prose>
      </Section>

      <Section tone="surface" eyebrow="Switching" title={`How to switch from ${them.name}`}>
        <Prose>
          <ol>
            <li>
              <strong>Try before you pay.</strong> Answer a block of <Link href="/free-usmle-step-1-questions">free Step 1</Link> or{" "}
              <Link href="/free-usmle-step-2-ck-questions">Step 2 CK</Link> questions and compare the vignettes and explanations with {them.name}&apos;s.
            </li>
            <li>
              <strong>Keep your notes.</strong> Your error log and flashcards move with you; the review method in{" "}
              <Link href="/guides/how-to-review-usmle-questions">how to review USMLE questions</Link> works in any bank.
            </li>
            <li>
              <strong>Let ARGO find your gaps.</strong> Your first sessions scout the high-weight systems; after a few hundred answers ARGO targets your
              weakest topics directly.
            </li>
            <li>
              <strong>Or run both.</strong> If your {them.name} access hasn&apos;t run out, use Argonaut as a second bank for fresh questions on the topics you
              keep missing.
            </li>
          </ol>
        </Prose>
      </Section>
    </GuideShell>
  );
}
