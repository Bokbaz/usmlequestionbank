import { ogImage } from "@/lib/seo/og";

export const alt = "How to review USMLE questions so mistakes stop repeating, from Argonaut USMLE";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return ogImage({ tone: "ink", eyebrow: "Guide · Qbank review", title: "How to review USMLE questions so mistakes stop repeating." });
}
