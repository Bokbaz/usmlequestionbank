import { HubPage, hubMetadata } from "@/components/marketing/hub-page";

export const revalidate = 3600;

export const metadata = hubMetadata("step1-renal");

export default function Step1RenalPage() {
  return <HubPage hubKey="step1-renal" />;
}
