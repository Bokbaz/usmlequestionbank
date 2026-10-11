// Structured data (schema.org JSON-LD). Every value must match what the page visibly says:
// no ratings, review counts, pass rates or affiliations we can't show. Pages combine these
// nodes into one @graph with <JsonLd>.

import { COMPANY } from "@/lib/legal";
import { OFFERS } from "@/lib/plans";
import { SITE_URL, SUPPORT_EMAIL } from "@/lib/utils";
import { SITE_NAME } from "./metadata";

export type Node = Record<string, unknown>;

export const ORG_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;
export const PRODUCT_ID = `${SITE_URL}/pricing#full-access`;
export const LOGO_URL = `${SITE_URL}/logo.png`;

export function absoluteUrl(path: string) {
  if (path.startsWith("http")) return path;
  return path === "/" ? SITE_URL : `${SITE_URL}${path}`;
}

export const ORG_DESCRIPTION =
  "Argonaut QBanks makes Argonaut USMLE, an online question bank for USMLE Step 1 and Step 2 CK with clinician-reviewed explanations and ARGO, an adaptive analytics engine that turns each student's answer history into targeted practice.";

export function organization(): Node {
  return {
    "@type": "Organization",
    "@id": ORG_ID,
    name: COMPANY,
    alternateName: SITE_NAME,
    url: SITE_URL,
    logo: { "@type": "ImageObject", url: LOGO_URL, width: 512, height: 512 },
    image: LOGO_URL,
    description: ORG_DESCRIPTION,
    email: SUPPORT_EMAIL,
    foundingDate: "2026",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Oakwood Lane, Kensington",
      addressLocality: "London",
      addressCountry: "GB",
    },
    contactPoint: { "@type": "ContactPoint", contactType: "customer support", email: SUPPORT_EMAIL, availableLanguage: ["English"] },
    brand: { "@type": "Brand", name: SITE_NAME, logo: LOGO_URL },
    publishingPrinciples: absoluteUrl("/editorial-policy"),
    knowsAbout: ["USMLE Step 1", "USMLE Step 2 CK", "Medical licensing exam preparation", "Adaptive learning", "Spaced repetition"],
  };
}

export function website(): Node {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: SITE_URL,
    name: SITE_NAME,
    alternateName: ["Argonaut", "argonautusmle.com"],
    description: "USMLE Step 1 and Step 2 CK question bank with free practice questions, a high-yield Library and ARGO adaptive analytics.",
    inLanguage: "en-US",
    publisher: { "@id": ORG_ID },
  };
}

export type Crumb = { name: string; path: string };

export function breadcrumbs(items: Crumb[]): Node {
  return {
    "@type": "BreadcrumbList",
    "@id": `${absoluteUrl(items.at(-1)?.path ?? "/")}#breadcrumb`,
    itemListElement: items.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: absoluteUrl(c.path) })),
  };
}

export function webPage({
  path,
  name,
  description,
  type = "WebPage",
  dateModified,
  crumbs,
  extra,
}: {
  path: string;
  name: string;
  description: string;
  type?: "WebPage" | "AboutPage" | "CollectionPage" | "ItemPage" | "FAQPage" | "ContactPage";
  dateModified?: string;
  crumbs?: Crumb[];
  extra?: Node;
}): Node {
  const url = absoluteUrl(path);
  return {
    "@type": type,
    "@id": `${url}#webpage`,
    url,
    name,
    description,
    inLanguage: "en-US",
    isPartOf: { "@id": WEBSITE_ID },
    publisher: { "@id": ORG_ID },
    ...(dateModified ? { dateModified } : {}),
    ...(crumbs ? { breadcrumb: { "@id": `${url}#breadcrumb` } } : {}),
    ...extra,
  };
}

// The one thing we sell: Full access, $48 once, both exams, no expiry.
export function fullAccessProduct(questionCount?: number): Node {
  const access = OFFERS.access;
  return {
    "@type": "Product",
    "@id": PRODUCT_ID,
    name: "Argonaut USMLE Full access",
    description: `One payment of $${access.amountUsd} for the whole Argonaut USMLE question bank for Step 1 and Step 2 CK${
      questionCount ? ` (${questionCount.toLocaleString("en-US")} questions)` : ""
    }: every answer choice explained, the high-yield Library and ARGO adaptive analytics. No subscription and no expiry date.`,
    brand: { "@type": "Brand", name: SITE_NAME },
    category: "USMLE question bank",
    image: LOGO_URL,
    url: absoluteUrl("/pricing"),
    offers: {
      "@type": "Offer",
      price: access.amountUsd.toFixed(2),
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: absoluteUrl("/pricing"),
      seller: { "@id": ORG_ID },
    },
  };
}

export function writerAddonProduct(): Node {
  const writer = OFFERS.writer;
  return {
    "@type": "Product",
    "@id": `${SITE_URL}/pricing#question-writing`,
    name: `Argonaut USMLE ${writer.name}`,
    description: `Optional add-on for Full access: ${writer.tagline} $${writer.amountUsd} a month, cancel anytime.`,
    brand: { "@type": "Brand", name: SITE_NAME },
    category: "USMLE question bank add-on",
    image: LOGO_URL,
    url: absoluteUrl("/pricing"),
    offers: {
      "@type": "Offer",
      price: writer.amountUsd.toFixed(2),
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: absoluteUrl("/pricing"),
      seller: { "@id": ORG_ID },
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: writer.amountUsd.toFixed(2),
        priceCurrency: "USD",
        referenceQuantity: { "@type": "QuantitativeValue", value: 1, unitCode: "MON" },
      },
    },
  };
}

// Guides and comparisons: written by the editorial team, published by Argonaut QBanks.
export function article({ path, headline, description, published, modified }: { path: string; headline: string; description: string; published: string; modified: string }): Node {
  const url = absoluteUrl(path);
  return {
    "@type": "Article",
    "@id": `${url}#article`,
    headline,
    description,
    inLanguage: "en-US",
    datePublished: published,
    dateModified: modified,
    author: EDITORIAL_TEAM,
    publisher: { "@id": ORG_ID },
    mainEntityOfPage: { "@id": `${url}#webpage` },
    isAccessibleForFree: true,
  };
}

// The links a collection page lists, in order.
export function itemList(path: string, name: string, items: { name: string; path: string }[]): Node {
  return {
    "@type": "ItemList",
    "@id": `${absoluteUrl(path)}#list`,
    name,
    numberOfItems: items.length,
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, url: absoluteUrl(it.path) })),
  };
}

// Visible FAQ only. Answers are plain text or Markdown with [links](/path), converted to HTML.
export function faqPage(path: string, items: { q: string; a: string }[]): Node {
  return {
    "@type": "FAQPage",
    "@id": `${absoluteUrl(path)}#faq`,
    mainEntity: items.map((i) => ({
      "@type": "Question",
      name: i.q,
      acceptedAnswer: { "@type": "Answer", text: markdownLinksToHtml(i.a) },
    })),
  };
}

function markdownLinksToHtml(s: string) {
  return s.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text: string, href: string) => `<a href="${absoluteUrl(href)}">${text}</a>`);
}

export const EDITORIAL_TEAM: Node = {
  "@type": "Organization",
  name: "Argonaut USMLE editorial team",
  url: absoluteUrl("/editorial-policy"),
  parentOrganization: { "@id": ORG_ID },
};
