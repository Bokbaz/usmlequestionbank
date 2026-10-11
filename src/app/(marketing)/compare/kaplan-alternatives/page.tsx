import { AlternativesPage } from "@/components/marketing/alternatives-page";
import { guideMetadata } from "@/components/marketing/guide-shell";
import { ALTERNATIVES } from "@/lib/public/alternatives";

export const metadata = guideMetadata(ALTERNATIVES["kaplan"].path);
export const revalidate = 3600;

export default function KaplanAlternativesPage() {
  return <AlternativesPage pageKey="kaplan" />;
}
