"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CheckCircle2, Loader2, Sparkles, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createTestFromIds } from "@/app/actions/tests";
import { cn } from "@/lib/utils";

type Target = { dim: string; refId: number; name: string; available: number };
type Slot =
  | { state: "writing" }
  | { state: "accepted"; id: string; keyConcept: string }
  | { state: "rejected" }
  | { state: "failed"; error: string };

const PER_RUN = 3;

// Lets an ARGO student ask for new questions when the bank runs short on a weak concept.
// Each question is written and verified server-side; this tracks the parallel requests.
export function ArgoWriter({ targets, remaining }: { targets: Target[]; remaining: number | null }) {
  const router = useRouter();
  const [target, setTarget] = useState(targets[0]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [left, setLeft] = useState(remaining);
  const [starting, start] = useTransition();
  const running = slots.some((s) => s.state === "writing");
  const accepted = slots.filter((s): s is Extract<Slot, { state: "accepted" }> => s.state === "accepted");
  const count = left == null ? PER_RUN : Math.min(PER_RUN, left);

  async function write() {
    setSlots(Array.from({ length: count }, () => ({ state: "writing" })));
    await Promise.all(
      Array.from({ length: count }, async (_, i) => {
        let next: Slot;
        try {
          const res = await fetch("/api/argo/write", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ dim: target.dim, ref: target.refId }),
          });
          const json = await res.json().catch(() => ({}));
          setLeft((l) => (l == null ? null : res.status === 429 ? 0 : Math.max(0, l - 1)));
          if (!res.ok) next = { state: "failed", error: json.error ?? `Request failed (${res.status})` };
          else if (json.status === "accepted") next = { state: "accepted", id: json.id, keyConcept: json.keyConcept };
          else next = { state: "rejected" };
        } catch {
          next = { state: "failed", error: "Connection lost. The question may still arrive in your next session." };
        }
        setSlots((prev) => prev.map((s, j) => (j === i ? next : s)));
      }),
    );
  }

  function practice() {
    start(async () => {
      const res = await createTestFromIds(
        accepted.map((a) => a.id),
        `ARGO · ${target.name}`,
        "tutor",
      );
      if (res.error || !res.id) {
        toast.error(res.error ?? "Could not start the block");
        return;
      }
      router.push(`/test/${res.id}`);
    });
  }

  return (
    <div className="mt-4 rounded-[8px] bg-panel p-4">
      <p className="flex items-start gap-2 text-[13.5px]">
        <Sparkles className="mt-0.5 size-4 shrink-0 text-brand" />
        <span>
          Running low on unseen questions for <strong>{target.name}</strong> ({target.available} left). ARGO can write new ones aimed at the answers you have been getting wrong. Each is solved blind and fact-checked
          before you see it.
        </span>
      </p>
      {targets.length > 1 && !slots.length && (
        <div className="mt-3 flex flex-wrap gap-1.5 pl-6">
          {targets.map((t) => (
            <button
              key={`${t.dim}-${t.refId}`}
              type="button"
              onClick={() => setTarget(t)}
              className={cn("h-7 rounded-full px-3 text-[12.5px] font-semibold", t === target ? "bg-ink text-on-ink" : "bg-surface text-muted hover:text-text")}
            >
              {t.name}
            </button>
          ))}
        </div>
      )}
      {slots.length > 0 && (
        <ul className="mt-3 grid gap-1.5 pl-6 text-[13px]">
          {slots.map((s, i) => (
            <li key={i} className="flex items-start gap-2">
              {s.state === "writing" ? (
                <>
                  <Loader2 className="mt-0.5 size-3.5 animate-spin text-brand" /> <span className="text-muted">Writing and verifying (about two minutes)</span>
                </>
              ) : s.state === "accepted" ? (
                <>
                  <CheckCircle2 className="mt-0.5 size-3.5 text-correct" /> <span>{s.keyConcept}</span>
                </>
              ) : s.state === "rejected" ? (
                <>
                  <XCircle className="mt-0.5 size-3.5 text-faint" /> <span className="text-muted">Draft failed verification and was discarded</span>
                </>
              ) : (
                <>
                  <XCircle className="mt-0.5 size-3.5 text-incorrect" /> <span className="text-incorrect">{s.error}</span>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-3 pl-6">
        {accepted.length > 0 && !running ? (
          <Button size="sm" onClick={practice} loading={starting}>
            Practice {accepted.length === 1 ? "it" : `these ${accepted.length}`} now
          </Button>
        ) : (
          <Button size="sm" variant="secondary" onClick={write} loading={running} disabled={running || count <= 0}>
            Write {count} new {count === 1 ? "question" : "questions"}
          </Button>
        )}
        {left != null && <span className="text-[12.5px] text-muted">{left} left this week</span>}
      </div>
    </div>
  );
}
