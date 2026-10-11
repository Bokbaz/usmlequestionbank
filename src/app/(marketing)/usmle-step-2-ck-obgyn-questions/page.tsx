import { HubPage, hubMetadata } from "@/components/marketing/hub-page";

export const revalidate = 3600;

export const metadata = hubMetadata("step2ck-obgyn");

export default function Step2ObgynPage() {
  return <HubPage hubKey="step2ck-obgyn" />;
}
