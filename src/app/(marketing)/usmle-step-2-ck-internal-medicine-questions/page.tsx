import { HubPage, hubMetadata } from "@/components/marketing/hub-page";

export const revalidate = 3600;

export const metadata = hubMetadata("step2ck-internal-medicine");

export default function Step2InternalMedicinePage() {
  return <HubPage hubKey="step2ck-internal-medicine" />;
}
