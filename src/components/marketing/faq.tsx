"use client";

import { Accordion } from "radix-ui";
import { Plus } from "lucide-react";

const QA = [
  {
    q: "How is Argonaut different from other question banks?",
    a: "The fundamentals match the best banks: exam-style vignettes, an exam-faithful interface, explanations for every answer choice, and analytics by system and discipline. The difference is ARGO. Instead of leaving you to decide what to do with your stats, it decides what you should practice next and builds the session for you.",
  },
  {
    q: "What exactly does ARGO measure?",
    a: "Correctness, time on each question, confidence, answer changes, the options you struck out, which distractor you chose, whether you opened lab values, where the question sat in the block, and how long since you last saw the concept. From that it estimates your mastery of every system, discipline, physician task, topic and Nugget, and classifies each miss as a knowledge gap, misconception, second-guess, rushed answer, distractor trap or memory lapse.",
  },
  {
    q: "What is a Nugget?",
    a: "A Nugget is an ultra-high-yield concept. Every question is checked against an index of tens of thousands of high-yield concept lines; when the point a question tests matches one, the question carries a gold Nugget mark and the concept is added to your Nugget collection.",
  },
  {
    q: "Is the Daily Challenge really free?",
    a: "Yes. Anyone can play without an account. Create a free account to appear on the leaderboard, keep a streak and review the full explanation later.",
  },
  {
    q: "Which exams are covered?",
    a: "Step 1 and Step 2 CK, tagged to the official USMLE content outline. Step 3 content is planned.",
  },
  {
    q: "Can I cancel?",
    a: "Anytime, from Settings. You keep access until the end of the period you paid for.",
  },
];

export function Faq() {
  return (
    <Accordion.Root type="single" collapsible className="divide-y divide-border border-y border-border">
      {QA.map((item) => (
        <Accordion.Item key={item.q} value={item.q}>
          <Accordion.Header>
            <Accordion.Trigger className="group flex w-full items-center justify-between gap-6 py-5 text-left text-[17px] font-semibold text-text">
              {item.q}
              <Plus className="size-5 shrink-0 text-muted transition-transform duration-300 ease-[var(--ease-out-quart)] group-data-[state=open]:rotate-45" />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="overflow-hidden data-[state=closed]:animate-[collapse_220ms_var(--ease-out-quart)] data-[state=open]:animate-[expand_280ms_var(--ease-out-quart)]">
            <p className="max-w-[70ch] pb-6 text-[15.5px] leading-relaxed text-muted">{item.a}</p>
          </Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}
