import type { Metadata } from "next";
import { Layers3 } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/app/page-header";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { FlashcardReview, type Card } from "./review";

export const metadata: Metadata = { title: "Flashcards" };

export default async function FlashcardsPage() {
  await requireUser("/flashcards");
  const supabase = await createClient();
  const { data } = await supabase.from("flashcards").select("id, front, back, ease, interval_days, reps, lapses, due_at, created_at").order("due_at").limit(1000);
  const cards = (data ?? []) as Card[];
  const due = cards.filter((c) => new Date(c.due_at) <= new Date());
  return (
    <>
      <PageHeader title="Flashcards" description={`${due.length} due now · ${cards.length} in your deck. Cards come from explanations: press "Add to flashcards" after any question.`} />
      {cards.length === 0 ? (
        <EmptyState icon={<Layers3 className="size-6 text-faint" />} title="Your deck is empty" body="After answering a question, use Add to flashcards beneath the explanation. Cards return on a spaced-repetition schedule." />
      ) : (
        <FlashcardReview cards={due} total={cards.length} nextDue={cards.find((c) => new Date(c.due_at) > new Date())?.due_at ?? null} />
      )}
    </>
  );
}
