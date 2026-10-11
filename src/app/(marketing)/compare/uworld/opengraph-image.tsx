import { ogImage } from "@/lib/seo/og";

export const alt = "Argonaut vs UWorld: price, features and access, from Argonaut USMLE";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return ogImage({ tone: "ink", eyebrow: "Comparison · USMLE", title: "Argonaut vs UWorld: price, features and access." });
}
