import type { Metadata } from "next";
import { ContentPage, CtaBand, LinkRows, PageHero, Section } from "@/components/marketing/content";
import { JsonLd } from "@/components/seo/json-ld";
import { GUIDES } from "@/lib/public/guides";
import { pageMetadata } from "@/lib/seo/metadata";
import { breadcrumbs, itemList, webPage } from "@/lib/seo/schema";

const PATH = "/guides";
const TITLE = "USMLE Study Guides: Exam Format, Study Plans and Qbanks";
const DESCRIPTION =
  "Practical USMLE guides: the 2026 exam format, Step 1 and Step 2 CK study plans, how to review Qbank questions and how the major question banks compare.";

export const metadata: Metadata = pageMetadata({ title: TITLE, description: DESCRIPTION, path: PATH, ownImage: true });

export default function GuidesIndex() {
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Guides", path: PATH },
  ];
  return (
    <ContentPage>
      <PageHero
        crumbs={crumbs}
        eyebrow="Guides"
        title="USMLE study guides"
        lead={<p>Short, practical guides to the exam and to studying for it. Every fact about the exam links to its official source.</p>}
      />
      <Section eyebrow="All guides" title="Read these first" split={false}>
        <LinkRows items={GUIDES.map((g) => ({ href: g.path, title: g.h1, body: g.summary }))} />
      </Section>
      <CtaBand
        title="Then put it into practice."
        body="Free Step 1 and Step 2 CK questions with full explanations. No account needed."
        primary={{ href: "/free-usmle-practice-questions", label: "Free questions" }}
        secondary={{ href: "/pricing", label: "Pricing" }}
      />
      <JsonLd
        graph={[
          breadcrumbs(crumbs),
          webPage({ path: PATH, name: `${TITLE} | Argonaut USMLE`, description: DESCRIPTION, type: "CollectionPage", crumbs }),
          itemList(PATH, "USMLE study guides", GUIDES.map((g) => ({ name: g.h1, path: g.path }))),
        ]}
      />
    </ContentPage>
  );
}
