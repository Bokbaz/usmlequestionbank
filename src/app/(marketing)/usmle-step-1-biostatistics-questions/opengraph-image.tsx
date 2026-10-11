import { ogImage } from "@/lib/seo/og";

export const alt = "Step 1 biostatistics questions, fully explained from Argonaut USMLE";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return ogImage({ eyebrow: "USMLE Step 1 · Biostatistics", title: "Step 1 biostatistics questions, fully explained.", subtitle: "Free practice questions with every answer choice explained, plus the topics the bank covers." });
}
