import Link from "next/link";

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
    <footer className="overflow-hidden bg-ink text-on-ink">
      <div className="mx-auto grid max-w-[1320px] gap-12 px-5 pb-12 pt-20 md:grid-cols-[1.4fr_repeat(3,1fr)] md:px-8">
        <div className="max-w-[36ch]">
          <p className="display text-[26px] font-bold leading-[1.05]">A question bank that runs like an F1 team.</p>
          <p className="mt-4 text-[15px] leading-relaxed text-on-ink-muted">Big-bank quality for $48, once. Built to get you the score.</p>
        </div>
        {COLS.map((c) => (
          <div key={c.title}>
            <p className="eyebrow text-on-ink-muted">{c.title}</p>
            <ul className="mt-4 grid gap-2.5">
              {c.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-[14.5px] text-on-ink/85 transition-colors hover:text-signal">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Oversize wordmark sized to the container (ARGONAUT is ~10.1x its font size wide), cropped at the baseline. */}
      <div className="mx-auto max-w-[1320px] px-5 md:px-8" aria-hidden>
        <div className="overflow-hidden border-t border-on-ink/10 pt-10">
          <span className="display -mb-[0.1em] block select-none whitespace-nowrap text-[min(calc((100vw-40px)/10.1),124px)] font-bold leading-[0.8] text-on-ink md:text-[min(calc((100vw-64px)/10.1),124px)]">
            ARGONAUT
          </span>
        </div>
      </div>

      <div className="relative border-t border-on-ink/10 bg-ink">
        <div className="mx-auto flex max-w-[1320px] flex-col gap-2 px-5 py-6 text-[12.5px] text-on-ink-muted md:flex-row md:items-center md:justify-between md:px-8">
          <p>© {new Date().getFullYear()} Argonaut USMLE. Not affiliated with or endorsed by the FSMB or NBME.</p>
          <p>USMLE® is a registered trademark of the FSMB and NBME.</p>
        </div>
      </div>
    </footer>
  );
}
