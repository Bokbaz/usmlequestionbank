import { ogImage } from "@/lib/seo/og";

export const alt = "Free USMLE Step 1 practice questions from Argonaut USMLE";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return ogImage({
    eyebrow: "Free · USMLE Step 1",
    title: "Free Step 1 practice questions.",
    subtitle: "Full clinical vignettes from every organ system, with every answer choice explained. No account needed.",
  });
}
