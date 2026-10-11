import { ogImage } from "@/lib/seo/og";

export const alt = "The 2026 USMLE format: 30-minute blocks, explained, from Argonaut USMLE";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return ogImage({ tone: "ink", eyebrow: "Guide · 2026 exam format", title: "The 2026 USMLE format: 30-minute blocks, explained." });
}
