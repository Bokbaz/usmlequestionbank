import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo/metadata";
import { LegalPage } from "@/components/marketing/legal-page";
import { LEGAL_UPDATED, TERMS } from "@/lib/legal";

export const metadata: Metadata = pageMetadata({
  title: "Terms of Service",
  description:
    "The terms for using Argonaut USMLE: accounts, Full access and what lifetime access means, the question-writing add-on, acceptable use and liability.",
  path: "/terms",
});

export default function TermsPage() {
  return <LegalPage title="Terms of service" updated={LEGAL_UPDATED} path="/terms" body={TERMS} />;
}
