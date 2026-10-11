import { ogImage } from "@/lib/seo/og";

export const alt = "ARGO: how Argonaut USMLE turns your question history into targeted practice";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return ogImage({
    tone: "ink",
    eyebrow: "ARGO adaptive analytics",
    title: "16 data points on every answer. One session built around your weak spots.",
  });
}
