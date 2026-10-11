import Link from "next/link";
import { Flag, Users } from "lucide-react";
import { Markdown } from "@/components/markdown";
import { AnswerPicker } from "@/components/practice/answer-picker";
import { NuggetGlyph } from "@/components/ui/badge";
import type { PublicQuestion } from "@/lib/public/content";
import { SUPPORT_EMAIL } from "@/lib/utils";

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

// A complete public question: vignette, choices, and the full explanation in the HTML (collapsed
// until the student answers), with who wrote it, when it was last updated and how to report a
// problem. Used on question pages and as the worked example on the exam pages.
export function QuestionView({ q, headingLevel = 2 }: { q: PublicQuestion; headingLevel?: 2 | 3 }) {
  const H = headingLevel === 2 ? "h2" : "h3";
  const correct = q.options.find((o) => o.label === q.correctLabel)!;
  const report = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`Problem with question ${q.code}`)}`;
  return (
    <div>
      <div className="whitespace-pre-line text-[17px] leading-[1.7] text-text">
        {q.stem.split(/\n\s*\n/).map((p, i) => (
          <p key={i} className={i ? "mt-4" : undefined}>
            {p.trim()}
          </p>
        ))}
      </div>
      {q.media.map((m) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={m.url} src={m.url} alt={m.alt ?? "Image for this question"} className="mt-5 max-h-[420px] rounded-[8px] border border-border" loading="lazy" />
      ))}
      <p className="mt-6 text-[17px] font-semibold leading-snug">{q.leadIn}</p>

      <AnswerPicker options={q.options} correctLabel={q.correctLabel}>
        <div className="grid gap-7">
          <div>
            <H className="text-[19px] font-bold">
              Answer: {q.correctLabel}. {correct.body}
            </H>
            {q.peer && (
              <p className="mt-2 flex items-center gap-1.5 text-[14px] text-muted">
                <Users className="size-4" aria-hidden /> {q.peer.pctCorrect}% of {q.peer.n.toLocaleString("en-US")} Argonaut attempts were correct
              </p>
            )}
            <Markdown className="mt-4">{q.explanation}</Markdown>
          </div>

          {Object.keys(q.optionExplanations).length > 0 && (
            <div>
              <H className="text-[17px] font-bold">Why each answer choice is right or wrong</H>
              <ul className="mt-3 grid gap-2">
                {q.options.map((o) => {
                  const exp = q.optionExplanations[o.label];
                  if (!exp) return null;
                  const right = o.label === q.correctLabel;
                  return (
                    <li key={o.label} className={right ? "flex gap-3 rounded-[10px] border border-correct/40 bg-correct-soft/60 px-3.5 py-3" : "flex gap-3 rounded-[10px] border border-border bg-surface px-3.5 py-3"}>
                      <span className={right ? "mt-0.5 grid size-6 shrink-0 place-items-center rounded-[6px] bg-correct text-[12px] font-bold text-surface" : "mt-0.5 grid size-6 shrink-0 place-items-center rounded-[6px] bg-panel text-[12px] font-bold text-muted"}>
                        {o.label}
                      </span>
                      <p className="min-w-0 text-[15px] leading-relaxed">
                        <span className="font-semibold">
                          {o.body}
                          {right ? " (correct)" : ""}.
                        </span>{" "}
                        <span className="text-muted">{exp.replace(/^Correct\.\s*/i, "")}</span>
                      </p>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {q.objective && (
            <div className="rounded-[10px] border border-border bg-panel p-4">
              <p className="eyebrow text-brand-strong">Educational objective</p>
              <p className="mt-1.5 text-[15.5px] leading-relaxed">{q.objective}</p>
            </div>
          )}

          {q.nuggets.length > 0 && (
            <div className="grid gap-3">
              {q.nuggets.map((n) => (
                <div key={n.title} className="rounded-[10px] bg-gold-soft p-4">
                  <p className="eyebrow flex items-center gap-1.5 text-gold-ink">
                    <NuggetGlyph className="size-3.5" /> Nugget · high-yield
                  </p>
                  <p className="mt-1.5 text-[15.5px] font-semibold leading-snug">{n.title}</p>
                  {n.body && <p className="mt-1 text-[14.5px] leading-relaxed text-muted">{n.body}</p>}
                </div>
              ))}
            </div>
          )}

          {q.references.length > 0 && (
            <div>
              <H className="text-[15px] font-bold">References</H>
              <ul className="mt-2 grid list-disc gap-1 pl-5 text-[14px] text-muted">
                {q.references.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
          )}

          {q.chapter && (
            <p className="text-[15px]">
              Study the concept:{" "}
              <Link href={`/library/${q.chapter.slug}`} className="font-semibold underline decoration-brand-strong decoration-2 underline-offset-4 hover:decoration-text">
                {q.chapter.title}
              </Link>{" "}
              <span className="text-muted">{q.chapter.free ? "(free Library chapter)" : "(Library chapter, Full access)"}</span>
            </p>
          )}
        </div>
      </AnswerPicker>

      <footer className="mt-8 grid gap-2 border-t border-border pt-5 text-[13.5px] leading-relaxed text-muted">
        <p>
          <span className="font-semibold text-text">Written and reviewed by the Argonaut editorial team.</span> A clinician
          approves every question before it goes live.{" "}
          <Link href="/editorial-policy" className="font-semibold text-text underline underline-offset-2">
            How we write questions
          </Link>
        </p>
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span>
            {q.code} · Last updated <time dateTime={q.updatedAt}>{fmtDate(q.updatedAt)}</time>
          </span>
          <a href={report} className="inline-flex items-center gap-1 font-semibold text-text underline underline-offset-2">
            <Flag className="size-3.5" aria-hidden /> Report a problem with this question
          </a>
        </p>
      </footer>
    </div>
  );
}
