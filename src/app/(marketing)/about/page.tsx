import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage, CtaBand, FactSheet, LinkRows, PageHero, Prose, Section } from "@/components/marketing/content";
import { JsonLd } from "@/components/seo/json-ld";
import { COMPANY, COMPANY_ADDRESS } from "@/lib/legal";
import { getBankStats } from "@/lib/public/content";
import { pageMetadata } from "@/lib/seo/metadata";
import { ORG_ID, breadcrumbs, organization, webPage } from "@/lib/seo/schema";
import { SUPPORT_EMAIL } from "@/lib/utils";

export const revalidate = 3600;

const PATH = "/about";
const TITLE = "About Argonaut USMLE: Who We Are and How We Work";
const DESCRIPTION =
  "Argonaut USMLE is a Step 1 and Step 2 CK question bank by Argonaut QBanks, London. Who we are, why we built it, how we review questions and how to reach us.";

export const metadata: Metadata = pageMetadata({ title: { absolute: TITLE }, description: DESCRIPTION, path: PATH });

export default async function AboutPage() {
  const stats = await getBankStats().catch(() => null);
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "About", path: PATH },
  ];
  return (
    <ContentPage>
      <PageHero
        crumbs={crumbs}
        eyebrow={`${COMPANY} · London`}
        title="About Argonaut USMLE"
        lead={
          <p>
            Argonaut USMLE is an online question bank for USMLE Step 1 and Step 2 CK, made by {COMPANY} in London. We built it to give every medical student
            big-bank question quality at a price they can actually afford.
          </p>
        }
      />

      <Section eyebrow="What we make" title="A question bank that studies you">
        <Prose>
          <p>
            The bank{stats ? ` has ${stats.total.toLocaleString("en-US")} exam-style questions (${stats.exams.step1.total.toLocaleString("en-US")} for Step 1 and ${stats.exams.step2ck.total.toLocaleString("en-US")} for Step 2 CK)` : " covers Step 1 and Step 2 CK"}, each a
            full clinical vignette with every answer choice explained. Around it sit{" "}
            <Link href="/features/argo">ARGO</Link>, our analytics engine that builds each student&apos;s next session around their weak spots; a{" "}
            <Link href="/library">high-yield Library</Link>; and a free <Link href="/daily">Daily Challenge</Link>.
          </p>
          <p>
            It costs $48, once, for both exams and with no expiry date. {stats ? `${stats.publicQuestions} questions and ${stats.freeChapters} Library chapters are free to use without an account.` : "Free questions and Library chapters need no account."}
          </p>
        </Prose>
      </Section>

      <Section tone="surface" eyebrow="Why we built it" title="Two missions, in plain words">
        <div className="grid gap-10 md:grid-cols-2">
          <div className="border-t-2 border-text pt-4">
            <h3 className="text-[19px] font-bold">Get every student the score they want</h3>
            <p className="mt-2 text-[16px] leading-relaxed text-muted">
              A Step 1 pass they never had to sweat, and a Step 2 CK score they&apos;re proud of. Questions that feel like the exam, explanations that teach,
              and practice aimed at what each student actually gets wrong.
            </p>
          </div>
          <div className="border-t-2 border-text pt-4">
            <h3 className="text-[19px] font-bold">Make good preparation affordable</h3>
            <p className="mt-2 text-[16px] leading-relaxed text-muted">
              The most important exam of your career shouldn&apos;t come with a monthly bill. $48 once, with no renewal, is our answer, especially for
              international graduates studying on their own budget.
            </p>
          </div>
        </div>
      </Section>

      <Section eyebrow="How we work" title="How questions are written and checked">
        <Prose>
          <p>
            Each question is drafted with AI from reference notes and written to the NBME Item-Writing Guide: a full patient case, one best answer and an
            explanation for every choice. A clinician then reviews the facts, the keyed answer and every explanation, and approves the question before it goes
            live. Students can flag any question, and every report is read.
          </p>
          <p>
            We say plainly where AI is used, and we never call an AI-drafted question physician-written. The <Link href="/editorial-policy">editorial policy</Link>{" "}
            has the full process, including corrections.
          </p>
        </Prose>
      </Section>

      <Section tone="panel" eyebrow="The company" title="Who we are">
        <div className="grid gap-10 md:grid-cols-2">
          <FactSheet
            rows={[
              ["Company", COMPANY],
              ["Based in", "London, United Kingdom"],
              ["Founded", "2026"],
              ["Exams", "Step 1 and Step 2 CK"],
              ["Coming next", "Step 3"],
              ["Price", "$48 once"],
            ]}
          />
          <div className="text-[16px] leading-relaxed text-muted">
            <p>
              <span className="font-semibold text-text">Independent.</span> Argonaut is not affiliated with, endorsed by or sponsored by the Federation of State
              Medical Boards (FSMB), the National Board of Medical Examiners (NBME) or the USMLE program. USMLE® is a registered trademark of the FSMB and NBME.
              Our questions are original practice material, not real exam questions.
            </p>
            <p className="mt-4">
              <span className="font-semibold text-text">Educational, not medical advice.</span> Argonaut is a study tool. Nothing on it should be used to
              diagnose or treat a patient.
            </p>
          </div>
        </div>
      </Section>

      <Section eyebrow="Contact" title="Talk to a person">
        <div className="grid gap-10 md:grid-cols-2">
          <div className="text-[17px] leading-relaxed">
            <p>
              Email{" "}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold underline decoration-brand-strong decoration-2 underline-offset-4">
                {SUPPORT_EMAIL}
              </a>
              . A real person reads every message.
            </p>
            <p className="mt-4 text-muted">
              Post: {COMPANY}, {COMPANY_ADDRESS}.
            </p>
          </div>
          <LinkRows
            items={[
              { href: "/editorial-policy", title: "Editorial policy", body: "How questions are written, reviewed and corrected" },
              { href: "/pricing", title: "Pricing", body: "$48 once, what's included, refunds" },
              { href: "/privacy", title: "Privacy policy", body: "What we collect and why" },
            ]}
          />
        </div>
      </Section>

      <CtaBand title="See for yourself." body="Answer a few free questions. No account, no card." primary={{ href: "/free-usmle-practice-questions", label: "Try free questions" }} secondary={{ href: "/signup", label: "Start free" }} />

      <JsonLd graph={[breadcrumbs(crumbs), webPage({ path: PATH, name: TITLE, description: DESCRIPTION, type: "AboutPage", crumbs, extra: { mainEntity: { "@id": ORG_ID } } }), organization()]} />
    </ContentPage>
  );
}
