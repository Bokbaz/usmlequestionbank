import { HubPage, hubMetadata } from "@/components/marketing/hub-page";

export const revalidate = 3600;

export const metadata = hubMetadata("step1-biostatistics");

export default function Step1BiostatisticsPage() {
  return <HubPage hubKey="step1-biostatistics" />;
}
