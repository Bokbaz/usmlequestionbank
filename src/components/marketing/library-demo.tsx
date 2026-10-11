import Link from "next/link";
import { BookOpen, Play } from "lucide-react";

// A real free chapter (the opening of /library/pulmonary-embolism), so the preview matches what
// students actually read: each topic's key takeaways, collected from the questions that test it.
const TAKEAWAYS = [
  ["Virchow triad:", "stasis (immobility, long travel, heart failure), endothelial injury (surgery, trauma), hypercoagulability (malignancy, pregnancy and postpartum, estrogen, inherited thrombophilia)."],
  ["Presentation:", "sudden dyspnea, pleuritic chest pain, tachycardia, tachypnea, hemoptysis; massive PE causes hypotension and obstructive shock."],
  [
    "Findings:",
    "respiratory alkalosis with hypoxemia and increased A-a gradient; ECG most often sinus tachycardia (S1Q3T3 is specific but uncommon); chest x-ray usually normal.",
  ],
];

export function LibraryDemo() {
  return (
    <div className="overflow-hidden rounded-[8px] border border-border bg-surface shadow-[0_40px_90px_-45px_oklch(0.2_0.025_215/0.35)]">
      <div className="flex items-center gap-2 border-b border-border px-6 py-3 text-[13px] text-muted">
        <BookOpen className="size-4" /> Library · Respiratory · 2 min read · Free
      </div>
      <div className="px-6 py-6 md:px-8">
        <h3 className="text-[26px] font-[750] tracking-[-0.02em]">Pulmonary embolism</h3>
        <ul className="mt-4 grid list-disc gap-2.5 pl-5 font-serif text-[16.5px] leading-[1.6] text-text marker:text-faint">
          {TAKEAWAYS.map(([k, v]) => (
            <li key={k}>
              <strong className="font-semibold">{k}</strong> {v}
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <span className="inline-flex items-center gap-2 rounded-[6px] bg-brand px-3.5 py-2 text-[13px] font-semibold text-on-brand">
            <Play className="size-3.5" /> Drill this topic
          </span>
          <Link href="/library/pulmonary-embolism" className="text-[13.5px] font-semibold text-text underline decoration-brand-strong decoration-2 underline-offset-4">
            Read the full chapter, free
          </Link>
        </div>
      </div>
    </div>
  );
}
