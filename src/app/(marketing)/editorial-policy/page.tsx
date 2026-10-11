import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage, CtaBand, PageHero, Prose, Section } from "@/components/marketing/content";
import { JsonLd } from "@/components/seo/json-ld";
import { pageMetadata } from "@/lib/seo/metadata";
import { breadcrumbs, webPage } from "@/lib/seo/schema";
import { SUPPORT_EMAIL } from "@/lib/utils";

const PATH = "/editorial-policy";
const TITLE = "Editorial Policy: How Questions Are Reviewed";
const DESCRIPTION =
  "How Argonaut USMLE questions are made: NBME item-writing standards, AI drafting, clinician approval, duplicate checks, monitoring and corrections.";
const UPDATED = "11 October 2026";

export const metadata: Metadata = pageMetadata({ title: TITLE, description: DESCRIPTION, path: PATH });

// Keep this page true to the actual process. If the process changes (for example, named
// reviewers are added), change this page the same day.
const STEPS: [string, string][] = [
  [
    "Drafting",
    "AI drafts each question from licensed reference notes, following the item-writing rules below: a full clinical vignette, one best answer, an explanation for every choice and an educational objective. Drafts are written in our own words: never copied from references, and never based on real or recalled exam questions or on other question banks.",
  ],
  [
    "Clinical review",
    "A qualified clinician (MD or DO) checks the medical facts against current US practice, confirms the keyed answer is the single best answer, checks every explanation, and approves the question before it goes live. Questions that don't pass are fixed or dropped.",
  ],
  [
    "Placement",
    "Each question is placed in the USMLE content outline: exam, organ system, discipline, physician task and topic. That decides which blocks, Library chapters and ARGO analytics it feeds.",
  ],
  [
    "Duplicate check",
    "New questions are compared with the whole bank by meaning. One that tests the same point on the same exam as an existing question is set aside, so the bank doesn't pad its count with near-copies.",
  ],
  [
    "Monitoring",
    "Students can flag any question from its explanation as an error, unclear or outdated, and every report is read and resolved. Item statistics are tracked too: once enough students have answered, a question that looks miskeyed, or that weaker students get right more often than stronger ones, is flagged for another review.",
  ],
];

const RULES = [
  "A clinical or experimental vignette you have to interpret, not an isolated fact.",
  "A lead-in that is one complete question, answerable before you read the choices. No EXCEPT, NOT or LEAST questions.",
  "Answer choices of the same kind and similar length, with exactly one best answer and plausible alternatives.",
  "No cues: the right answer isn't the longest, the only one echoing the stem, or the only hedged option.",
  "Usually two steps: recognize what's going on, then answer about mechanism, treatment, complication or next step.",
  "US conventional units, with each vital sign and lab value on its own line.",
];

export default function EditorialPolicyPage() {
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Editorial policy", path: PATH },
  ];
  return (
    <ContentPage>
      <PageHero
        crumbs={crumbs}
        eyebrow={`Editorial policy · updated ${UPDATED}`}
        title="How Argonaut questions are written and reviewed"
        lead={
          <p>
            Every question is drafted with AI from reference notes, written to the NBME Item-Writing Guide, and reviewed and approved by a clinician before
            it goes live. This page explains each step, how we use AI, and how to report a problem.
          </p>
        }
      />

      <Section eyebrow="The standard" title="Written to the NBME Item-Writing Guide" intro={<p>The NBME publishes the rules its own question writers follow. Ours follow the same rules:</p>}>
        <ul className="grid gap-3 text-[16.5px] leading-relaxed">
          {RULES.map((r, i) => (
            <li key={r} className="grid grid-cols-[40px_1fr] gap-2 border-t border-border pt-3 first:border-t-2 first:border-text">
              <span className="readout pt-0.5 text-[13px] text-brand-strong">{String(i + 1).padStart(2, "0")}</span>
              {r}
            </li>
          ))}
        </ul>
      </Section>

      <Section tone="surface" eyebrow="The process" title="How a question is made">
        <ol className="grid gap-0">
          {STEPS.map(([t, d], i) => (
            <li key={t} className="grid grid-cols-[48px_1fr] gap-2 border-t border-border py-5 first:border-t-2 first:border-text">
              <span className="readout pt-1 text-[14px] text-brand-strong">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <h3 className="text-[19px] font-bold">{t}</h3>
                <p className="mt-1.5 max-w-[66ch] text-[15.5px] leading-relaxed text-muted">{d}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section eyebrow="Transparency" title="How we use AI">
        <Prose>
          <p>We use AI where it helps us write and check faster, and we say so:</p>
          <ul>
            <li>
              <strong>Bank questions</strong> are drafted with AI and then reviewed and approved by a clinician. We never describe an AI-drafted question as
              physician-written.
            </li>
            <li>
              <strong>Importing</strong> can use AI to suggest where a question belongs in the content outline. It doesn&apos;t rewrite medical content.
            </li>
            <li>
              <strong>ARGO question writing</strong>, the optional add-on, writes new questions for one student&apos;s weak spots. Each is answered blind by an
              independent AI solver and audited against its key before the student sees it; failures are discarded. These questions are private to that
              student: they are never published, never indexed and never added to the public bank.
            </li>
          </ul>
        </Prose>
      </Section>

      <Section tone="surface" eyebrow="Explanations" title="Explanations, the Library and Nuggets">
        <Prose>
          <p>
            Every question explains why the right answer is right and why each other choice is wrong for that patient, and states the educational objective:
            the rule worth remembering.
          </p>
          <p>
            <Link href="/library">Library</Link> chapters collect the educational objectives of every question on one topic, so they carry the same review.
            When new questions on a topic go live, its chapter is rebuilt.
          </p>
          <p>
            Nuggets mark questions that test a classic, frequently examined fact. They are found by comparing each question&apos;s tested concept with a
            private index of high-yield facts; borderline matches are checked by an editor, and every Nugget card is written in our own words.
          </p>
        </Prose>
      </Section>

      <Section eyebrow="Corrections" title="Found a problem? Tell us.">
        <Prose>
          <p>
            Medicine changes and mistakes happen. In the app, flag the question from its explanation. On the public site, every question page has a
            &quot;Report a problem&quot; link, or email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> with the question code (such as AQ-1053).
          </p>
          <p>
            Every report is read. We correct the question, retire it, or confirm it and explain why. The date on each question is the last time its record
            changed.
          </p>
        </Prose>
      </Section>

      <Section tone="surface" eyebrow="Independence" title="Sources, conflicts and limits">
        <Prose>
          <p>
            <strong>Sources.</strong> Reference notes are licensed material used while drafting; we don&apos;t reproduce them. We never use real exam questions,
            recalled items or questions from other banks.
          </p>
          <p>
            <strong>Conflicts.</strong> We sell Argonaut, so pages that compare us with other question banks are written by us and say so. We don&apos;t take
            payment for placements, and we don&apos;t use affiliate links.
          </p>
          <p>
            <strong>Not affiliated.</strong> Argonaut is not affiliated with or endorsed by the FSMB, the NBME or the USMLE program. Our questions are original
            practice material.
          </p>
          <p>
            <strong>Not medical advice.</strong> Argonaut is for exam preparation only and must never be used to diagnose or treat a patient.
          </p>
        </Prose>
      </Section>

      <CtaBand
        title="Judge the questions yourself."
        body="Every free question shows the full explanation, who wrote it and when it was last updated."
        primary={{ href: "/free-usmle-practice-questions", label: "Try free questions" }}
        secondary={{ href: "/about", label: "About Argonaut" }}
      />

      <JsonLd graph={[breadcrumbs(crumbs), webPage({ path: PATH, name: `${TITLE} | Argonaut USMLE`, description: DESCRIPTION, crumbs, dateModified: "2026-10-11" })]} />
    </ContentPage>
  );
}
