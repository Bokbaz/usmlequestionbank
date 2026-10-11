import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo/metadata";
import { LegalPage } from "@/components/marketing/legal-page";
import { LEGAL_UPDATED, PRIVACY } from "@/lib/legal";

export const metadata: Metadata = pageMetadata({
  title: "Privacy Policy",
  description:
    "What personal data Argonaut USMLE collects, why, who processes it and your rights. No advertising trackers and no selling of your data.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return <LegalPage title="Privacy policy" updated={LEGAL_UPDATED} path="/privacy" body={PRIVACY} />;
}
