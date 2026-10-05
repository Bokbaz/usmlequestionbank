"use client";

import { motion } from "motion/react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

// What ARGO logs on every answer. Mirrors the attempts table; keep in sync with AnswerTrace.
const DATA_POINTS = [
  "Right or wrong",
  "Time taken",
  "First answer picked",
  "Final answer picked",
  "Number of changes",
  "Right-to-wrong or wrong-to-right",
  "How sure you were",
  "Struck out the right answer",
  "Opened lab values",
  "Position in the block",
  "Organ system",
  "Discipline",
  "Physician task",
  "Topic",
  "Predicted vs actual",
  "Days since you last saw it",
];

const EXAM_SPECS = [
  "Full clinical vignettes with one best answer",
  "Mapped to the official USMLE content outline",
  "All five choices explained, not just the right one",
  "Test-day screen: timer, lab values, highlighter, strike-out",
];

const RECEIPT = [
  ["Full access", "$48.00"],
  ["Billed", "Once"],
  ["Renews", "Never"],
  ["Expires", "Never"],
];

function Row({
  n,
  title,
  children,
  proof,
  index,
}: {
  n: string;
  title: React.ReactNode;
  children: React.ReactNode;
  proof: React.ReactNode;
  index: number;
}) {
  return (
    <motion.article
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      className="relative grid gap-8 py-12 md:py-16 lg:grid-cols-[120px_minmax(0,1fr)_400px] lg:gap-12"
    >
      {/* The rule draws across, then the row fills in: a timing sheet printing a line. */}
      <motion.span
        aria-hidden
        className={cn("absolute inset-x-0 top-0 origin-left bg-text", index === 0 ? "h-[2px]" : "h-px opacity-25")}
        variants={{ hidden: { scaleX: 0 }, shown: { scaleX: 1 } }}
        transition={{ duration: 1, ease: EASE }}
      />
      <motion.span
        className="readout text-[15px] font-medium text-brand-strong"
        variants={{ hidden: { opacity: 0 }, shown: { opacity: 1 } }}
        transition={{ duration: 0.6, delay: 0.25 }}
      >
        {n}
      </motion.span>
      <motion.div
        variants={{ hidden: { opacity: 0, y: 18 }, shown: { opacity: 1, y: 0 } }}
        transition={{ duration: 0.8, delay: 0.2, ease: EASE }}
      >
        <h3 className="display max-w-[16ch] text-[clamp(32px,3.9vw,56px)] font-bold">{title}</h3>
        <div className="mt-6 grid max-w-[58ch] gap-4 text-[17.5px] leading-relaxed text-muted">{children}</div>
      </motion.div>
      <motion.div
        variants={{ hidden: { opacity: 0, y: 18 }, shown: { opacity: 1, y: 0 } }}
        transition={{ duration: 0.8, delay: 0.35, ease: EASE }}
        className="lg:pt-2"
      >
        {proof}
      </motion.div>
    </motion.article>
  );
}

export function SellingPoints() {
  return (
    <div>
      <Row
        index={0}
        n="01"
        title="Questions that feel like the real exam."
        proof={
          <ul className="grid gap-3.5 rounded-[6px] border border-border bg-surface p-6">
            {EXAM_SPECS.map((s) => (
              <li key={s} className="flex gap-3 text-[15px] leading-snug text-text">
                <Check className="mt-0.5 size-4 shrink-0 text-brand-strong" strokeWidth={3} aria-hidden />
                {s}
              </li>
            ))}
          </ul>
        }
      >
        <p>
          Every question is written the way the real exam writes them: a full patient case, one best answer, no trick wording.
          Practice that looks like test day is practice that carries over to test day.
        </p>
        <p>
          You also get an explanation for every answer choice, not just the right one, so you learn why the other four are wrong. That
          is usually where the points are hiding.
        </p>
      </Row>

      <Row
        index={1}
        n="02"
        title={
          <>
            ARGO finds your weak spots. Then it <span className="text-brand-strong">fixes&nbsp;them.</span>
          </>
        }
        proof={
          <div className="rounded-[6px] bg-ink p-6 text-on-ink">
            <p className="eyebrow flex items-center justify-between text-on-ink-muted">
              <span>Logged on every answer</span>
              <span className="readout text-signal">16</span>
            </p>
            <ol className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
              {DATA_POINTS.map((d, i) => (
                <li key={d} className="flex gap-2 text-[13px] leading-snug">
                  <span className="readout shrink-0 text-signal">{String(i + 1).padStart(2, "0")}</span>
                  <span className="text-on-ink/90">{d}</span>
                </li>
              ))}
            </ol>
          </div>
        }
      >
        <p>
          ARGO is our algorithm. It records 16 data points on every answer you give: how long you took, how sure you were, whether you
          talked yourself out of the right answer, which wrong option pulled you in, how long since you last saw the topic, and more.
        </p>
        <p>
          Over time that adds up to a precise picture of where you lose points. ARGO ranks your weak spots and builds your next session
          around the worst one. When it closes, ARGO moves on to the next.
        </p>
        <p className="font-semibold text-text">
          Numbers don&apos;t lie. Put the reps in, and not improving becomes very hard to do.
        </p>
      </Row>

      <Row
        index={2}
        n="03"
        title="$48. Lifetime access. Not a subscription."
        proof={
          <div className="rounded-[6px] border border-border bg-surface p-6">
            <dl className="readout grid gap-2.5 text-[14px]">
              {RECEIPT.map(([k, v]) => (
                <div key={k} className="flex items-baseline gap-3">
                  <dt className="text-muted">{k}</dt>
                  <span aria-hidden className="h-px flex-1 translate-y-[-3px] border-b border-dashed border-border-strong" />
                  <dd className="font-medium text-text">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-5 border-t border-border pt-4 text-[13.5px] leading-snug text-muted">
              Every question, every explanation, ARGO and the Library. Free to start, no card needed.
            </p>
          </div>
        }
      >
        <p>
          Education should be affordable, and the most important exam of your career shouldn&apos;t come with a monthly bill. Pay $48
          once and it&apos;s yours.
        </p>
        <p>No renewal date, no expiry, no countdown to the day you lose access halfway through your dedicated period.</p>
      </Row>
    </div>
  );
}
