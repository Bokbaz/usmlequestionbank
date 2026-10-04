import type { Metadata } from "next";
import Link from "next/link";
import { MessageSquareWarning } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { FeedbackActions } from "./feedback-actions";

export const metadata: Metadata = { title: "Feedback" };

type Row = {
  id: number;
  kind: "error" | "unclear" | "outdated" | "praise" | "other";
  message: string | null;
  status: "open" | "resolved" | "dismissed";
  created_at: string;
  question: { code: string; lead_in: string } | null;
};

const KIND = { error: "incorrect", unclear: "warning", outdated: "warning", praise: "correct", other: "neutral" } as const;

export default async function AdminFeedbackPage({ searchParams }: PageProps<"/admin/feedback">) {
  const sp = await searchParams;
  const status = sp.status === "resolved" || sp.status === "dismissed" ? sp.status : "open";
  const supabase = await createClient();
  const { data } = await supabase
    .from("question_feedback")
    .select("id, kind, message, status, created_at, question:questions(code, lead_in)")
    .eq("status", status)
    .order("created_at", { ascending: false })
    .limit(200);
  const rows = (data ?? []) as unknown as Row[];
  return (
    <>
      <PageHeader title="Feedback" description="Reports students file from the explanation view. Fix the question by re-importing it with the same ID, then resolve." />
      <nav className="mb-4 flex gap-1 text-[13.5px]" aria-label="Status">
        {(["open", "resolved", "dismissed"] as const).map((s) => (
          <Link
            key={s}
            href={s === "open" ? "/admin/feedback" : `/admin/feedback?status=${s}`}
            className={cn("rounded-[6px] px-3 py-1.5 font-semibold capitalize", s === status ? "bg-brand-soft text-brand-strong" : "text-muted hover:bg-panel")}
          >
            {s}
          </Link>
        ))}
      </nav>
      {rows.length === 0 ? (
        <EmptyState icon={<MessageSquareWarning className="size-6 text-faint" />} title={`No ${status} reports`} />
      ) : (
        <ul className="grid gap-3">
          {rows.map((r) => (
            <li key={r.id} className="rounded-[10px] border border-border bg-surface p-4">
              <div className="flex flex-wrap items-center gap-2 text-[13px]">
                <Badge tone={KIND[r.kind]}>{r.kind}</Badge>
                {r.question && (
                  <Link href={`/admin/questions?q=${r.question.code}`} className="font-semibold hover:underline">
                    {r.question.code}
                  </Link>
                )}
                <span className="text-muted">{new Date(r.created_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</span>
                <div className="ml-auto">
                  <FeedbackActions id={r.id} status={r.status} />
                </div>
              </div>
              {r.question && <p className="mt-2 truncate text-[13px] text-muted">{r.question.lead_in}</p>}
              <p className="mt-2 whitespace-pre-line text-[14px]">{r.message || <span className="text-faint">No message</span>}</p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
