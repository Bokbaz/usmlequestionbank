import Link from "next/link";
import { Fragment } from "react";

// Short copy with **bold** and [links](/path), for FAQ answers and similar one-paragraph text.
// The same strings feed FAQPage structured data, so keep them plain.
export function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g);
  return (
    <>
      {parts.map((p, i) => {
        const bold = p.match(/^\*\*([^*]+)\*\*$/);
        if (bold) return <strong key={i} className="font-semibold text-text">{bold[1]}</strong>;
        const link = p.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (link) {
          const [, label, href] = link;
          const cls = "font-semibold text-text underline decoration-brand-strong decoration-2 underline-offset-4 hover:decoration-text";
          // Internal pages use client navigation; files (such as /downloads/x.csv) and other sites don't.
          return href.startsWith("/") && !/\.[a-z0-9]+$/i.test(href) ? (
            <Link key={i} href={href} className={cls}>
              {label}
            </Link>
          ) : (
            <a key={i} href={href} className={cls} {...(href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}>
              {label}
            </a>
          );
        }
        return <Fragment key={i}>{p}</Fragment>;
      })}
    </>
  );
}
