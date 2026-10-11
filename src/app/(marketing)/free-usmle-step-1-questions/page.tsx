import type { Metadata } from "next";
import { FREE_COPY, FreeCollection } from "@/components/marketing/free-collection";
import { pageMetadata } from "@/lib/seo/metadata";

export const revalidate = 3600;

export const metadata: Metadata = pageMetadata({
  title: FREE_COPY.step1.title,
  description: FREE_COPY.step1.description,
  path: "/free-usmle-step-1-questions",
  ownImage: true,
});

export default function FreeStep1Page() {
  return <FreeCollection exam="step1" />;
}
