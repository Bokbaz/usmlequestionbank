import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo/metadata";
import { LegalPage } from "@/components/marketing/legal-page";
import { LEGAL_UPDATED, REFUNDS } from "@/lib/legal";

export const metadata: Metadata = pageMetadata({
  title: "Refund Policy",
  description:
    "Argonaut USMLE refunds: a full $48 refund within 14 days if you've answered fewer than 200 questions, add-on cancellations and duplicate charges.",
  path: "/refunds",
});

export default function RefundsPage() {
  return <LegalPage title="Refund policy" updated={LEGAL_UPDATED} path="/refunds" body={REFUNDS} />;
}
