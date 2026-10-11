import { HubPage, hubMetadata } from "@/components/marketing/hub-page";

export const revalidate = 3600;

export const metadata = hubMetadata("step1-cardiology");

export default function Step1CardiologyPage() {
  return <HubPage hubKey="step1-cardiology" />;
}
