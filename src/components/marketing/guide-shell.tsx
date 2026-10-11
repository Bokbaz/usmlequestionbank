import type { Metadata } from "next";
import { Container, ContentPage, CtaBand, LinkRows, PageHero } from "@/components/marketing/content";
import { Faq, type FaqItem } from "@/components/marketing/faq";
import { JsonLd } from "@/components/seo/json-ld";
import { GUIDES, guide as findGuide } from "@/lib/public/guides";
import { pageMetadata } from "@/lib/seo/metadata";
import { article, breadcrumbs, faqPage, webPage } from "@/lib/seo/schema";

export function guideMetadata(path: string): Metadata {
  const g = findGuide(path);
  return pageMetadata({ title: { absolute: `${g.title} | Argonaut USMLE` }, description: g.description, path: g.path, type: "article", modifiedTime: g.updated, ownImage: true });
}

const fmt = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

// Shared frame for guides and comparisons: hero with an answer-first summary, the guide's own
// sections, an FAQ, related guides and the closing call. Article, breadcrumb and FAQ markup included.
export function GuideShell({
  path,
  summary,
  children,
  faq,
  cta,
  kind = "Guide",
}: {
  path: string;
  /** Two or three sentences that answer the page's question outright. */
  summary: React.ReactNode;
  children: React.ReactNode;
  faq: FaqItem[];
  cta: { title: string; body: string; primary: { href: string; label: string }; secondary?: { href: string; label: string } };
  kind?: "Guide" | "Comparison";
}) {
  const g = findGuide(path);
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Guides", path: "/guides" },
    { name: g.h1, path },
  ];
  const related = GUIDES.filter((x) => x.path !== path).slice(0, 4);
  return (
    <ContentPage>
      <PageHero
        crumbs={crumbs}
        eyebrow={`${kind} · updated ${fmt(g.updated)}`}
        title={g.h1}
        lead={<div className="text-[18px] leading-relaxed">{summary}</div>}
        note="By the Argonaut editorial team."
      />
      {children}
      <section className="border-t border-border bg-surface">
        <Container className="grid gap-12 py-20 lg:grid-cols-12">
          <h2 className="display text-[clamp(32px,3.6vw,52px)] font-bold lg:col-span-4">Questions people ask</h2>
          <div className="lg:col-span-8">
            <Faq items={faq} />
          </div>
        </Container>
      </section>
      <section className="border-t border-border bg-bg">
        <Container className="grid gap-10 py-16 lg:grid-cols-12">
          <h2 className="display text-[clamp(28px,3vw,40px)] font-bold lg:col-span-4">More guides</h2>
          <div className="lg:col-span-8">
            <LinkRows items={related.map((r) => ({ href: r.path, title: r.h1, body: r.summary }))} />
          </div>
        </Container>
      </section>
      <CtaBand title={cta.title} body={cta.body} primary={cta.primary} secondary={cta.secondary} />
      <JsonLd
        graph={[
          breadcrumbs(crumbs),
          webPage({ path, name: `${g.title} | Argonaut USMLE`, description: g.description, crumbs, dateModified: g.updated }),
          article({ path, headline: g.h1, description: g.description, published: g.published, modified: g.updated }),
          faqPage(path, faq),
        ]}
      />
    </ContentPage>
  );
}
