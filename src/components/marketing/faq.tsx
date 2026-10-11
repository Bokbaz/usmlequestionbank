import { Plus } from "lucide-react";
import { RichText } from "@/components/marketing/rich-text";
import { REFUND_DAYS, REFUND_MAX_ANSWERED } from "@/lib/legal";
import { SUPPORT_EMAIL } from "@/lib/utils";

export type FaqItem = { q: string; a: string };

// The general product FAQ (home and pricing). Exam and subject pages pass their own items.
export const PRODUCT_FAQ: FaqItem[] = [
  {
    q: "How is this different from the big question banks?",
    a: "The basics are the same: exam-style questions, a test-day interface and every answer choice explained. The difference is what happens after you answer. ARGO works out what you should practice next and builds that session for you. And it's $48 once, not hundreds of dollars for a few months.",
  },
  {
    q: "What does ARGO actually track?",
    a: "16 data points on every answer: whether you got it right, how long you took, how sure you were, what you changed your mind on, which wrong answer pulled you in and how long since you last saw the topic. [See how ARGO works](/features/argo).",
  },
  {
    q: "What's a Nugget?",
    a: "A fact that comes up on the exam again and again. Questions that test one are marked gold, and you collect them as you go.",
  },
  {
    q: "Is the Daily Challenge really free?",
    a: "Yes, and you don't need an account to play. Sign up free if you want a spot on the leaderboard and a streak. Past challenges stay free in the [question archive](/free-usmle-practice-questions).",
  },
  {
    q: "Which exams do you cover?",
    a: "[Step 1](/usmle-step-1-question-bank) and [Step 2 CK](/usmle-step-2-ck-question-bank), mapped to the official USMLE content outlines. One purchase covers both. Step 3 is on the way.",
  },
  {
    q: "Who writes the questions?",
    a: "Each question is drafted with AI from reference notes, written to the NBME Item-Writing Guide, and reviewed and approved by a clinician before it goes live. The [editorial policy](/editorial-policy) has the full process.",
  },
  {
    q: "Is it a subscription?",
    a: "No. $48 once gets you everything, and it doesn't expire. The only monthly charge is the optional question-writing add-on at $4.99, which you can cancel whenever you like.",
  },
  {
    q: "What does the question-writing add-on do?",
    a: "If you've worked through every question on something you keep missing, ARGO writes new ones aimed at exactly that. Each one is checked by an independent AI review before it reaches you, and it stays private to your account.",
  },
  {
    q: "Can I get a refund?",
    a: `Yes. Email ${SUPPORT_EMAIL} within ${REFUND_DAYS} days of buying Full access, with fewer than ${REFUND_MAX_ANSWERED} questions answered, and we'll refund the full $48. The [refund policy](/refunds) has the details.`,
  },
  {
    q: "How do I reach you?",
    a: `Email ${SUPPORT_EMAIL}. A real person reads every message.`,
  },
];

// Answers are in the HTML from the start (crawlers and AI assistants read them without
// clicking); <details> only collapses them visually. Opening one closes the others.
export function Faq({ items = PRODUCT_FAQ }: { items?: FaqItem[] }) {
  return (
    <div className="border-t-2 border-text">
      {items.map((item, i) => (
        <details key={item.q} name="faq" className="faq-item group border-b border-border">
          <summary className="grid cursor-pointer list-none grid-cols-[40px_1fr_auto] items-center gap-4 py-5 text-left [&::-webkit-details-marker]:hidden">
            <span className="readout text-[13px] font-bold text-faint">{String(i + 1).padStart(2, "0")}</span>
            <span className="text-[17.5px] font-bold text-text">{item.q}</span>
            <span className="grid size-8 place-items-center rounded-[4px] bg-panel transition-colors duration-200 group-hover:bg-brand group-open:bg-brand">
              <Plus
                aria-hidden
                className="size-4 text-text transition-transform duration-300 ease-[var(--ease-out-quart)] group-hover:text-on-brand group-open:rotate-45 group-open:text-on-brand"
                strokeWidth={2.5}
              />
            </span>
          </summary>
          <p className="max-w-[68ch] pb-6 pl-14 text-[16px] leading-relaxed text-muted">
            <RichText text={item.a} />
          </p>
        </details>
      ))}
    </div>
  );
}
