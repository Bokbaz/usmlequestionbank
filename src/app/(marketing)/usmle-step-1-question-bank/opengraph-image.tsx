import { ogImage } from "@/lib/seo/og";

export const alt = "USMLE Step 1 question bank by Argonaut USMLE";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return ogImage({
    eyebrow: "USMLE Step 1",
    title: "The Step 1 question bank that studies you.",
    subtitle: "Exam-style vignettes, every choice explained, clinician-reviewed. 20-question timed blocks like the 2026 exam.",
  });
}
