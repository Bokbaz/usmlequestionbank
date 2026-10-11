import type { Node } from "@/lib/seo/schema";

// One <script type="application/ld+json"> per page, as a schema.org @graph. "<" is escaped so
// content from the database can't close the script tag.
export function JsonLd({ graph }: { graph: Node[] }) {
  const data = { "@context": "https://schema.org", "@graph": graph };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
