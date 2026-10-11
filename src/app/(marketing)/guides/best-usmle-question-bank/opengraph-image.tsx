import { ogImage } from "@/lib/seo/og";

export const alt = "The best USMLE question bank in 2026, ranked on six metrics, from Argonaut USMLE";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return ogImage({ tone: "ink", eyebrow: "Ranking · 2026", title: "The best USMLE question bank in 2026, ranked on six metrics." });
}
