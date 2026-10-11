import { AlternativesPage } from "@/components/marketing/alternatives-page";
import { guideMetadata } from "@/components/marketing/guide-shell";
import { ALTERNATIVES } from "@/lib/public/alternatives";

export const metadata = guideMetadata(ALTERNATIVES["usmle-rx"].path);
export const revalidate = 3600;

export default function UsmleRxAlternativesPage() {
  return <AlternativesPage pageKey="usmle-rx" />;
}
