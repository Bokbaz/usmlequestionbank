"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { toast } from "sonner";
import { LAB_SECTIONS } from "@/lib/labs";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type PanelKind = "labs" | "calc" | "notes";

export function SidePanel({
  kind,
  onKind,
  onClose,
  questionId,
}: {
  kind: PanelKind;
  onKind: (k: PanelKind) => void;
  onClose: () => void;
  questionId: string;
}) {
  return (
    <aside className="flex h-full w-full flex-col border-l border-border bg-surface lg:w-[380px]" aria-label="Tools">
      <div className="flex items-center gap-1 border-b border-border px-2 py-2">
        {(
          [
            ["labs", "Lab values"],
            ["calc", "Calculator"],
            ["notes", "Notes"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => onKind(k)}
            className={cn(
              "h-8 rounded-[6px] px-3 text-[13px] font-semibold transition-colors",
              kind === k ? "bg-brand-soft text-brand-strong" : "text-muted hover:bg-panel hover:text-text",
            )}
          >
            {label}
          </button>
        ))}
        <button type="button" onClick={onClose} className="ml-auto grid size-8 place-items-center rounded-[6px] text-muted hover:bg-panel hover:text-text" aria-label="Close tools">
          <X className="size-4" />
        </button>
      </div>
      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">
        {kind === "labs" ? <Labs /> : kind === "calc" ? <Calculator /> : <Notes questionId={questionId} />}
      </div>
    </aside>
  );
}

function Labs() {
  const [q, setQ] = useState("");
  const [section, setSection] = useState("serum");
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return LAB_SECTIONS.filter((s) => s.key === section);
    return LAB_SECTIONS.map((s) => ({ ...s, rows: s.rows.filter((r) => r.name.toLowerCase().includes(needle)) })).filter((s) => s.rows.length);
  }, [q, section]);
  return (
    <div className="p-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-faint" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search labs"
          autoFocus
          className="h-9 w-full rounded-[6px] border border-border bg-surface pl-8 pr-3 text-[14px] focus:border-brand focus:outline-none"
        />
      </div>
      {!q && (
        <div className="mt-2 flex flex-wrap gap-1">
          {LAB_SECTIONS.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setSection(s.key)}
              className={cn("h-7 rounded-full px-2.5 text-[12px] font-semibold", section === s.key ? "bg-ink text-on-ink" : "bg-panel text-muted hover:text-text")}
            >
              {s.title}
            </button>
          ))}
        </div>
      )}
      {filtered.map((s) => (
        <div key={s.key} className="mt-3">
          {q && <p className="eyebrow mb-1 text-faint">{s.title}</p>}
          <table className="w-full text-[13px]">
            <tbody>
              {s.rows.map((r) => (
                <tr key={r.name} className="border-b border-border last:border-0">
                  <td className="w-[50%] py-2 pr-3 align-top text-text">{r.name}</td>
                  <td className="py-2 align-top text-right text-muted">{r.range}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

function Calculator() {
  const [expr, setExpr] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const keys = ["7", "8", "9", "/", "4", "5", "6", "*", "1", "2", "3", "-", "0", ".", "(", ")", "C", "⌫", "+", "="];
  const evaluate = (e: string) => {
    if (!/^[\d+\-*/().\s]+$/.test(e)) return setResult("Error");
    try {
      // Safe: input restricted to digits and arithmetic operators above.
      const v = Function(`"use strict";return (${e})`)() as number;
      setResult(Number.isFinite(v) ? String(Math.round(v * 1e6) / 1e6) : "Error");
    } catch {
      setResult("Error");
    }
  };
  const press = (k: string) => {
    if (k === "C") {
      setExpr("");
      setResult(null);
    } else if (k === "⌫") setExpr((x) => x.slice(0, -1));
    else if (k === "=") evaluate(expr);
    else setExpr((x) => x + k);
  };
  return (
    <div className="p-4">
      <div className="rounded-[8px] bg-panel px-3 py-2.5 text-right">
        <p className="tabular min-h-5 text-[13px] text-muted">{expr || "0"}</p>
        <p className="tabular text-[24px] font-[700]">{result ?? " "}</p>
      </div>
      <div className="mt-3 grid grid-cols-4 gap-1.5">
        {keys.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => press(k)}
            className={cn(
              "h-11 rounded-[8px] text-[16px] font-semibold transition-colors",
              k === "=" ? "bg-brand text-on-brand hover:bg-brand-strong" : /[+\-*/]/.test(k) ? "bg-brand-soft text-brand-strong hover:brightness-95" : "bg-panel text-text hover:bg-sunken",
            )}
          >
            {k}
          </button>
        ))}
      </div>
    </div>
  );
}

function Notes({ questionId }: { questionId: string }) {
  const [body, setBody] = useState("");
  const [noteId, setNoteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    createClient()
      .from("notes")
      .select("id, body")
      .eq("question_id", questionId)
      .maybeSingle()
      .then(({ data }) => {
        if (!alive) return;
        setNoteId(data?.id ?? null);
        setBody(data?.body ?? "");
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [questionId]);

  async function save() {
    setSaving(true);
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    const res = noteId
      ? await supabase.from("notes").update({ body }).eq("id", noteId)
      : await supabase.from("notes").insert({ user_id: auth.user!.id, question_id: questionId, body }).select("id").single();
    setSaving(false);
    if (res.error) return toast.error(res.error.message);
    if (!noteId && "data" in res && res.data) setNoteId((res.data as { id: string }).id);
    toast.success("Note saved to your notebook");
  }

  return (
    <div className="grid gap-3 p-4">
      <p className="text-[13px] text-muted">Notes are private and collected in your Notebook.</p>
      <Textarea rows={10} value={body} onChange={(e) => setBody(e.target.value)} placeholder={loading ? "Loading…" : "What do you want to remember from this question?"} disabled={loading} />
      <Button onClick={save} loading={saving} disabled={loading || !body.trim()}>
        Save note
      </Button>
    </div>
  );
}
