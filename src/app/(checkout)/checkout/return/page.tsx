import { requireUser } from "@/lib/auth";
import { PaymentResult } from "@/components/billing/payment-result";

export const metadata = { title: "Your purchase" };

export default async function CheckoutReturn({ searchParams }: PageProps<"/checkout/return">) {
  const params = await searchParams;
  const sessionId = typeof params.session_id === "string" ? params.session_id : "";
  await requireUser(`/checkout/return?session_id=${encodeURIComponent(sessionId)}`);
  return <PaymentResult sessionId={sessionId} />;
}
