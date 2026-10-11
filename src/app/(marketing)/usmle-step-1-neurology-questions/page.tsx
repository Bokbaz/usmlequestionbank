import { HubPage, hubMetadata } from "@/components/marketing/hub-page";

export const revalidate = 3600;

export const metadata = hubMetadata("step1-neurology");

export default function Step1NeurologyPage() {
  return <HubPage hubKey="step1-neurology" />;
}
