import type { Metadata } from "next";
import { NotebookPen } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/app/page-header";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { NoteList, type NoteRow } from "./note-list";

export const metadata: Metadata = { title: "Notebook" };

export default async function NotebookPage() {
  await requireUser("/notebook");
  const supabase = await createClient();
  const { data } = await supabase
    .from("notes")
    .select("id, body, updated_at, question_id, article_id, questions(code, topics(name)), library_articles(title, slug)")
    .order("updated_at", { ascending: false })
    .limit(500);
  const notes = (data ?? []) as unknown as NoteRow[];
  return (
    <>
      <PageHeader title="Notebook" description="Everything you wrote down while studying, in one place." />
      {notes.length === 0 ? (
        <EmptyState icon={<NotebookPen className="size-6 text-faint" />} title="No notes yet" body="Open Notes from the toolbar while answering a question to write something you want to remember." />
      ) : (
        <NoteList notes={notes} />
      )}
    </>
  );
}
