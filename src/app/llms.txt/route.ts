import { DEFAULT_BLOCK, EXAMS } from "@/lib/exams";
import { COMPANY, REFUND_DAYS, REFUND_MAX_ANSWERED } from "@/lib/legal";
import { OFFERS, formatUsd } from "@/lib/plans";
import { getBankStats } from "@/lib/public/content";
import { GUIDES } from "@/lib/public/guides";
import { HUBS } from "@/lib/public/hubs";
import { SITE_URL, SUPPORT_EMAIL } from "@/lib/utils";

// llms.txt (llmstxt.org): a plain summary of what Argonaut is, with links to the pages that
// answer common questions, for AI assistants that read it. Google says it has no effect on
// Google Search; the facts mirror the pages themselves.
export const revalidate = 3600;

export async function GET() {
  const s = await getBankStats();
  const n = (x: number) => x.toLocaleString("en-US");
  const link = (path: string, label: string, note: string) => `- [${label}](${SITE_URL}${path}): ${note}`;
  const access = formatUsd(OFFERS.access.amountUsd);
  const writer = formatUsd(OFFERS.writer.amountUsd);

  const body = `# Argonaut USMLE

> Argonaut USMLE is an online question bank for USMLE Step 1 and Step 2 CK, made by ${COMPANY} (London, United Kingdom). It has ${n(s.total)} exam-style questions (${n(s.exams.step1.total)} Step 1, ${n(s.exams.step2ck.total)} Step 2 CK), each with every answer choice explained, plus ARGO, an adaptive analytics engine that builds practice sessions around each student's weak spots. Full access costs ${access} once for both exams, with no subscription and no expiry. ${n(s.publicQuestions)} questions and ${n(s.freeChapters)} Library chapters are free to use without an account.

## Key facts

- Price: ${access}, one payment, for Full access: every Step 1 and Step 2 CK question, the high-yield Library (${n(s.chapters)} chapters) and ARGO. Access lasts for as long as Argonaut runs the service; it never renews or expires.
- Optional add-on: ARGO question writing, ${writer} a month, writes new questions for a student's weakest concepts once the bank's questions on them are used up.
- Refunds: full refund within ${REFUND_DAYS} days of purchase if fewer than ${REFUND_MAX_ANSWERED} questions have been answered.
- Format: single-best-answer clinical vignettes, tutor and timed modes. Timed blocks default to ${DEFAULT_BLOCK} questions in 30 minutes (90 seconds per question), matching the USMLE block format in use since May 2026.
- How questions are made: written to the NBME Item-Writing Guide, then reviewed and approved by a clinician (MD or DO) before going live. Students can report problems on any question.
- ARGO: records 16 data points per answer (accuracy, timing, confidence, answer changes, topic history) and builds sessions of weak-spot questions, confusion drills, spaced retests and coverage scouts. It does not predict USMLE scores.
- Free: ${n(s.publicQuestions)} practice questions with full explanations (including every past Daily Challenge), free Library chapters, and a daily Step 1 question challenge with a global leaderboard.
- Exams covered: USMLE Step 1 and Step 2 CK. Step 3 is planned, not available yet.
- Independence: not affiliated with or endorsed by the FSMB, the NBME or the USMLE program. Questions are original practice material, not real exam questions.
- Contact: ${SUPPORT_EMAIL}

## Question bank

${link(EXAMS.step1.bankPath, "USMLE Step 1 question bank", `${n(s.exams.step1.total)} questions, coverage by system, format and pricing`)}
${link(EXAMS.step2ck.bankPath, "USMLE Step 2 CK question bank", `${n(s.exams.step2ck.total)} clinical questions, coverage, format and pricing`)}
${link("/pricing", "Pricing", `${access} once; what's free, what's included, refunds`)}
${link("/features/argo", "ARGO adaptive practice", "what ARGO measures, how it builds sessions, its limits")}

## Free practice

${link("/free-usmle-practice-questions", "Free USMLE practice questions", `${n(s.publicQuestions)} questions with full explanations, no login`)}
${link(EXAMS.step1.freePath, "Free USMLE Step 1 questions", `${n(s.exams.step1.free)} questions by organ system`)}
${link(EXAMS.step2ck.freePath, "Free USMLE Step 2 CK questions", `${n(s.exams.step2ck.free)} questions by organ system`)}
${link("/daily", "Daily USMLE Challenge", "one hard Step 1 question a day; past questions stay free")}
${link("/library", "High-yield USMLE Library", `${n(s.chapters)} chapters, ${n(s.freeChapters)} free`)}

## Practice by subject

${HUBS.map((h) => link(h.path, h.h1, `${h.outline.share} of ${EXAMS[h.exam].name} on the official content outline`)).join("\n")}

## Guides

${GUIDES.map((g) => link(g.path, g.h1, g.summary)).join("\n")}

## Company

${link("/about", "About Argonaut USMLE", "who makes it and why")}
${link("/editorial-policy", "Editorial policy", "how questions are written, reviewed and corrected")}
${link("/terms", "Terms of service", "including what lifetime access means")}
${link("/privacy", "Privacy policy", "what data is collected and why")}
${link("/refunds", "Refund policy", `${REFUND_DAYS}-day refund terms`)}

## Optional

- [Sitemap](${SITE_URL}/sitemap.xml)
`;

  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
