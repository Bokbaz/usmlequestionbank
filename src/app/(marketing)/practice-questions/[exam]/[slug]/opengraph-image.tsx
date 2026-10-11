import { EXAMS, examBySlug } from "@/lib/exams";
import { getPublicQuestion } from "@/lib/public/content";
import { ogImage } from "@/lib/seo/og";

export const alt = "Free USMLE practice question with every answer choice explained";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ exam: string; slug: string }> }) {
  const { exam: examSlug, slug } = await params;
  const exam = examBySlug(examSlug);
  const code = slug.match(/^(aq-\d+)/i)?.[1];
  const q = exam && code ? await getPublicQuestion(exam.slug, code) : null;
  if (!q) return ogImage({ eyebrow: "Free USMLE practice question", title: "Every answer choice explained." });
  return ogImage({
    eyebrow: `Free ${EXAMS[q.exam].long} question · ${q.system.short}`,
    title: q.topic ?? q.system.short,
    subtitle: q.daily ? `Daily Challenge #${q.daily.number}, with every answer choice explained.` : "Free practice question with every answer choice explained. No login.",
  });
}
