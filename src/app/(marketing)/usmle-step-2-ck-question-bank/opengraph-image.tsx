import { ogImage } from "@/lib/seo/og";

export const alt = "USMLE Step 2 CK question bank by Argonaut USMLE";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return ogImage({
    eyebrow: "USMLE Step 2 CK",
    title: "Step 2 CK questions built for clinical decisions.",
    subtitle: "Next best step, diagnosis and management, with every answer choice explained and clinician review.",
  });
}
