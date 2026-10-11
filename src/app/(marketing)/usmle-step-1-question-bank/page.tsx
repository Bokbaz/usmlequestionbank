import type { Metadata } from "next";
import { EXAM_COPY, ExamPage } from "@/components/marketing/exam-page";
import { pageMetadata } from "@/lib/seo/metadata";

export const revalidate = 3600;

export const metadata: Metadata = pageMetadata({
  title: EXAM_COPY.step1.title,
  description: EXAM_COPY.step1.description,
  path: "/usmle-step-1-question-bank",
  ownImage: true,
});

export default function Step1BankPage() {
  return <ExamPage exam="step1" />;
}
