import { ogImage } from "@/lib/seo/og";

export const alt = "Argonaut USMLE: the USMLE question bank for Step 1 and Step 2 CK that studies you";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return ogImage({
    eyebrow: "USMLE Step 1 · Step 2 CK question bank",
    title: "The USMLE Qbank that studies you.",
    subtitle: "Exam-style questions, every choice explained, and ARGO practice built around your weak spots.",
  });
}
