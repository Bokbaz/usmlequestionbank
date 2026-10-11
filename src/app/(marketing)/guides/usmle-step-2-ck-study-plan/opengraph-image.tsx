import { ogImage } from "@/lib/seo/og";

export const alt = "A Step 2 CK study plan, from clerkships to test day, from Argonaut USMLE";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return ogImage({ tone: "teal", eyebrow: "Guide · Step 2 CK", title: "A Step 2 CK study plan, from clerkships to test day." });
}
