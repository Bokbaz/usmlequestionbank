import Link from "next/link";
import { ArrowRight, Zap } from "lucide-react";
import type { QuestionSummary } from "@/lib/public/content";
import { cn } from "@/lib/utils";

const fmtDay = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export function questionTitle(q: QuestionSummary) {
  return q.topic ?? `${q.system.short} question`;
}

// Public questions as ruled rows: topic, the opening of the vignette, and where it came from.
export function QuestionRows({ questions, showExam, className }: { questions: QuestionSummary[]; showExam?: boolean; className?: string }) {
  return (
    <ul className={cn("border-t-2 border-text", className)}>
      {questions.map((q) => (
        <li key={q.id} className="border-b border-border">
          <Link href={q.path} className="group grid grid-cols-[1fr_auto] items-start gap-x-6 gap-y-1 py-4 transition-colors hover:bg-panel/60 sm:px-2">
            <span className="min-w-0">
              <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                <span className="text-[16px] font-bold leading-snug text-text group-hover:underline group-hover:decoration-brand-strong group-hover:decoration-2 group-hover:underline-offset-4">
                  {questionTitle(q)}
                </span>
                {q.daily && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-ink px-2 py-0.5 text-[11.5px] font-bold text-on-ink">
                    <Zap aria-hidden className="size-3 text-signal" /> Daily #{q.daily.number}
                  </span>
                )}
              </span>
              <span className="mt-1 block text-[14.5px] leading-snug text-muted">{q.teaser}</span>
            </span>
            <span className="flex items-center gap-3 pt-0.5 text-[13px] text-faint">
              <span className="hidden text-right sm:block">
                {showExam ? `${q.exam === "step1" ? "Step 1" : "Step 2 CK"} · ` : ""}
                {q.daily ? fmtDay(q.daily.day) : q.code}
              </span>
              <ArrowRight aria-hidden className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-text" />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

// Grouped by organ system, with anchor ids so the system index can jump to them.
export function QuestionsBySystem({ questions }: { questions: QuestionSummary[] }) {
  const groups = new Map<string, { name: string; items: QuestionSummary[] }>();
  for (const q of questions) {
    const g = groups.get(q.system.slug) ?? { name: q.system.name, items: [] };
    g.items.push(q);
    groups.set(q.system.slug, g);
  }
  return (
    <div className="grid gap-12">
      {[...groups.entries()].map(([slug, g]) => (
        <section key={slug} id={slug} className="scroll-mt-24">
          <h3 className="eyebrow text-muted">
            {g.name} · {g.items.length}
          </h3>
          <QuestionRows questions={g.items} className="mt-3" />
        </section>
      ))}
    </div>
  );
}
