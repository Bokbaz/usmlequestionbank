import { ogImage } from "@/lib/seo/og";

export const alt = "The Argonaut USMLE Daily Challenge: one hard Step 1 question a day";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return ogImage({
    tone: "ink",
    eyebrow: "Daily Challenge · free",
    title: "One question. Two minutes. Everyone.",
    subtitle: "A hard USMLE Step 1 question every day, ranked by speed on a global leaderboard.",
  });
}
