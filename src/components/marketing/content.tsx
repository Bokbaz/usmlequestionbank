import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Ruler } from "@/components/marketing/ruler";
import { SiteHeader } from "@/components/marketing/site-header";
import type { Crumb } from "@/lib/seo/schema";
import { cn } from "@/lib/utils";

// Building blocks for the public content pages (exam pages, free questions, Library, guides).
// Same language as the homepage: eyebrow labels, display headlines, 2px timing-sheet rules.

export function ContentPage({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader overHero={false} />
      <main className="bg-bg pt-16">{children}</main>
    </>
  );
}

export function Container({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("mx-auto max-w-[1320px] px-5 md:px-8", className)}>{children}</div>;
}

// Visible trail; pair it with breadcrumbs() in the page's JSON-LD.
export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[13px] font-semibold text-muted">
        {items.map((c, i) => {
          const last = i === items.length - 1;
          return (
            <li key={c.path} className="flex items-center gap-1.5">
              {last ? (
                <span aria-current="page" className="text-text">
                  {c.name}
                </span>
              ) : (
                <>
                  <Link href={c.path} className="hover:text-text hover:underline hover:underline-offset-4">
                    {c.name}
                  </Link>
                  <ChevronRight aria-hidden className="size-3.5 text-faint" />
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function PageHero({
  crumbs,
  eyebrow,
  title,
  lead,
  actions,
  note,
  children,
}: {
  crumbs: Crumb[];
  eyebrow: React.ReactNode;
  title: React.ReactNode;
  lead: React.ReactNode;
  actions?: React.ReactNode;
  note?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <Container className="pb-14 pt-8 md:pt-12">
      <Breadcrumbs items={crumbs} />
      <div className="mt-10 grid gap-8 border-b-2 border-text pb-10 lg:grid-cols-12 lg:items-end lg:gap-12">
        <div className="lg:col-span-7">
          <p className="eyebrow text-brand-strong">{eyebrow}</p>
          <h1 className="display mt-5 text-[clamp(38px,5.4vw,78px)] font-bold">{title}</h1>
        </div>
        <div className="lg:col-span-5">
          <div className="max-w-[46ch] text-[18px] leading-relaxed text-muted">{lead}</div>
          {actions && <div className="mt-7 flex flex-wrap items-center gap-3">{actions}</div>}
          {note && <p className="mt-4 text-[14px] font-medium text-muted">{note}</p>}
        </div>
      </div>
      {children}
    </Container>
  );
}

const TONES = {
  bg: "bg-bg",
  surface: "border-t border-border bg-surface",
  panel: "border-y border-border bg-panel",
  ink: "bg-ink text-on-ink",
} as const;

export function Section({
  id,
  eyebrow,
  title,
  intro,
  children,
  tone = "bg",
  split = true,
  className,
}: {
  id?: string;
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  intro?: React.ReactNode;
  children?: React.ReactNode;
  tone?: keyof typeof TONES;
  /** Title column on the left (default), or title above the content. */
  split?: boolean;
  className?: string;
}) {
  const ink = tone === "ink";
  return (
    <section id={id} className={cn(TONES[tone], "scroll-mt-20")}>
      <Container className={cn("py-16 md:py-24", className)}>
        <div className={cn("grid gap-10", split && "lg:grid-cols-12 lg:gap-12")}>
          <div className={cn(split && "lg:col-span-4")}>
            {eyebrow && <p className={cn("eyebrow", ink ? "text-signal" : "text-brand-strong")}>{eyebrow}</p>}
            <h2 className={cn("display text-[clamp(30px,3.4vw,48px)] font-bold", eyebrow && "mt-5", split ? "max-w-[16ch]" : "max-w-[24ch]")}>{title}</h2>
            {intro && <div className={cn("mt-5 max-w-[46ch] text-[16.5px] leading-relaxed", ink ? "text-on-ink-muted" : "text-muted")}>{intro}</div>}
          </div>
          {children && <div className={cn("min-w-0", split && "lg:col-span-8")}>{children}</div>}
        </div>
      </Container>
    </section>
  );
}

// A timing sheet: label, dashed leader, value.
export function FactSheet({ rows, className, ink }: { rows: [React.ReactNode, React.ReactNode][]; className?: string; ink?: boolean }) {
  return (
    <dl className={cn("grid gap-3 text-[15px]", className)}>
      {rows.map(([k, v], i) => (
        <div key={i} className="flex items-baseline gap-3">
          <dt className={cn("shrink-0", ink ? "text-on-ink-muted" : "text-muted")}>{k}</dt>
          <span aria-hidden className={cn("h-px min-w-6 flex-1 translate-y-[-3px] border-b border-dashed", ink ? "border-on-ink/25" : "border-border-strong")} />
          <dd className={cn("text-right font-semibold", ink ? "text-on-ink" : "text-text")}>{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export type LinkRow = { href: string; title: React.ReactNode; body?: React.ReactNode; meta?: React.ReactNode };

// Ruled rows of links (not a card grid): related pages, question lists, chapter lists.
export function LinkRows({ items, className }: { items: LinkRow[]; className?: string }) {
  return (
    <ul className={cn("border-t-2 border-text", className)}>
      {items.map((it) => (
        <li key={it.href} className="border-b border-border">
          <Link href={it.href} className="group grid grid-cols-[1fr_auto] items-start gap-x-6 gap-y-1 py-4 transition-colors hover:bg-panel/60 sm:px-2">
            <span className="min-w-0">
              <span className="block text-[16px] font-bold leading-snug text-text group-hover:underline group-hover:decoration-brand-strong group-hover:decoration-2 group-hover:underline-offset-4">
                {it.title}
              </span>
              {it.body && <span className="mt-1 block text-[14.5px] leading-snug text-muted">{it.body}</span>}
            </span>
            <span className="flex items-center gap-3 pt-0.5">
              {it.meta && <span className="hidden text-[13px] text-faint sm:inline">{it.meta}</span>}
              <ArrowRight aria-hidden className="size-4 text-faint transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-text" />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function Prose({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("grid max-w-[68ch] gap-5 text-[17px] leading-[1.7] text-text [&_a]:font-semibold [&_a]:underline [&_a]:decoration-brand-strong [&_a]:decoration-2 [&_a]:underline-offset-4 [&_h3]:mt-4 [&_h3]:text-[19px] [&_h3]:font-bold [&_li]:mt-1.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_li::marker]:text-faint", className)}>{children}</div>;
}

export function SourceNote({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("text-[13px] leading-relaxed text-faint [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-text", className)}>{children}</p>;
}

// The teal closing call, as on the homepage.
export function CtaBand({
  title,
  body,
  primary = { href: "/signup", label: "Start free" },
  secondary,
}: {
  title: React.ReactNode;
  body?: React.ReactNode;
  primary?: { href: string; label: string };
  secondary?: { href: string; label: string };
}) {
  return (
    <section className="on-signal relative overflow-hidden bg-brand text-on-brand">
      <Ruler id="ruler-cta" className="block text-on-brand/50" />
      <Container className="flex flex-col gap-10 py-20 md:py-28 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="display max-w-[16ch] text-[clamp(38px,5.4vw,84px)] font-bold">{title}</h2>
          {body && <p className="mt-6 max-w-[48ch] text-[17px] leading-relaxed text-on-brand-muted">{body}</p>}
        </div>
        <div className="shrink-0">
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="carbon" size="xl" className="group">
              <Link href={primary.href}>
                {primary.label} <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
            </Button>
            {secondary && (
              <Button asChild variant="carbon-outline" size="xl">
                <Link href={secondary.href}>{secondary.label}</Link>
              </Button>
            )}
          </div>
          <p className="readout mt-4 text-[13px] text-on-brand-muted">$48 · once · Step 1 + Step 2 CK</p>
        </div>
      </Container>
    </section>
  );
}

// Primary and secondary page actions on light surfaces.
export function Actions({ primary, secondary }: { primary: { href: string; label: string }; secondary?: { href: string; label: string } }) {
  return (
    <>
      <Button asChild size="xl" className="group">
        <Link href={primary.href}>
          {primary.label} <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
      </Button>
      {secondary && (
        <Button asChild size="xl" variant="secondary">
          <Link href={secondary.href}>{secondary.label}</Link>
        </Button>
      )}
    </>
  );
}
