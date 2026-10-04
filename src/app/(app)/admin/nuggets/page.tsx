import type { Metadata } from "next";
import { Gem } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/app/page-header";
import { REVIEW_THRESHOLD, AUTO_THRESHOLD } from "@/lib/nuggets/match";
import { createClient } from "@/lib/supabase/server";
import { ReviewList, type ReviewItem } from "./review-list";

export const metadata: Metadata = { title: "Nugget review" };

export default async function NuggetReviewPage() {
  const supabase = await createClient();
  const { data } = await supabase.rpc("admin_nugget_reviews", { p_limit: 100 });
  const items = (data ?? []) as ReviewItem[];
  return (
    <>
      <PageHeader
        title="Nugget review"
        description={`Imported questions whose testing point resembles a line in the high-yield index (score ${REVIEW_THRESHOLD.toFixed(2)} to ${AUTO_THRESHOLD.toFixed(2)}). Approve to highlight the question as a Nugget; the card text is written from the question, never from the source.`}
      />
      {items.length ? (
        <ReviewList items={items} />
      ) : (
        <EmptyState icon={<Gem className="size-6 text-faint" />} title="Nothing to review" body="Matches above the automatic threshold are linked during import; borderline ones appear here." />
      )}
    </>
  );
}
