import type { Metadata } from "next";
import { FREE_COPY, FreeCollection } from "@/components/marketing/free-collection";
import { pageMetadata } from "@/lib/seo/metadata";

export const revalidate = 3600;

export const metadata: Metadata = pageMetadata({
  title: FREE_COPY.step2ck.title,
  description: FREE_COPY.step2ck.description,
  path: "/free-usmle-step-2-ck-questions",
  ownImage: true,
});

export default function FreeStep2Page() {
  return <FreeCollection exam="step2ck" />;
}
