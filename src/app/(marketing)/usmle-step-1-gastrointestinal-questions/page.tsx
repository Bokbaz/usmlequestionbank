import { HubPage, hubMetadata } from "@/components/marketing/hub-page";

export const revalidate = 3600;

export const metadata = hubMetadata("step1-gastrointestinal");

export default function Step1GastrointestinalPage() {
  return <HubPage hubKey="step1-gastrointestinal" />;
}
