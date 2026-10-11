import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { COMPANY, COMPANY_ADDRESS } from "@/lib/legal";
import { getBankStats } from "@/lib/public/content";
import { HUBS } from "@/lib/public/hubs";
import { SUPPORT_EMAIL } from "@/lib/utils";

// Every public page, in plain crawlable links with descriptive anchors. This is the one block
// that appears on every marketing page, so it is how search engines and AI crawlers find the
// whole site. Login-only areas (Qbank, Nuggets, Settings) are deliberately not linked.
const COLS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Question bank",
    links: [
      { href: "/usmle-step-1-question-bank", label: "USMLE Step 1 question bank" },
      { href: "/usmle-step-2-ck-question-bank", label: "USMLE Step 2 CK question bank" },
      { href: "/features/argo", label: "ARGO adaptive practice" },
      { href: "/pricing", label: "Pricing: $48 once" },
    ],
  },
  {
    title: "Free practice",
    links: [
      { href: "/free-usmle-practice-questions", label: "Free USMLE practice questions" },
      { href: "/free-usmle-step-1-questions", label: "Free Step 1 questions" },
      { href: "/free-usmle-step-2-ck-questions", label: "Free Step 2 CK questions" },
      { href: "/daily", label: "Daily USMLE Challenge" },
      { href: "/library", label: "High-yield USMLE Library" },
    ],
  },
  {
    title: "Practice by subject",
    links: HUBS.map((h) => ({ href: h.path, label: h.nav })),
  },
  {
    title: "Guides",
    links: [
      { href: "/guides/usmle-exam-interface", label: "2026 USMLE exam format" },
      { href: "/guides/usmle-step-1-study-plan", label: "Step 1 study plan" },
      { href: "/guides/usmle-step-2-ck-study-plan", label: "Step 2 CK study plan" },
      { href: "/guides/how-to-review-usmle-questions", label: "How to review Qbank questions" },
    ],
  },
  {
    title: "Compare",
    links: [
      { href: "/guides/best-usmle-question-bank", label: "Best USMLE question bank 2026" },
      { href: "/compare/uworld-alternatives", label: "UWorld alternatives" },
      { href: "/compare/amboss-alternatives", label: "AMBOSS alternatives" },
      { href: "/compare/kaplan-alternatives", label: "Kaplan Qbank alternatives" },
      { href: "/compare/usmle-rx-alternatives", label: "USMLE-Rx alternatives" },
      { href: "/compare/uworld", label: "Argonaut vs UWorld" },
      { href: "/guides/usmle-question-bank-comparison", label: "USMLE question banks compared" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About Argonaut" },
      { href: "/editorial-policy", label: "Editorial policy" },
      { href: `mailto:${SUPPORT_EMAIL}`, label: "Contact support" },
      { href: "/terms", label: "Terms of service" },
      { href: "/privacy", label: "Privacy policy" },
      { href: "/refunds", label: "Refund policy" },
    ],
  },
];

async function bankTotal() {
  try {
    return (await getBankStats()).total;
  } catch {
    return null;
  }
}

export async function SiteFooter() {
  const total = await bankTotal();
  return (
    <footer className="overflow-hidden bg-ink text-on-ink">
      <div className="mx-auto grid max-w-[1320px] gap-14 px-5 pb-14 pt-20 md:px-8 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-4">
          <Link href="/" aria-label="Argonaut USMLE home" className="inline-block">
            <Logo tone="inverse" />
          </Link>
          <p className="display mt-8 max-w-[18ch] text-[28px] font-bold leading-[1.05]">A question bank that runs like an F1 team.</p>
          {/* What Argonaut is, in one paragraph: the same facts as the Organization schema. */}
          <p className="mt-5 max-w-[46ch] text-[15px] leading-relaxed text-on-ink-muted">
            Argonaut USMLE is an online question bank for USMLE Step 1 and Step 2 CK, made by {COMPANY} in London.
            {total ? ` ${total.toLocaleString("en-US")} exam-style questions` : " Exam-style questions"} with every answer choice explained,
            reviewed by clinicians, and ARGO practice built around your weak spots. $48 once for lifetime access.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild variant="ink" size="lg" className="group">
              <Link href="/signup">
                Start free <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Button asChild variant="ink-outline" size="lg">
              <Link href="/free-usmle-practice-questions">Try free questions</Link>
            </Button>
          </div>
        </div>

        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-8 gap-y-11 sm:grid-cols-3 lg:col-span-8 lg:pl-6 xl:grid-cols-4">
          {COLS.map((c) => (
            <div key={c.title}>
              <p className="eyebrow text-on-ink-muted">{c.title}</p>
              <ul className="mt-4 grid gap-2.5">
                {c.links.map((l) => (
                  <li key={l.href}>
                    {l.href.startsWith("mailto:") ? (
                      <a href={l.href} className="text-[14.5px] leading-snug text-on-ink/85 transition-colors hover:text-signal">
                        {l.label}
                      </a>
                    ) : (
                      <Link href={l.href} className="text-[14.5px] leading-snug text-on-ink/85 transition-colors hover:text-signal">
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <p className="eyebrow text-on-ink-muted">Account</p>
            <ul className="mt-4 grid gap-2.5">
              <li>
                <Link href="/signup" className="text-[14.5px] text-on-ink/85 transition-colors hover:text-signal">
                  Create free account
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-[14.5px] text-on-ink/85 transition-colors hover:text-signal">
                  Log in
                </Link>
              </li>
              <li>
                <a href={`mailto:${SUPPORT_EMAIL}`} className="break-all text-[14.5px] text-on-ink/85 transition-colors hover:text-signal">
                  {SUPPORT_EMAIL}
                </a>
              </li>
            </ul>
          </div>
        </nav>
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
        <div className="mx-auto flex max-w-[1320px] flex-col gap-2 px-5 py-6 text-[12.5px] leading-relaxed text-on-ink-muted md:flex-row md:items-center md:justify-between md:gap-8 md:px-8">
          <p>
            © {new Date().getFullYear()} {COMPANY}, {COMPANY_ADDRESS}. Argonaut USMLE is not affiliated with or endorsed by the FSMB or NBME.
          </p>
          <p className="shrink-0">USMLE® is a registered trademark of the FSMB and NBME.</p>
        </div>
      </div>
    </footer>
  );
}
