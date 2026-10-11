import Link from "next/link";
import { ContentPage, Container, LinkRows } from "@/components/marketing/content";
import { SiteFooter } from "@/components/marketing/site-footer";

// Site-wide 404 (Next.js sends it with a noindex tag). Points people at the pages they were most
// likely looking for instead of a dead end.
export default function NotFound() {
  return (
    <>
      <ContentPage>
        <Container className="pb-24 pt-16 md:pt-24">
          <p className="eyebrow text-brand-strong">404 · page not found</p>
          <h1 className="display mt-5 max-w-[16ch] text-[clamp(40px,6vw,88px)] font-bold">That page isn&apos;t here.</h1>
          <p className="mt-6 max-w-[52ch] text-[18px] leading-relaxed text-muted">
            It may have moved, or the link may be wrong. These are the pages people usually want:
          </p>
          <div className="mt-10 max-w-[760px]">
            <LinkRows
              items={[
                { href: "/free-usmle-practice-questions", title: "Free USMLE practice questions", body: "Step 1 and Step 2 CK, full explanations, no login" },
                { href: "/usmle-step-1-question-bank", title: "USMLE Step 1 question bank", body: "Coverage, format and pricing" },
                { href: "/usmle-step-2-ck-question-bank", title: "USMLE Step 2 CK question bank", body: "Clinical decision questions" },
                { href: "/library", title: "High-yield Library", body: "Short chapters by organ system" },
                { href: "/daily", title: "Daily Challenge", body: "One hard Step 1 question a day" },
                { href: "/pricing", title: "Pricing", body: "$48 once for both exams" },
              ]}
            />
          </div>
          <p className="mt-8 text-[15px] text-muted">
            Or go to the{" "}
            <Link href="/" className="font-semibold text-text underline underline-offset-4">
              homepage
            </Link>
            .
          </p>
        </Container>
      </ContentPage>
      <SiteFooter />
    </>
  );
}
