import { ogImage } from "@/lib/seo/og";

export const alt = "Free USMLE Step 2 CK practice questions from Argonaut USMLE";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return ogImage({
    eyebrow: "Free · USMLE Step 2 CK",
    title: "Free Step 2 CK practice questions.",
    subtitle: "Diagnosis, next steps and management, with every answer choice explained. No account needed.",
  });
}
