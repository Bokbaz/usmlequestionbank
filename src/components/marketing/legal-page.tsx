import Link from "next/link";
import { SiteHeader } from "@/components/marketing/site-header";
import { Markdown } from "@/components/markdown";
import { SUPPORT_EMAIL } from "@/lib/utils";

const DOCS = [
  { href: "/terms", label: "Terms of service" },
  { href: "/privacy", label: "Privacy policy" },
  { href: "/refunds", label: "Refund policy" },
];

export function LegalPage({ title, updated, path, body }: { title: string; updated: string; path: string; body: string }) {
  return (
    <>
      <SiteHeader overHero={false} />
      <main className="bg-bg pt-16">
        <div className="mx-auto grid max-w-[1320px] gap-12 px-5 pb-24 pt-16 md:px-8 md:pt-20 lg:grid-cols-12">
          <aside className="lg:col-span-3">
            <nav aria-label="Legal" className="grid gap-1 border-t-2 border-text pt-4 lg:sticky lg:top-24">
              {DOCS.map((d) => (
                <Link
                  key={d.href}
                  href={d.href}
                  aria-current={d.href === path ? "page" : undefined}
                  className="rounded-[4px] px-2.5 py-1.5 text-[14.5px] font-bold text-muted hover:bg-panel hover:text-text aria-[current=page]:bg-ink aria-[current=page]:text-on-ink"
                >
                  {d.label}
                </Link>
              ))}
              <p className="mt-4 px-2.5 text-[13px] leading-relaxed text-muted">
                Questions about any of this?
                <a href={`mailto:${SUPPORT_EMAIL}`} className="block font-semibold text-brand-strong hover:underline">
                  {SUPPORT_EMAIL}
                </a>
              </p>
            </nav>
          </aside>
          <article className="min-w-0 lg:col-span-8 lg:col-start-5">
            <p className="eyebrow text-brand-strong">Legal</p>
            <h1 className="display mt-5 text-[clamp(36px,4.6vw,64px)] font-bold">{title}</h1>
            <p className="readout mt-4 text-[13px] text-muted">Last updated {updated}</p>
            <Markdown className="mt-10 max-w-[72ch]">{body}</Markdown>
          </article>
        </div>
      </main>
    </>
  );
}
