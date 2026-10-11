import Link from "next/link";
import { Check, Minus } from "lucide-react";
import { Actions, Section, SourceNote } from "@/components/marketing/content";
import type { ArgonautFacts } from "@/lib/public/argonaut-facts";
import { CHECKED, COMPETITORS, type Competitor, type Source } from "@/lib/public/competitors";
import { cn } from "@/lib/utils";

// Shared pieces of the "best USMLE question bank" and "<X> alternatives" pages. Facts about
// other banks come only from competitors.ts; Argonaut's from live stats (argonaut-facts.ts).

export type MetricKey = keyof Competitor["metrics"];

export const METRICS: { key: MetricKey; label: string; question: string; definition: string }[] = [
  {
    key: "accuracy",
    label: "Accuracy",
    question: "Which USMLE question bank is most accurate?",
    definition: "How closely questions are built to match the real exam: the writing standard, mapping to the official content outline, and who signs each question off.",
  },
  {
    key: "price",
    label: "Price",
    question: "Which USMLE question bank is cheapest?",
    definition: "What it costs to cover Step 1 and Step 2 CK, including renewals and separate purchases.",
  },
  {
    key: "questions",
    label: "Number of questions",
    question: "Which USMLE question bank has the most questions?",
    definition: "Advertised Step 1 and Step 2 CK question counts.",
  },
  {
    key: "free",
    label: "Free resources",
    question: "Which USMLE question bank has the best free resources?",
    definition: "What you can use without paying: free questions, trials and study material, and how long they last.",
  },
  {
    key: "adaptive",
    label: "Adaptability",
    question: "Which USMLE question bank is the most adaptive?",
    definition: "Whether the bank chooses your next questions from your performance, or leaves you to build every block yourself.",
  },
  {
    key: "updates",
    label: "Up to date",
    question: "Which USMLE question bank is most up to date?",
    definition: "How recently questions were written and added, and whether the bank shows when.",
  },
];

export type Bank = { key: string; name: string; metrics: Competitor["metrics"]; argonaut?: boolean };

export function argonautBank(a: ArgonautFacts): Bank {
  return { key: "argonaut", name: "Argonaut", metrics: a.metrics, argonaut: true };
}

const LINK = "font-semibold text-text underline decoration-brand-strong decoration-2 underline-offset-4";

// Who wrote the page and where the facts came from: the first thing after the summary.
export function Disclosure({ sources }: { sources: Source[] }) {
  return (
    <Section eyebrow="Disclosure" title="Who wrote this, and how" split={false}>
      <div className="grid max-w-[72ch] gap-4 text-[16.5px] leading-relaxed text-muted">
        <p>
          The Argonaut editorial team wrote this page, and we sell Argonaut. To keep it fair, every fact about another bank is taken from that
          company&apos;s own website on {CHECKED} and linked below, we say where other banks beat us, and there are no affiliate links. Prices change: check
          each site before you buy.
        </p>
        <p>
          How our own questions are made is set out in our{" "}
          <Link href="/editorial-policy" className={LINK}>
            editorial policy
          </Link>
          . UWorld, AMBOSS, Kaplan and USMLE-Rx are trademarks of their owners; Argonaut is not affiliated with any of them.
        </p>
      </div>
      <SourceNote className="mt-6">
        Sources, checked {CHECKED}:{" "}
        {sources.map((s, i) => (
          <span key={s.url}>
            <a href={s.url} target="_blank" rel="noreferrer">
              {s.label}
            </a>
            {i < sources.length - 1 ? "; " : "."}
          </span>
        ))}
      </SourceNote>
    </Section>
  );
}

// Six metrics down, banks across. The leader of each metric is marked, if given.
export function MetricTable({ banks, leaders, caption }: { banks: Bank[]; leaders?: Partial<Record<MetricKey, string>>; caption: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[960px] border-collapse text-left text-[14px]">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b-2 border-text">
            <th scope="col" className="w-[13%] py-3 pr-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">
              Metric
            </th>
            {banks.map((b) => (
              <th key={b.key} scope="col" className={cn("px-3 py-3 text-[16px] font-bold", b.argonaut && "bg-brand-soft/60")}>
                {b.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {METRICS.map((m) => (
            <tr key={m.key} className="border-b border-border align-top">
              <th scope="row" className="py-3 pr-3 font-semibold">
                {m.label}
              </th>
              {banks.map((b) => {
                const lead = leaders?.[m.key] === b.key;
                return (
                  <td key={b.key} className={cn("px-3 py-3 leading-snug", b.argonaut ? "bg-brand-soft/60 text-text" : "text-muted")}>
                    {lead && (
                      <span className="readout mb-1.5 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-strong">
                        <Check aria-hidden className="size-3" strokeWidth={3} /> Leads
                      </span>
                    )}
                    <span className="block">{b.metrics[m.key]}</span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type QuickRow = { key: string; name: string; product: string; exams: string; price: string; access: string; questions: string; tryFree: string; argonaut?: boolean };

export function argonautQuickRow(a: ArgonautFacts): QuickRow {
  return {
    key: "argonaut",
    name: "Argonaut",
    product: "Full access",
    exams: "Step 1 and Step 2 CK",
    price: `${a.price} once`,
    access: "No expiry (for as long as Argonaut runs)",
    questions: `${a.s1} Step 1; ${a.s2} Step 2 CK`,
    tryFree: `${a.free} free questions, no account`,
    argonaut: true,
  };
}

// Price, coverage, access, size and trial, one row per bank.
export function QuickTable({ rows, caption }: { rows: QuickRow[]; caption: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[880px] border-collapse text-left text-[14.5px]">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b-2 border-text text-[12px] uppercase tracking-[0.08em] text-muted">
            {["Bank", "Covers", "Price (as listed)", "Access", "Advertised questions", "Try it free"].map((h) => (
              <th key={h} scope="col" className="py-3 pr-4 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className={cn("border-b border-border align-top", r.argonaut && "bg-brand-soft/60")}>
              <th scope="row" className="py-3 pr-4 sm:pl-2">
                <span className="block font-bold">{r.name}</span>
                <span className="block text-[13px] font-normal text-muted">{r.product}</span>
              </th>
              <td className="py-3 pr-4">{r.exams}</td>
              <td className="py-3 pr-4 font-semibold">{r.price}</td>
              <td className="py-3 pr-4">{r.access}</td>
              <td className="py-3 pr-4">{r.questions}</td>
              <td className="py-3 pr-4">{r.tryFree}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function quickRows(keys: string[]): QuickRow[] {
  return keys.map((k) => COMPETITORS.find((c) => c.key === k)!).map((c) => ({ ...c }));
}

// Pros and cons in two ruled columns.
export function ProsCons({ pros, cons }: { pros: string[]; cons: string[] }) {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      {(
        [
          ["Strengths", pros, true],
          ["Trade-offs", cons, false],
        ] as const
      ).map(([title, items, good]) => (
        <div key={title} className="border-t-2 border-text pt-3">
          <h4 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-muted">{title}</h4>
          <ul className="mt-3 grid gap-2.5 text-[15.5px] leading-relaxed">
            {items.map((x) => (
              <li key={x} className="flex gap-3">
                {good ? (
                  <Check aria-hidden className="mt-1 size-4 shrink-0 text-brand-strong" strokeWidth={3} />
                ) : (
                  <Minus aria-hidden className="mt-1 size-4 shrink-0 text-faint" strokeWidth={3} />
                )}
                {x}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function argonautProsCons(a: ArgonautFacts) {
  return {
    pros: [
      `${a.price} once for Step 1 and Step 2 CK: no subscription, no renewal, no expiry.`,
      "Every question written to the NBME Item-Writing Guide, mapped to the official content outline and approved by a clinician.",
      "ARGO chooses each session from your answer history: weak spots, confusion drills, spaced retests.",
      `${a.free} free questions and ${a.freeChapters} free Library chapters, with no account and no time limit.`,
      "Timed 20-question, 30-minute blocks that match the 2026 exam format.",
    ],
    cons: [
      `A smaller bank: ${a.s1} Step 1 and ${a.s2} Step 2 CK questions today.`,
      "No full-length self-assessments; use the NBME's official ones.",
      "A newer name than the established banks.",
    ],
  };
}

// One bank, written up: name, who it suits, price, pros and cons, source.
export function BankProfile({
  rank,
  name,
  verdict,
  bestFor,
  price,
  pros,
  cons,
  source,
  children,
  id,
}: {
  rank?: number;
  name: string;
  verdict?: string;
  bestFor: string;
  price: string;
  pros: string[];
  cons: string[];
  source?: Source;
  children?: React.ReactNode;
  id?: string;
}) {
  return (
    <article id={id} className="scroll-mt-24 border-t-2 border-text pt-6">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        {rank != null && <span className="readout text-[15px] text-brand-strong">{String(rank).padStart(2, "0")}</span>}
        <h3 className="display text-[clamp(24px,2.4vw,32px)] font-bold">
          {name}
          {verdict && <span className="text-muted">: {verdict}</span>}
        </h3>
      </div>
      <p className="mt-3 max-w-[68ch] text-[16.5px] leading-relaxed">
        <strong className="font-semibold">Best for:</strong> {bestFor} <strong className="font-semibold">Price:</strong> {price}
      </p>
      <div className="mt-6">
        <ProsCons pros={pros} cons={cons} />
      </div>
      {children && <div className="mt-6">{children}</div>}
      {source && (
        <SourceNote className="mt-4">
          Source:{" "}
          <a href={source.url} target="_blank" rel="noreferrer">
            {source.label}
          </a>
          , checked {CHECKED}.
        </SourceNote>
      )}
    </article>
  );
}

// A call to try Argonaut, placed where a reader has just seen why it fits.
export function InlineCta({ a, title, body }: { a: ArgonautFacts; title?: string; body?: string }) {
  return (
    <aside className="grid gap-6 border-y-2 border-text bg-brand-soft/50 px-5 py-7 md:grid-cols-[1fr_auto] md:items-center md:px-8">
      <div>
        <p className="text-[20px] font-bold leading-snug">{title ?? "Judge the questions, not the marketing."}</p>
        <p className="mt-2 max-w-[56ch] text-[15.5px] leading-relaxed text-muted">
          {body ??
            `Answer ${a.free} free Step 1 and Step 2 CK questions with full explanations, no account needed. If they're right for you, full access is ${a.price} once.`}
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Actions primary={{ href: "/free-usmle-practice-questions", label: "Try free questions" }} secondary={{ href: "/pricing", label: `Get full access, ${a.price}` }} />
      </div>
    </aside>
  );
}
