"use client";

import { Accordion } from "radix-ui";
import { Plus } from "lucide-react";

const QA = [
  {
    q: "How is this different from the big question banks?",
    a: "The basics are the same: exam-style questions, a test-day interface, every answer choice explained. The difference is what happens after you answer. ARGO works out what you should practice next and builds that session for you. And it's $48 once, not hundreds.",
  },
  {
    q: "What does ARGO actually track?",
    a: "Pretty much everything: what you got right, how long you took, how sure you were, what you changed your mind on, and which wrong answer pulled you in. You don't have to look at any of it to get better. It's all there if you want it.",
  },
  {
    q: "What's a Nugget?",
    a: "A fact that comes up on the exam again and again. Questions that test one are marked gold, and you collect them as you go.",
  },
  {
    q: "Is the Daily Challenge really free?",
    a: "Yes, and you don't need an account to play. Sign up free if you want a spot on the leaderboard and a streak.",
  },
  {
    q: "Which exams do you cover?",
    a: "Step 1 and Step 2 CK, mapped to the official USMLE content outline. Step 3 is on the way.",
  },
  {
    q: "Is it a subscription?",
    a: "No. $48 once gets you everything, and it doesn't expire. The only monthly charge is the optional question-writing add-on at $4.99, which you can cancel whenever you like.",
  },
  {
    q: "What does the question-writing add-on do?",
    a: "If you've worked through every question on something you keep missing, ARGO writes new ones aimed at exactly that. Each one is checked before it reaches you.",
  },
];

export function Faq() {
  return (
    <Accordion.Root type="single" collapsible className="border-t-2 border-text">
      {QA.map((item, i) => (
        <Accordion.Item key={item.q} value={item.q} className="border-b border-border">
          <Accordion.Header>
            <Accordion.Trigger className="group grid w-full grid-cols-[40px_1fr_auto] items-center gap-4 py-5 text-left">
              <span className="font-display text-[13px] font-bold text-faint tabular">{String(i + 1).padStart(2, "0")}</span>
              <span className="text-[17.5px] font-bold text-text">{item.q}</span>
              <span className="grid size-8 place-items-center rounded-[4px] bg-panel transition-colors duration-200 group-hover:bg-brand group-data-[state=open]:bg-brand">
                <Plus
                  className="size-4 text-text transition-transform duration-300 ease-[var(--ease-out-quart)] group-hover:text-on-brand group-data-[state=open]:rotate-45 group-data-[state=open]:text-on-brand"
                  strokeWidth={2.5}
                />
              </span>
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="overflow-hidden data-[state=closed]:animate-[collapse_220ms_var(--ease-out-quart)] data-[state=open]:animate-[expand_280ms_var(--ease-out-quart)]">
            <p className="max-w-[68ch] pb-6 pl-14 text-[16px] leading-relaxed text-muted">{item.a}</p>
          </Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}
