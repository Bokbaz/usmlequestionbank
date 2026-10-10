import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal-page";
import { LEGAL_UPDATED, REFUNDS } from "@/lib/legal";

export const metadata: Metadata = { title: "Refund policy" };

export default function RefundsPage() {
  return <LegalPage title="Refund policy" updated={LEGAL_UPDATED} path="/refunds" body={REFUNDS} />;
}
