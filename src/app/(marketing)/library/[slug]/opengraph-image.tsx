import { getChapter } from "@/lib/public/content";
import { ogImage } from "@/lib/seo/og";

export const alt = "High-yield USMLE review chapter from the Argonaut Library";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const c = await getChapter((await params).slug);
  return ogImage({
    eyebrow: c ? `USMLE Library · ${c.system.short}` : "USMLE Library",
    title: c?.title ?? "High-yield USMLE review",
    subtitle: c?.free ? "Free high-yield review with practice questions. No login." : "High-yield review chapter, linked to practice questions.",
  });
}
