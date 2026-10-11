import type { Metadata } from "next";
import { EXAM_COPY, ExamPage } from "@/components/marketing/exam-page";
import { pageMetadata } from "@/lib/seo/metadata";

export const revalidate = 3600;

export const metadata: Metadata = pageMetadata({
  title: EXAM_COPY.step2ck.title,
  description: EXAM_COPY.step2ck.description,
  path: "/usmle-step-2-ck-question-bank",
  ownImage: true,
});

export default function Step2BankPage() {
  return <ExamPage exam="step2ck" />;
}
