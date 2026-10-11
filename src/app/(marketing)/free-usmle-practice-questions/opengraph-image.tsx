import { ogImage } from "@/lib/seo/og";

export const alt = "Free USMLE practice questions with explanations, from Argonaut USMLE";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return ogImage({
    eyebrow: "Free · no login",
    title: "Free USMLE practice questions, fully explained.",
    subtitle: "Step 1 and Step 2 CK questions with every answer choice explained, plus every past Daily Challenge.",
  });
}
