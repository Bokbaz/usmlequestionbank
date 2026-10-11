import { ogImage } from "@/lib/seo/og";

export const alt = "USMLE question banks compared: price, size and access, from Argonaut USMLE";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return ogImage({ tone: "ink", eyebrow: "Comparison · 2026", title: "USMLE question banks compared: price, size and access." });
}
