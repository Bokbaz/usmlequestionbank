import { ogImage } from "@/lib/seo/og";

export const alt = "A USMLE Step 1 study plan you can adjust, from Argonaut USMLE";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return ogImage({ tone: "teal", eyebrow: "Guide · Step 1", title: "A USMLE Step 1 study plan you can adjust." });
}
