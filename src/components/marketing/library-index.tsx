import Link from "next/link";
import { NuggetGlyph } from "@/components/ui/badge";
import type { ChapterSummary } from "@/lib/public/content";
import { LibraryFilter } from "./library-filter";

// The public catalogue: every chapter title by organ system, as plain links. Compact on purpose
// (600+ rows): no summaries, and the search box filters these rows in place instead of shipping
// the catalogue to the browser a second time.
export function LibraryIndex({ chapters }: { chapters: ChapterSummary[] }) {
  const groups = new Map<string, { name: string; items: ChapterSummary[] }>();
  for (const c of chapters) {
    const g = groups.get(c.system.slug) ?? { name: c.system.short, items: [] };
    g.items.push(c);
    groups.set(c.system.slug, g);
  }
  return (
    <div className="grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)]">
      <nav aria-label="Systems" className="hidden lg:block">
        <ul className="sticky top-24 grid gap-0.5">
          {[...groups.entries()].map(([slug, g]) => (
            <li key={slug}>
              <a href={`#${slug}`} className="flex justify-between rounded-[6px] px-2.5 py-1.5 text-[13.5px] text-muted hover:bg-panel hover:text-text">
                <span className="truncate">{g.name}</span>
                <span className="tabular text-[12px] text-faint">{g.items.length}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <div id="library-index">
        <LibraryFilter target="library-index" total={chapters.length} />
        {[...groups.entries()].map(([slug, g]) => (
          <section key={slug} id={slug} data-group className="mt-10 scroll-mt-24">
            <h3 className="eyebrow border-b-2 border-text pb-2 text-muted">{g.name}</h3>
            {/* Row styles live on the list so 600+ rows stay small in the HTML. */}
            <ul className="mt-3 gap-x-8 text-[15px] text-muted sm:columns-2 xl:columns-3 [&_a:hover]:text-text [&_a:hover]:underline [&_b]:font-semibold [&_b]:text-text [&_i]:ml-1.5 [&_i]:text-[11.5px] [&_i]:font-bold [&_i]:not-italic [&_i]:uppercase [&_i]:text-brand-strong [&>li]:break-inside-avoid [&>li]:py-1">
              {g.items.map((c) => (
                <li key={c.id}>
                  <Link href={`/library/${c.slug}`}>{c.free ? <b>{c.title}</b> : c.title}</Link>
                  {c.free && <i>Free</i>}
                  {c.nugget && <NuggetGlyph className="ml-1.5 inline size-3" />}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
