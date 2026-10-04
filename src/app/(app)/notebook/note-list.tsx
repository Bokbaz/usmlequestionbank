"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

export type NoteRow = {
  id: string;
  body: string;
  updated_at: string;
  question_id: string | null;
  article_id: number | null;
  questions: { code: string; topics: { name: string } | null } | null;
  library_articles: { title: string; slug: string } | null;
};

export function NoteList({ notes: initial }: { notes: NoteRow[] }) {
  const [notes, setNotes] = useState(initial);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const shown = useMemo(() => {
    const n = q.trim().toLowerCase();
    return n ? notes.filter((x) => x.body.toLowerCase().includes(n) || (x.questions?.topics?.name ?? "").toLowerCase().includes(n)) : notes;
  }, [notes, q]);

  async function save(id: string) {
    const { error } = await createClient().from("notes").update({ body: draft }).eq("id", id);
    if (error) return toast.error(error.message);
    setNotes((ns) => ns.map((n) => (n.id === id ? { ...n, body: draft, updated_at: new Date().toISOString() } : n)));
    setEditing(null);
  }
  async function remove(id: string) {
    const { error } = await createClient().from("notes").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setNotes((ns) => ns.filter((n) => n.id !== id));
  }

  return (
    <div>
      <div className="relative max-w-[420px]">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search notes" className="h-10 w-full rounded-[8px] border border-border bg-surface pl-9 pr-3 text-[15px] focus:border-brand focus:outline-none" />
      </div>
      <ul className="mt-5 grid gap-3">
        {shown.map((n) => (
          <li key={n.id} className="rounded-[10px] border border-border bg-surface p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[12.5px] text-muted">
              <span>
                {n.questions ? (
                  <>
                    <span className="font-semibold text-text">{n.questions.code}</span>
                    {n.questions.topics?.name ? ` · ${n.questions.topics.name}` : ""}
                  </>
                ) : n.library_articles ? (
                  <Link href={`/library/${n.library_articles.slug}`} className="font-semibold text-brand hover:underline">
                    {n.library_articles.title}
                  </Link>
                ) : (
                  "Note"
                )}
              </span>
              <span>{new Date(n.updated_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
            </div>
            {editing === n.id ? (
              <div className="mt-3 grid gap-2">
                <Textarea rows={5} value={draft} onChange={(e) => setDraft(e.target.value)} />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => save(n.id)}>
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed">{n.body}</p>
            )}
            {editing !== n.id && (
              <div className="mt-3 flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditing(n.id);
                    setDraft(n.body);
                  }}
                >
                  Edit
                </Button>
                <Button size="sm" variant="ghost" onClick={() => remove(n.id)} aria-label="Delete note">
                  <Trash2 className="size-4" />
                </Button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
