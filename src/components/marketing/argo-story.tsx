"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { Clock, Gauge, Repeat2, Scissors, Target, FlaskConical } from "lucide-react";
import { ArgoMark } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

const STEPS = [
  {
    kicker: "01 · Measure",
    title: "Measures every decision.",
    body: "Time, confidence, answer changes, the choices you eliminated, the distractor you fell for. Every answer carries a dozen signals, and ARGO keeps all of them.",
  },
  {
    kicker: "02 · Diagnose",
    title: "Finds the weakness behind the miss.",
    body: "A wrong answer is a symptom. ARGO separates knowledge gaps from misconceptions, second-guessing, rushing, distractor traps and forgetting, then ranks concepts by how much they cost you on test day.",
  },
  {
    kicker: "03 · Prescribe",
    title: "Builds the session that fixes it.",
    body: "Each session mixes weakness targets, confusion drills and spaced retests at the difficulty where you learn fastest. When the bank runs dry on a concept, ARGO writes new questions for it. Then it measures again, until the number moves.",
  },
];

export function ArgoStory() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  useMotionValueEvent(scrollYProgress, "change", (v) => setActive(v < 0.34 ? 0 : v < 0.67 ? 1 : 2));

  return (
    <section id="argo" className="relative bg-ink text-on-ink">
      <div className="mx-auto max-w-[1240px] px-5 pt-28 md:px-8 md:pt-36">
        <div className="flex items-center gap-2.5">
          <ArgoMark className="size-5 text-on-ink" />
          <p className="eyebrow text-on-ink-muted">ARGO analytics engine</p>
        </div>
        <h2 className="display mt-5 max-w-[16ch] text-[clamp(40px,6vw,84px)] font-[800]">
          It doesn&apos;t just score you. It studies you.
        </h2>
      </div>

      {/* Desktop: sticky scrollytelling */}
      <div ref={ref} className="relative hidden h-[300vh] md:block">
        <div className="sticky top-0 flex h-screen items-center">
          <div className="mx-auto grid w-full max-w-[1240px] grid-cols-[1fr_1.15fr] items-center gap-16 px-8">
            <ol className="relative grid gap-10">
              {STEPS.map((s, i) => (
                <li key={s.kicker} className="relative pl-6">
                  <span
                    aria-hidden
                    className={cn(
                      "absolute left-0 top-1.5 size-2.5 rounded-full transition-colors duration-500",
                      i === active ? "bg-on-ink" : "bg-on-ink/20",
                    )}
                  />
                  <p className={cn("eyebrow transition-colors duration-500", i === active ? "text-on-ink" : "text-on-ink/35")}>{s.kicker}</p>
                  <h3
                    className={cn(
                      "mt-2 text-[28px] font-[750] leading-tight tracking-[-0.02em] transition-colors duration-500 [font-stretch:108%]",
                      i === active ? "text-on-ink" : "text-on-ink/35",
                    )}
                  >
                    {s.title}
                  </h3>
                  <motion.p
                    initial={false}
                    animate={{ opacity: i === active ? 1 : 0.35, height: "auto" }}
                    className="mt-2 max-w-[46ch] text-[15.5px] leading-relaxed text-on-ink-muted"
                  >
                    {s.body}
                  </motion.p>
                </li>
              ))}
            </ol>
            <div className="relative h-[520px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -20, filter: "blur(6px)" }}
                  transition={{ duration: 0.7, ease: EASE }}
                  className="absolute inset-0 flex items-center"
                >
                  {active === 0 ? <SignalsVisual /> : active === 1 ? <DiagnoseVisual /> : <PrescribeVisual />}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: stacked */}
      <div className="grid gap-16 px-5 pb-24 pt-12 md:hidden">
        {STEPS.map((s, i) => (
          <div key={s.kicker}>
            <p className="eyebrow text-on-ink-muted">{s.kicker}</p>
            <h3 className="mt-2 text-[24px] font-[750] leading-tight">{s.title}</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-on-ink-muted">{s.body}</p>
            <div className="mt-6">{i === 0 ? <SignalsVisual /> : i === 1 ? <DiagnoseVisual /> : <PrescribeVisual />}</div>
          </div>
        ))}
      </div>
      <div className="h-24 md:h-32" />
    </section>
  );
}

function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("w-full rounded-[14px] border border-white/10 bg-ink-2 p-6 shadow-[0_30px_80px_-30px_oklch(0.05_0.05_266/0.9)]", className)}>
      {children}
    </div>
  );
}

const SIGNALS = [
  { icon: Clock, label: "Time on question", value: "1:52", note: "your median is 1:05" },
  { icon: Gauge, label: "Confidence", value: "Sure", note: "and wrong: a misconception" },
  { icon: Repeat2, label: "Answer changes", value: "C → A", note: "changed away from correct" },
  { icon: Scissors, label: "Eliminated", value: "C", note: "struck out the right answer" },
  { icon: Target, label: "Distractor", value: "A", note: "the trap 31% of peers chose" },
  { icon: FlaskConical, label: "Lab values", value: "Not opened", note: "" },
];

function SignalsVisual() {
  return (
    <Panel>
      <p className="text-[13px] font-semibold text-on-ink-muted">One answer, as ARGO sees it</p>
      <ul className="mt-4 grid gap-2">
        {SIGNALS.map((s, i) => (
          <motion.li
            key={s.label}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.08 * i, ease: EASE }}
            className="flex items-center gap-3 rounded-[10px] bg-on-ink/[0.04] px-3.5 py-3"
          >
            <s.icon className="size-4 shrink-0 text-on-ink-muted" aria-hidden />
            <span className="text-[14px] text-on-ink/85">{s.label}</span>
            <span className="ml-auto text-right">
              <span className="block text-[14px] font-semibold text-on-ink">{s.value}</span>
              {s.note && <span className="block text-[12px] text-on-ink-muted">{s.note}</span>}
            </span>
          </motion.li>
        ))}
      </ul>
    </Panel>
  );
}

const ERRORS = [
  { label: "Knowledge gap", value: 38 },
  { label: "Misconception", value: 21 },
  { label: "Second-guessing", value: 14 },
  { label: "Distractor trap", value: 12 },
  { label: "Forgetting", value: 9 },
  { label: "Rushing", value: 6 },
];

const HEAT = [
  [0.82, 0.71, 0.44, 0.9, 0.66],
  [0.38, 0.52, 0.61, 0.29, 0.74],
  [0.67, 0.88, 0.47, 0.58, 0.35],
  [0.55, 0.31, 0.79, 0.7, 0.62],
];
const HEAT_ROWS = ["Cardio", "Renal", "Endocrine", "Neuro"];
const HEAT_COLS = ["Path", "Physio", "Pharm", "Micro", "Biochem"];

function divergingVar(v: number) {
  if (v < 0.3) return "var(--div-n3)";
  if (v < 0.45) return "var(--div-n2)";
  if (v < 0.55) return "var(--div-n1)";
  if (v < 0.65) return "var(--div-0)";
  if (v < 0.75) return "var(--div-p1)";
  if (v < 0.85) return "var(--div-p2)";
  return "var(--div-p3)";
}

function DiagnoseVisual() {
  return (
    <Panel className="grid gap-6">
      <div>
        <p className="text-[13px] font-semibold text-on-ink-muted">Why you miss · last 200 answers</p>
        <ul className="mt-3 grid gap-2.5">
          {ERRORS.map((e, i) => (
            <li key={e.label} className="grid grid-cols-[120px_1fr_40px] items-center gap-3">
              <span className="text-[13px] text-on-ink/85">{e.label}</span>
              <span className="h-2.5 overflow-hidden">
                <motion.span
                  className="block h-full rounded-r-[4px] bg-[var(--series-1)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${(e.value / 38) * 100}%` }}
                  transition={{ duration: 0.9, delay: 0.06 * i, ease: EASE }}
                />
              </span>
              <span className="tabular text-right text-[13px] font-semibold text-on-ink">{e.value}%</span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className="text-[13px] font-semibold text-on-ink-muted">Mastery map</p>
        <div className="mt-3 grid grid-cols-[72px_repeat(5,1fr)] gap-[2px] text-[11px]">
          <span />
          {HEAT_COLS.map((c) => (
            <span key={c} className="pb-1 text-center font-semibold text-on-ink-muted">
              {c}
            </span>
          ))}
          {HEAT.map((row, r) => (
            <div key={HEAT_ROWS[r]} className="contents">
              <span className="flex items-center pr-2 font-semibold text-on-ink-muted">{HEAT_ROWS[r]}</span>
              {row.map((v, c) => (
                <motion.span
                  key={c}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.03 * (r * 5 + c) }}
                  className="grid h-8 place-items-center rounded-[4px] text-[11px] font-semibold"
                  style={{ background: divergingVar(v), color: v < 0.3 || v >= 0.75 ? "#fff" : "oklch(0.2 0.03 266)" }}
                >
                  {Math.round(v * 100)}
                </motion.span>
              ))}
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2 text-[11.5px] text-on-ink-muted">
          <span>Weak</span>
          {["--div-n3", "--div-n2", "--div-n1", "--div-0", "--div-p1", "--div-p2", "--div-p3"].map((v) => (
            <span key={v} className="h-2 w-5 rounded-[2px]" style={{ background: `var(${v})` }} />
          ))}
          <span>Strong</span>
        </div>
      </div>
    </Panel>
  );
}

const MIX = [
  { label: "Weakness targets", value: 9, color: "var(--series-1)" },
  { label: "Confusion drills", value: 5, color: "var(--series-2)" },
  { label: "Spaced retests", value: 4, color: "var(--series-3)" },
  { label: "Coverage scouts", value: 2, color: "var(--viz-5)" },
];
const PROGRESS = [41, 49, 58, 63, 71, 78];

function PrescribeVisual() {
  const w = 360;
  const h = 120;
  const x = (i: number) => 8 + (i * (w - 16)) / (PROGRESS.length - 1);
  const y = (v: number) => h - 8 - ((v - 30) / 60) * (h - 16);
  const d = PROGRESS.map((v, i) => `${i ? "L" : "M"}${x(i)},${y(v)}`).join(" ");
  return (
    <Panel className="grid gap-6">
      <div>
        <div className="flex items-baseline justify-between">
          <p className="text-[13px] font-semibold text-on-ink-muted">Next ARGO session</p>
          <p className="text-[13px] font-semibold text-on-ink">20 questions</p>
        </div>
        <div className="mt-3 flex h-3.5 gap-[2px]">
          {MIX.map((m, i) => (
            <motion.span
              key={m.label}
              className="h-full first:rounded-l-[4px] last:rounded-r-[4px]"
              style={{ background: m.color }}
              initial={{ flexGrow: 0.001 }}
              animate={{ flexGrow: m.value }}
              transition={{ duration: 0.9, delay: 0.08 * i, ease: EASE }}
            />
          ))}
        </div>
        <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[12.5px]">
          {MIX.map((m) => (
            <li key={m.label} className="flex items-center gap-2 text-on-ink/85">
              <span className="size-2.5 rounded-[2px]" style={{ background: m.color }} />
              {m.label}
              <span className="ml-auto font-semibold tabular text-on-ink">{m.value}</span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className="text-[13px] font-semibold text-on-ink-muted">Crohn vs UC mastery, by session</p>
        <svg viewBox={`0 0 ${w} ${h}`} className="mt-3 w-full overflow-visible" role="img" aria-label="Mastery rises from 41% to 78% over six sessions; target 80%">
          <line x1={0} x2={w} y1={y(80)} y2={y(80)} stroke="currentColor" className="text-on-ink/25" strokeWidth={1} />
          <text x={w} y={y(80) - 6} textAnchor="end" className="fill-on-ink-muted text-[11px]">
            Target 80%
          </text>
          <motion.path
            d={d}
            fill="none"
            stroke="var(--series-1)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.4, ease: EASE }}
          />
          {PROGRESS.map((v, i) => (
            <circle key={i} cx={x(i)} cy={y(v)} r={4} fill="var(--series-1)" stroke="var(--ink-2)" strokeWidth={2} />
          ))}
          <text x={x(PROGRESS.length - 1)} y={y(78) + 20} textAnchor="end" className="fill-on-ink text-[12px] font-semibold">
            78%
          </text>
          <text x={x(0)} y={y(41) + 20} className="fill-on-ink-muted text-[12px]">
            41%
          </text>
        </svg>
      </div>
    </Panel>
  );
}
