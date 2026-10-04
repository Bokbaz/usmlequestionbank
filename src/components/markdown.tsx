import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Children, isValidElement } from "react";
import { NuggetGlyph } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function textOf(node: React.ReactNode): string {
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (isValidElement(node)) return textOf((node.props as { children?: React.ReactNode }).children);
  return "";
}

// Markdown for explanations and Library chapters. Blockquotes beginning with
// [!NUGGET], [!PEARL] or [!TRAP] render as callouts.
export function Markdown({ children, className, serif }: { children: string; className?: string; serif?: boolean }) {
  return (
    <div className={cn("prose-argo", serif && "serif", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          blockquote({ children }) {
            const first = Children.toArray(children).find((c) => isValidElement(c));
            const raw = textOf(first as React.ReactNode).trim();
            const m = raw.match(/^\[!(NUGGET|PEARL|TRAP)\]/i);
            if (!m) return <blockquote>{children}</blockquote>;
            const kind = m[1].toUpperCase();
            const stripped = Children.map(children, (c, i) => {
              if (c !== first || !isValidElement(c)) return c;
              const props = c.props as { children?: React.ReactNode };
              const kids = Children.toArray(props.children);
              if (typeof kids[0] === "string") kids[0] = (kids[0] as string).replace(/^\s*\[![A-Z]+\]\s*/i, "");
              return <p key={i}>{kids}</p>;
            });
            return (
              <div
                className={cn(
                  "not-prose my-5 rounded-[10px] p-4 font-sans text-[15px] leading-relaxed",
                  kind === "NUGGET" ? "bg-gold-soft" : kind === "TRAP" ? "bg-incorrect-soft" : "bg-brand-soft",
                )}
              >
                <p className={cn("eyebrow mb-1.5 flex items-center gap-1.5", kind === "NUGGET" ? "text-gold-ink" : kind === "TRAP" ? "text-incorrect" : "text-brand-strong")}>
                  {kind === "NUGGET" && <NuggetGlyph className="size-3.5" />}
                  {kind === "NUGGET" ? "Nugget" : kind === "TRAP" ? "Common trap" : "Clinical pearl"}
                </p>
                {stripped}
              </div>
            );
          },
          a({ href, children }) {
            const external = href?.startsWith("http");
            return (
              <a href={href} {...(external ? { target: "_blank", rel: "noreferrer" } : {})}>
                {children}
              </a>
            );
          },
          table({ children }) {
            return <table>{children}</table>;
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
