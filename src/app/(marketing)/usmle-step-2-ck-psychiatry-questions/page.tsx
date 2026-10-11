import { HubPage, hubMetadata } from "@/components/marketing/hub-page";

export const revalidate = 3600;

export const metadata = hubMetadata("step2ck-psychiatry");

export default function Step2PsychiatryPage() {
  return <HubPage hubKey="step2ck-psychiatry" />;
}
