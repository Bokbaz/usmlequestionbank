import { ogImage } from "@/lib/seo/og";

export const alt = "The best USMLE-Rx alternatives for USMLE in 2026, from Argonaut USMLE";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return ogImage({ tone: "ink", eyebrow: "Comparison · 2026", title: "The best USMLE-Rx alternatives for USMLE." });
}
