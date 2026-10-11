import { ogImage } from "@/lib/seo/og";

export const alt = "USMLE study guides, from Argonaut USMLE";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return ogImage({ tone: "teal", eyebrow: "Argonaut guides", title: "USMLE study guides." });
}
