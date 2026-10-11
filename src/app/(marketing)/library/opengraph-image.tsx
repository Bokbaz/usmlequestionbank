import { ogImage } from "@/lib/seo/og";

export const alt = "The high-yield USMLE Library from Argonaut USMLE";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return ogImage({
    eyebrow: "High-yield USMLE Library",
    title: "Read it. Then drill it.",
    subtitle: "Short Step 1 and Step 2 CK chapters by organ system, each linked to practice questions. Free chapters, no login.",
  });
}
