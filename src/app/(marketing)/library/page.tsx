import type { Metadata } from "next";
import { Container, ContentPage, CtaBand, LinkRows, PageHero, Section } from "@/components/marketing/content";
import { Faq, type FaqItem } from "@/components/marketing/faq";
import { LibraryIndex } from "@/components/marketing/library-index";
import { JsonLd } from "@/components/seo/json-ld";
import { getBankStats, getLibraryCatalog } from "@/lib/public/content";
import { pageMetadata } from "@/lib/seo/metadata";
import { breadcrumbs, faqPage, itemList, webPage } from "@/lib/seo/schema";

export const revalidate = 3600;

const PATH = "/library";
const TITLE = "High-Yield USMLE Library: Step 1 and Step 2 CK Topics";

async function description() {
  const stats = await getBankStats().catch(() => null);
  return stats
    ? `Browse ${stats.chapters} concise, high-yield USMLE chapters by organ system, each linked to practice questions. ${stats.freeChapters} chapters are free to read, no login.`
    : "Browse concise, high-yield USMLE chapters by organ system, each linked to practice questions. Free chapters are open to read, no login.";
}

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({ title: TITLE, description: await description(), path: PATH, ownImage: true });
}

// Public catalogue (audit A06). Signed-in students are rewritten to their in-app Library.
export default async function LibraryPage() {
  const [catalog, desc] = await Promise.all([getLibraryCatalog(), description()]);
  const free = catalog.filter((c) => c.free);
  const systems = new Set(catalog.map((c) => c.system.slug)).size;
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Library", path: PATH },
  ];
  const faq: FaqItem[] = [
    {
      q: "Is the Library free?",
      a: `${free.length} chapters are free to read here, no account needed. The other ${catalog.length - free.length} are part of Full access, $48 once with the whole question bank. [See pricing](/pricing).`,
    },
    {
      q: "What's in a chapter?",
      a: "The key takeaways for one topic, a few minutes of reading: what each question on that topic is designed to teach, collected in one place. Nugget chapters include facts the exam returns to again and again.",
    },
    {
      q: "Where do the chapters come from?",
      a: "Each chapter collects the educational objectives of the questions on that topic, which a clinician reviews along with each question, with repeats removed. When new questions on a topic go live, its chapter is rebuilt. [How we write and review content](/editorial-policy).",
    },
    {
      q: "How do chapters connect to the questions?",
      a: "Every chapter lists the questions that test it. Free chapters link to free practice questions on the same topic, and in the app one click turns a chapter into a practice block.",
    },
  ];

  return (
    <ContentPage>
      <PageHero
        crumbs={crumbs}
        eyebrow={`${catalog.length} chapters · ${free.length} free`}
        title="High-yield USMLE library"
        lead={
          <p>
            {catalog.length} short chapters for Step 1 and Step 2 CK across {systems} organ systems, organized by the USMLE content outline. Each collects the key
            takeaways of the questions on one topic. {free.length} are free to read now; the rest come with Full access.
          </p>
        }
      />

      <Section eyebrow="Start here" title="Free chapters" intro={<p>Read these now, no account needed. Each links to practice questions on the same topic.</p>}>
        <LinkRows
          items={free.slice(0, 24).map((c) => ({
            href: `/library/${c.slug}`,
            title: c.title,
            body: c.summary ?? undefined,
            meta: `${c.system.short} · ${c.minutes} min`,
          }))}
        />
        {free.length > 24 && <p className="mt-5 text-[15px] text-muted">All {free.length} free chapters are tagged Free in the full catalogue below.</p>}
      </Section>

      <section id="catalogue" className="border-t border-border bg-surface">
        <Container className="py-16 md:py-24">
          <p className="eyebrow text-brand-strong">Full catalogue</p>
          <h2 className="display mt-5 text-[clamp(30px,3.4vw,48px)] font-bold">Every chapter, by organ system</h2>
          <div className="mt-10">
            <LibraryIndex chapters={catalog} />
          </div>
        </Container>
      </section>

      <section className="border-t border-border bg-bg">
        <Container className="grid gap-12 py-20 lg:grid-cols-12">
          <h2 className="display text-[clamp(32px,3.6vw,52px)] font-bold lg:col-span-4">About the Library</h2>
          <div className="lg:col-span-8">
            <Faq items={faq} />
          </div>
        </Container>
      </section>

      <CtaBand
        title="Read it. Then drill it."
        body="Full access unlocks every chapter and every question, and turns any chapter into a practice block in one click."
        primary={{ href: "/signup", label: "Start free" }}
        secondary={{ href: "/free-usmle-practice-questions", label: "Free questions" }}
      />

      <JsonLd
        graph={[
          breadcrumbs(crumbs),
          webPage({ path: PATH, name: `${TITLE} | Argonaut USMLE`, description: desc, type: "CollectionPage", crumbs }),
          itemList(PATH, "Free USMLE Library chapters", free.map((c) => ({ name: c.title, path: `/library/${c.slug}` }))),
          faqPage(PATH, faq),
        ]}
      />
    </ContentPage>
  );
}
