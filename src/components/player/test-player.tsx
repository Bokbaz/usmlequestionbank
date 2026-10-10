"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertDialog, Dialog } from "radix-ui";
import { toast } from "sonner";
import {
  ArrowLeft,
  Calculator as CalcIcon,
  ChevronLeft,
  ChevronRight,
  Flag,
  FlaskConical,
  MessageSquareWarning,
  NotebookPen,
  Pause,
  Square,
} from "lucide-react";
import { ArgoMark } from "@/components/brand/logo";
import { NuggetBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/misc";
import { createClient } from "@/lib/supabase/client";
import type { ErrorType } from "@/lib/argo/model";
import type { ReviewPayload } from "@/lib/daily/types";
import { cn, formatClock } from "@/lib/utils";
import { Explanation } from "./explanation";
import { OptionRow } from "./option-row";
import { SidePanel, type PanelKind } from "./side-panel";
import { Stem } from "./stem";
import type { Highlight, ItemState, PlayerData, PlayerItem } from "./types";

const CONFIDENCE = [
  { v: 1, label: "Guessing" },
  { v: 2, label: "Think so" },
  { v: 3, label: "Sure" },
];

export function TestPlayer({ data, initialPosition, askConfidence = true }: { data: PlayerData; initialPosition?: number; askConfidence?: boolean }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [test] = useState(data.test);
  const [items, setItems] = useState<PlayerItem[]>(data.items);
  const [pos, setPos] = useState(() => Math.min(Math.max(initialPosition ?? data.test.current_position ?? 0, 0), data.items.length - 1));
  const [panel, setPanel] = useState<PanelKind | null>(null);
  const [errorTypes, setErrorTypes] = useState<Record<number, ErrorType | null>>({});
  const [elapsed, setElapsed] = useState(data.test.elapsed_seconds ?? 0);
  const [submitting, setSubmitting] = useState(false);
  const [ending, setEnding] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  // The item whose answer was just revealed (plays the reveal once) and the live run of correct answers.
  const [justSubmitted, setJustSubmitted] = useState<number | null>(null);
  const [streak, setStreak] = useState(0);

  const review = test.status === "completed";
  const item = items[pos];
  const isTutor = test.mode !== "timed";
  const locked = review || item.state.submitted;
  const totalSeconds = test.question_count * test.seconds_per_question;
  const remaining = Math.max(0, totalSeconds - elapsed);

  // When the current item became active; folded into its time_ms on navigation and submit.
  const activeSince = useRef(0);
  // Latest items for async persistence, synced after each render.
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);
  useEffect(() => {
    activeSince.current = Date.now();
  }, []);
  const saveTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  const autoEnded = useRef(false);

  // ---- persistence -------------------------------------------------------------------
  const persist = useCallback(
    async (position: number) => {
      const it = itemsRef.current[position];
      if (!it) return;
      const s = it.state;
      await supabase.rpc("save_item", {
        p_test: test.id,
        p_position: position,
        p_option: s.selected_option_id,
        p_first: s.first_option_id,
        p_changes: s.changes,
        p_confidence: s.confidence,
        p_marked: s.marked,
        p_struck: s.struck,
        p_highlights: s.highlights,
        p_time_ms: Math.round(s.time_ms),
        p_labs: s.labs_opened,
      });
    },
    [supabase, test.id],
  );

  const persistSoon = useCallback(
    (position: number, delay = 500) => {
      clearTimeout(saveTimers.current[position]);
      saveTimers.current[position] = setTimeout(() => persist(position), delay);
    },
    [persist],
  );

  const patchState = useCallback((position: number, fn: (s: ItemState) => Partial<ItemState>) => {
    setItems((prev) => prev.map((it, i) => (i === position ? { ...it, state: { ...it.state, ...fn(it.state) } } : it)));
  }, []);

  // Fold time spent on the current (unlocked) item into its state.
  const accumulate = useCallback(() => {
    const now = Date.now();
    const dt = now - activeSince.current;
    activeSince.current = now;
    const it = itemsRef.current[pos];
    if (!it || review || it.state.submitted || dt <= 0) return;
    itemsRef.current = itemsRef.current.map((x, i) => (i === pos ? { ...x, state: { ...x.state, time_ms: x.state.time_ms + dt } } : x));
    setItems(itemsRef.current);
  }, [pos, review]);

  const go = useCallback(
    (next: number) => {
      if (next < 0 || next >= items.length || next === pos) return;
      accumulate();
      if (!review) {
        persist(pos);
        supabase.rpc("save_progress", { p_test: test.id, p_position: next, p_elapsed: Math.round(elapsed) });
      }
      setPos(next);
      setJustSubmitted(null);
      activeSince.current = Date.now();
      document.getElementById("question-scroll")?.scrollTo({ top: 0 });
    },
    [accumulate, elapsed, items.length, persist, pos, review, supabase, test.id],
  );

  // ---- block clock & heartbeat ----------------------------------------------------------
  useEffect(() => {
    if (review) return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [review]);

  useEffect(() => {
    if (review) return;
    const t = setInterval(() => {
      supabase.rpc("save_progress", { p_test: test.id, p_position: pos, p_elapsed: Math.round(elapsed) });
    }, 20000);
    return () => clearInterval(t);
  }, [elapsed, pos, review, supabase, test.id]);

  // ---- actions -------------------------------------------------------------------------
  const select = (optionId: string) => {
    if (locked) return;
    const s = item.state;
    if (s.selected_option_id === optionId) return;
    patchState(pos, (st) => ({
      selected_option_id: optionId,
      first_option_id: st.first_option_id ?? optionId,
      changes: st.selected_option_id && st.selected_option_id !== optionId ? st.changes + 1 : st.changes,
    }));
    persistSoon(pos, 150);
  };

  const strike = (label: string) => {
    if (locked) return;
    patchState(pos, (st) => ({ struck: st.struck.includes(label) ? st.struck.filter((l) => l !== label) : [...st.struck, label] }));
    persistSoon(pos);
  };

  const toggleMark = () => {
    patchState(pos, (st) => ({ marked: !st.marked }));
    persistSoon(pos, 200);
  };

  const setHighlights = (h: Highlight[]) => {
    patchState(pos, () => ({ highlights: h }));
    persistSoon(pos);
  };

  const setConfidence = (c: number) => {
    if (locked) return;
    patchState(pos, (st) => ({ confidence: st.confidence === c ? null : c }));
    persistSoon(pos, 200);
  };

  const openPanel = (k: PanelKind) => {
    setPanel((p) => (p === k ? null : k));
    if (k === "labs" && !item.state.labs_opened && !locked) {
      patchState(pos, () => ({ labs_opened: true }));
      persistSoon(pos);
    }
  };

  async function submit() {
    if (locked || !item.state.selected_option_id || submitting) return;
    setSubmitting(true);
    accumulate();
    const s = itemsRef.current[pos].state;
    const { data: res, error } = await supabase.rpc("submit_item", {
      p_test: test.id,
      p_position: pos,
      p_option: s.selected_option_id,
      p_first: s.first_option_id,
      p_changes: s.changes,
      p_confidence: s.confidence,
      p_struck: s.struck,
      p_time_ms: Math.round(s.time_ms),
      p_labs: s.labs_opened,
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    const r = res as { is_correct: boolean; error_type: ErrorType | null; review: ReviewPayload };
    setItems((prev) => prev.map((it, i) => (i === pos ? { ...it, review: r.review, state: { ...it.state, submitted: true, is_correct: r.is_correct } } : it)));
    setErrorTypes((m) => ({ ...m, [pos]: r.error_type }));
    setJustSubmitted(pos);
    setStreak((n) => (r.is_correct ? n + 1 : 0));
    if (r.is_correct && typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(12);
  }

  const endBlock = useCallback(async () => {
    if (ending) return;
    setEnding(true);
    accumulate();
    await persist(pos);
    const { error } = await supabase.rpc("end_test", { p_test: test.id, p_elapsed: Math.round(elapsed) });
    if (error) {
      setEnding(false);
      return toast.error(error.message);
    }
    router.push(`/tests/${test.id}`);
    router.refresh();
  }, [accumulate, elapsed, ending, persist, pos, router, supabase, test.id]);

  async function suspend() {
    accumulate();
    await persist(pos);
    await supabase.rpc("save_progress", { p_test: test.id, p_position: pos, p_elapsed: Math.round(elapsed), p_suspend: true });
    toast.success("Block suspended. Resume it from your dashboard.");
    router.push("/dashboard");
  }

  // Timed blocks end automatically when the clock runs out.
  useEffect(() => {
    if (!review && test.mode === "timed" && remaining <= 0 && !autoEnded.current) {
      autoEnded.current = true;
      toast.info("Time is up. Scoring your block.");
      endBlock();
    }
  }, [endBlock, remaining, review, test.mode]);

  // ---- keyboard ------------------------------------------------------------------------
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key === "Escape" && panel) {
        setPanel(null);
        (document.activeElement as HTMLElement | null)?.blur();
        return;
      }
      if (t.closest("input, textarea, select, [contenteditable=true]") || e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key;
      if (/^[a-jA-J]$/.test(k)) {
        const opt = item.options.find((o) => o.label === k.toUpperCase());
        if (opt && !item.state.struck.includes(opt.label)) select(opt.id);
      } else if (k === "ArrowRight" || k === "n" || k === "N") go(pos + 1);
      else if (k === "ArrowLeft" || k === "p" || k === "P") go(pos - 1);
      else if (k === "m" || k === "M") toggleMark();
      else if (k === "l" || k === "L") openPanel("labs");
      else if (k === "Escape") setPanel(null);
      else if (k === "Enter") {
        if (isTutor && !locked && item.state.selected_option_id) submit();
        else go(pos + 1);
      } else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const answered = items.filter((it) => it.state.selected_option_id).length;
  const correctSoFar = items.filter((it) => it.state.submitted && it.state.is_correct).length;
  const submittedCount = items.filter((it) => it.state.submitted).length;

  return (
    <div className="flex h-svh flex-col bg-bg">
      {/* Top bar */}
      <header className="flex h-14 shrink-0 items-center gap-3 bg-ink px-3 text-on-ink md:px-4">
        <Link
          href={review ? `/tests/${test.id}` : "/dashboard"}
          onClick={(e) => {
            if (!review) {
              e.preventDefault();
              suspend();
            }
          }}
          className="grid size-9 place-items-center rounded-[7px] text-on-ink-muted hover:bg-on-ink/10 hover:text-on-ink"
          aria-label={review ? "Back to results" : "Suspend and exit"}
          title={review ? "Back to results" : "Suspend and exit"}
        >
          <ArrowLeft className="size-[18px]" />
        </Link>
        <div className="min-w-0">
          <p className="tabular text-[14px] font-semibold">
            Item {pos + 1} of {items.length}
          </p>
          <p className="truncate text-[11.5px] text-on-ink-muted">
            {test.kind === "argo" ? "ARGO session" : test.name ?? "Custom block"} · {review ? "Review" : test.mode === "timed" ? "Timed" : "Tutor"}
          </p>
        </div>
        <button
          type="button"
          onClick={toggleMark}
          aria-pressed={item.state.marked}
          className={cn(
            "ml-1 hidden h-8 items-center gap-1.5 rounded-[6px] px-2.5 text-[12.5px] font-semibold transition-colors sm:flex",
            item.state.marked ? "bg-gold/20 text-on-ink" : "text-on-ink-muted hover:bg-on-ink/10 hover:text-on-ink",
          )}
        >
          <Flag className={cn("size-4", item.state.marked && "fill-gold text-gold")} /> {item.state.marked ? "Marked" : "Mark"}
        </button>
        {test.kind === "argo" && (
          <span className="ml-1 hidden items-center gap-1.5 rounded-full bg-on-ink/10 px-2.5 py-1 text-[11.5px] font-semibold md:flex">
            <ArgoMark className="size-3.5 text-on-ink" apex="signal" /> ARGO
          </span>
        )}
        <div className="ml-auto flex items-center gap-0.5">
          <ToolButton icon={FlaskConical} label="Lab values" active={panel === "labs"} onClick={() => openPanel("labs")} />
          <ToolButton icon={CalcIcon} label="Calculator" active={panel === "calc"} onClick={() => openPanel("calc")} className="hidden sm:flex" />
          <ToolButton icon={NotebookPen} label="Notes" active={panel === "notes"} onClick={() => openPanel("notes")} className="hidden sm:flex" />
          <ToolButton icon={MessageSquareWarning} label="Report" onClick={() => setReportOpen(true)} className="hidden md:flex" />
          {!review && (
            <span
              className={cn(
                "tabular ml-2 rounded-[6px] px-2.5 py-1.5 text-[13.5px] font-semibold",
                test.mode === "timed" && remaining < 300 ? "bg-incorrect text-surface" : "bg-on-ink/10",
              )}
              title={test.mode === "timed" ? "Block time remaining" : "Time in block"}
            >
              {formatClock(test.mode === "timed" ? remaining : elapsed)}
            </span>
          )}
          {review && test.correct_count != null && (
            <span className="tabular ml-2 rounded-[6px] bg-on-ink/10 px-2.5 py-1.5 text-[13.5px] font-semibold">
              {Math.round((100 * test.correct_count) / test.question_count)}%
            </span>
          )}
        </div>
      </header>

      {/* Mobile navigator strip */}
      <div className="scrollbar-thin flex shrink-0 gap-1 overflow-x-auto border-b border-border bg-panel px-2 py-1.5 lg:hidden">
        {items.map((it, i) => (
          <NavCell key={it.position} i={i} it={it} active={i === pos} review={review || it.state.submitted} onClick={() => go(i)} compact />
        ))}
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Navigator */}
        <nav className="scrollbar-thin hidden w-[72px] shrink-0 overflow-y-auto border-r border-border bg-panel py-2 lg:block" aria-label="Questions">
          {items.map((it, i) => (
            <NavCell key={it.position} i={i} it={it} active={i === pos} review={review || it.state.submitted} onClick={() => go(i)} />
          ))}
        </nav>

        {/* Question */}
        <main id="question-scroll" className="min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[880px] px-5 pb-16 pt-8 md:px-10">
            <div className="mb-5 flex flex-wrap items-center gap-2 text-[12.5px] text-faint">
              {item.is_nugget && <NuggetBadge />}
              {item.source === "argo" && <span className="rounded-full bg-brand-soft px-2 py-0.5 font-semibold text-brand-strong">ARGO-crafted</span>}
              {(review || item.state.submitted) && (
                <span>
                  {item.code} · {item.system}
                </span>
              )}
            </div>
            {item.media?.map((m) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={m.url} src={m.url} alt={m.alt ?? "Question image"} className="mb-5 max-h-[420px] rounded-[8px] border border-border" />
            ))}
            <Stem text={item.stem} highlights={item.state.highlights} onChange={setHighlights} readOnly={false} />
            <p className="mt-5 max-w-[72ch] text-[17px] font-semibold leading-[1.6]">{item.lead_in}</p>

            <div role="radiogroup" aria-label="Answer choices" className="mt-6 grid gap-2">
              {item.options.map((o) => {
                const r = item.review;
                return (
                  <OptionRow
                    key={o.id}
                    label={o.label}
                    body={o.body}
                    selected={item.state.selected_option_id === o.id}
                    struck={item.state.struck.includes(o.label)}
                    locked={locked}
                    correct={r ? o.id === r.correct_option_id : undefined}
                    wrongPick={r ? o.id === item.state.selected_option_id && o.id !== r.correct_option_id : undefined}
                    peerPct={r?.peer && r.peer.n > 0 ? (r.peer.option_pct?.[o.label] ?? 0) : null}
                    celebrate={justSubmitted === pos}
                    onSelect={() => select(o.id)}
                    onStrike={() => strike(o.label)}
                  />
                );
              })}
            </div>

            {!locked && isTutor && (
              <div className="mt-6 flex flex-wrap items-center gap-3">
                {(askConfidence || test.kind === "argo") && (
                <>
                <span className="text-[13px] font-semibold text-muted">How sure are you?</span>
                <div className="flex gap-1">
                  {CONFIDENCE.map((c) => (
                    <button
                      key={c.v}
                      type="button"
                      onClick={() => setConfidence(c.v)}
                      aria-pressed={item.state.confidence === c.v}
                      className={cn(
                        "h-8 rounded-full border px-3 text-[13px] font-semibold transition-colors",
                        item.state.confidence === c.v ? "border-brand bg-brand-soft text-brand-strong" : "border-border text-muted hover:border-border-strong hover:text-text",
                      )}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
                </>
                )}
                <Button className="ml-auto" size="lg" onClick={submit} loading={submitting} disabled={!item.state.selected_option_id}>
                  Submit answer
                </Button>
              </div>
            )}

            {!locked && !isTutor && (
              <p className="mt-6 text-[13px] text-muted">
                Answers are saved as you go. <Kbd>A</Kbd>–<Kbd>E</Kbd> to choose, <Kbd>→</Kbd> next, <Kbd>M</Kbd> mark, right-click to strike out.
              </p>
            )}

            {item.review && (
              <Explanation
                key={item.question_id}
                item={item}
                review={item.review}
                errorType={errorTypes[pos]}
                celebrate={justSubmitted === pos}
                streak={justSubmitted === pos ? streak : 0}
              />
            )}
          </div>
        </main>

        {panel && (
          <div className="fixed inset-x-0 bottom-16 top-14 z-30 lg:static lg:z-auto">
            <SidePanel kind={panel} onKind={setPanel} onClose={() => setPanel(null)} questionId={item.question_id} />
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <footer className="flex h-16 shrink-0 items-center gap-2 border-t border-border bg-surface px-3 md:px-5">
        <Button variant="secondary" onClick={() => go(pos - 1)} disabled={pos === 0}>
          <ChevronLeft className="size-4" /> Previous
        </Button>
        <Button variant="secondary" onClick={() => go(pos + 1)} disabled={pos === items.length - 1}>
          Next <ChevronRight className="size-4" />
        </Button>
        <p className="tabular mx-auto hidden text-[13px] text-muted md:block">
          {review
            ? `${test.correct_count ?? 0} of ${test.question_count} correct`
            : isTutor
              ? `${submittedCount} answered · ${correctSoFar} correct`
              : `${answered} of ${items.length} answered`}
        </p>
        {review ? (
          <Button asChild className="ml-auto md:ml-0">
            <Link href={`/tests/${test.id}`}>Back to results</Link>
          </Button>
        ) : (
          <div className="ml-auto flex items-center gap-2 md:ml-0">
            <Button variant="ghost" onClick={suspend} className="hidden sm:inline-flex">
              <Pause className="size-4" /> Suspend
            </Button>
            <Button variant="danger" onClick={() => setConfirmEnd(true)} loading={ending}>
              <Square className="size-3.5 fill-current" /> End block
            </Button>
          </div>
        )}
      </footer>

      <AlertDialog.Root open={confirmEnd} onOpenChange={setConfirmEnd}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-50 bg-ink/50" />
          <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(440px,92vw)] -translate-x-1/2 -translate-y-1/2 rounded-[12px] border border-border bg-surface p-6 shadow-[var(--shadow-float)]">
            <AlertDialog.Title className="text-[18px] font-[700]">End this block?</AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-[14.5px] text-muted">
              {items.length - (isTutor ? submittedCount : answered) > 0
                ? `${items.length - (isTutor ? submittedCount : answered)} unanswered ${items.length - (isTutor ? submittedCount : answered) === 1 ? "question counts" : "questions count"} as omitted. `
                : ""}
              You will see your score and full explanations next.
            </AlertDialog.Description>
            <div className="mt-6 flex justify-end gap-2">
              <AlertDialog.Cancel asChild>
                <Button variant="secondary">Keep going</Button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <Button variant="danger" onClick={endBlock}>
                  End and score
                </Button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>

      <ReportDialog open={reportOpen} onOpenChange={setReportOpen} questionId={item.question_id} code={item.code} />
    </div>
  );
}

function ToolButton({
  icon: Icon,
  label,
  onClick,
  active,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  active?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={label}
      className={cn(
        "flex h-8 items-center gap-1.5 rounded-[6px] px-2.5 text-[12.5px] font-semibold transition-colors",
        active ? "bg-on-ink/15 text-on-ink" : "text-on-ink-muted hover:bg-on-ink/10 hover:text-on-ink",
        className,
      )}
    >
      <Icon className="size-4" />
      <span className="hidden xl:inline">{label}</span>
    </button>
  );
}

function NavCell({ i, it, active, review, onClick, compact }: { i: number; it: PlayerItem; active: boolean; review: boolean; onClick: () => void; compact?: boolean }) {
  const answered = Boolean(it.state.selected_option_id);
  const status = review && it.review ? (it.state.is_correct ? "correct" : "wrong") : answered ? "answered" : "blank";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "step" : undefined}
      aria-label={`Question ${i + 1}${it.state.marked ? ", marked" : ""}${status === "correct" ? ", correct" : status === "wrong" ? ", incorrect" : answered ? ", answered" : ""}`}
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-[6px] text-[13px] font-semibold tabular transition-colors",
        compact ? "h-8 w-9" : "mx-2 mb-1 h-9 w-[56px]",
        active ? "bg-brand text-on-brand" : status === "blank" ? "text-faint hover:bg-sunken hover:text-text" : "text-text hover:bg-sunken",
      )}
    >
      {i + 1}
      {it.state.marked && <Flag className={cn("absolute left-1 top-1 size-2.5", active ? "fill-on-brand text-on-brand" : "fill-gold text-gold", compact && "left-0.5 top-0.5")} />}
      {status === "correct" && !active && <span className="absolute bottom-1 right-1 size-1.5 rounded-full bg-correct" />}
      {status === "wrong" && !active && <span className="absolute bottom-1 right-1 size-1.5 rounded-full bg-incorrect" />}
      {status === "answered" && !active && <span className="absolute bottom-1 right-1 size-1.5 rounded-full bg-brand-strong" />}
    </button>
  );
}

function ReportDialog({ open, onOpenChange, questionId, code }: { open: boolean; onOpenChange: (v: boolean) => void; questionId: string; code: string }) {
  const [kind, setKind] = useState("error");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  async function send() {
    setSending(true);
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    const { error } = await supabase.from("question_feedback").insert({ user_id: auth.user!.id, question_id: questionId, kind, message: message.trim() || null });
    setSending(false);
    if (error) return toast.error(error.message);
    toast.success("Thanks. Our editors will review it.");
    setMessage("");
    onOpenChange(false);
  }
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(460px,92vw)] -translate-x-1/2 -translate-y-1/2 rounded-[12px] border border-border bg-surface p-6 shadow-[var(--shadow-float)]">
          <Dialog.Title className="text-[18px] font-[700]">Report an issue with {code}</Dialog.Title>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {[
              ["error", "Factual error"],
              ["unclear", "Unclear wording"],
              ["outdated", "Outdated guideline"],
              ["other", "Other"],
            ].map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className={cn("h-8 rounded-full border px-3 text-[13px] font-semibold", kind === k ? "border-brand bg-brand-soft text-brand-strong" : "border-border text-muted")}
              >
                {label}
              </button>
            ))}
          </div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            placeholder="What should we fix?"
            className="mt-4 w-full rounded-[6px] border border-border bg-surface px-3 py-2 text-[14.5px] focus:border-brand-strong focus:outline-none"
          />
          <div className="mt-4 flex justify-end gap-2">
            <Dialog.Close asChild>
              <Button variant="secondary">Cancel</Button>
            </Dialog.Close>
            <Button onClick={send} loading={sending}>
              Send report
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
