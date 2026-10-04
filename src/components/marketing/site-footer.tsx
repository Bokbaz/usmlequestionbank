import Link from "next/link";
import { Logo } from "@/components/brand/logo";

const COLS = [
  {
    title: "Product",
    links: [
      { href: "/daily", label: "Daily Challenge" },
      { href: "/daily/leaderboard", label: "Leaderboard" },
      { href: "/#argo", label: "ARGO analytics" },
      { href: "/pricing", label: "Pricing" },
    ],
  },
  {
    title: "Study",
    links: [
      { href: "/library", label: "High-yield Library" },
      { href: "/qbank", label: "Question bank" },
      { href: "/nuggets", label: "Nuggets" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/login", label: "Log in" },
      { href: "/signup", label: "Create account" },
      { href: "/settings", label: "Settings" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-ink text-on-ink">
      <div className="mx-auto grid max-w-[1240px] gap-12 px-5 py-16 md:grid-cols-[1.4fr_repeat(3,1fr)] md:px-8">
        <div className="max-w-[34ch]">
          <Logo tone="inverse" />
          <p className="mt-4 text-[14px] leading-relaxed text-on-ink-muted">
            USMLE preparation built around one idea: practice should adapt to the student. Powered by ARGO.
          </p>
        </div>
        {COLS.map((c) => (
          <div key={c.title}>
            <p className="eyebrow text-on-ink-muted">{c.title}</p>
            <ul className="mt-4 grid gap-2.5">
              {c.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-[14px] text-on-ink/85 transition-colors hover:text-on-ink">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-on-ink/10">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-2 px-5 py-6 text-[12.5px] text-on-ink-muted md:flex-row md:items-center md:justify-between md:px-8">
          <p>© {new Date().getFullYear()} Argonaut USMLE. Not affiliated with or endorsed by the FSMB or NBME.</p>
          <p>USMLE® is a registered trademark of the FSMB and NBME.</p>
        </div>
      </div>
    </footer>
  );
}
