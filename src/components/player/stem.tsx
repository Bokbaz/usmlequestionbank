"use client";

import { useCallback, useRef, useState } from "react";
import { Highlighter, Eraser } from "lucide-react";
import type { Highlight } from "./types";

// Renders the vignette with persistent highlights. Offsets index into the raw stem string.
export function Stem({
  text,
  highlights,
  onChange,
  readOnly,
}: {
  text: string;
  highlights: Highlight[];
  onChange: (h: Highlight[]) => void;
  readOnly?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pending, setPending] = useState<{ start: number; end: number; x: number; y: number } | null>(null);

  // Paragraphs with their global offsets.
  const paragraphs: { text: string; offset: number }[] = [];
  let cursor = 0;
  for (const part of text.split(/(\n\s*\n)/)) {
    if (/^\n\s*\n$/.test(part)) {
      cursor += part.length;
      continue;
    }
    paragraphs.push({ text: part, offset: cursor });
    cursor += part.length;
  }

  const sorted = [...highlights].sort((a, b) => a.start - b.start);

  const segments = (p: { text: string; offset: number }) => {
    const out: { text: string; start: number; mark: boolean }[] = [];
    let i = p.offset;
    const end = p.offset + p.text.length;
    for (const h of sorted) {
      if (h.end <= i || h.start >= end) continue;
      const s = Math.max(h.start, i);
      const e = Math.min(h.end, end);
      if (s > i) out.push({ text: text.slice(i, s), start: i, mark: false });
      out.push({ text: text.slice(s, e), start: s, mark: true });
      i = e;
    }
    if (i < end) out.push({ text: text.slice(i, end), start: i, mark: false });
    return out;
  };

  const offsetOf = (node: Node, offset: number) => {
    const el = (node.nodeType === Node.TEXT_NODE ? node.parentElement : (node as Element))?.closest("[data-o]") as HTMLElement | null;
    if (!el) return null;
    const base = Number(el.dataset.o);
    // Count characters before `node` within the segment. Each text node is one line of the
    // segment and lines were joined by a single "\n" (rendered as <br>), so add 1 per line.
    let count = 0;
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let n: Node | null;
    while ((n = walker.nextNode())) {
      if (n === node) return base + count + offset;
      count += (n.textContent ?? "").length + 1;
    }
    return base + offset;
  };

  const onMouseUp = useCallback(() => {
    if (readOnly) return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !ref.current) return setPending(null);
    const range = sel.getRangeAt(0);
    if (!ref.current.contains(range.commonAncestorContainer)) return setPending(null);
    const a = offsetOf(range.startContainer, range.startOffset);
    const b = offsetOf(range.endContainer, range.endOffset);
    if (a == null || b == null || a === b) return setPending(null);
    const rect = range.getBoundingClientRect();
    const box = ref.current.getBoundingClientRect();
    setPending({ start: Math.min(a, b), end: Math.max(a, b), x: rect.left - box.left + rect.width / 2, y: rect.top - box.top });
  }, [readOnly]);

  const addHighlight = () => {
    if (!pending) return;
    const merged: Highlight[] = [];
    let cur = { start: pending.start, end: pending.end };
    for (const h of sorted) {
      if (h.end < cur.start || h.start > cur.end) merged.push(h);
      else cur = { start: Math.min(cur.start, h.start), end: Math.max(cur.end, h.end) };
    }
    merged.push(cur);
    onChange(merged);
    setPending(null);
    window.getSelection()?.removeAllRanges();
  };

  const removeAt = (pos: number) => {
    if (readOnly) return;
    onChange(highlights.filter((h) => !(pos >= h.start && pos < h.end)));
  };

  return (
    <div ref={ref} className="relative" onMouseUp={onMouseUp}>
      <div className="max-w-[72ch] text-[17px] leading-[1.68] text-text">
        {paragraphs.map((p, pi) => (
          <p key={pi} className={pi ? "mt-4" : ""}>
            {segments(p).map((s, si) =>
              s.mark ? (
                <mark
                  key={si}
                  data-o={s.start}
                  onClick={() => removeAt(s.start)}
                  title={readOnly ? undefined : "Click to remove highlight"}
                  className="cursor-pointer rounded-[2px] bg-highlight px-[1px] text-text"
                >
                  {renderLines(s.text)}
                </mark>
              ) : (
                <span key={si} data-o={s.start}>
                  {renderLines(s.text)}
                </span>
              ),
            )}
          </p>
        ))}
      </div>
      {pending && (
        <div className="absolute z-20 -translate-x-1/2 -translate-y-full" style={{ left: pending.x, top: pending.y - 6 }}>
          <div className="flex items-center gap-1 rounded-[8px] bg-ink p-1 shadow-[var(--shadow-float)]">
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={addHighlight} className="flex h-8 items-center gap-1.5 rounded-[6px] px-2.5 text-[12.5px] font-semibold text-on-ink hover:bg-on-ink/10">
              <Highlighter className="size-3.5" /> Highlight
            </button>
            {highlights.length > 0 && (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(highlights.filter((h) => h.end <= pending.start || h.start >= pending.end));
                  setPending(null);
                }}
                className="flex h-8 items-center gap-1.5 rounded-[6px] px-2.5 text-[12.5px] font-semibold text-on-ink-muted hover:bg-on-ink/10"
              >
                <Eraser className="size-3.5" /> Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Keep line breaks inside a segment (lab lists) while preserving character offsets.
function renderLines(t: string) {
  const parts = t.split("\n");
  return parts.map((line, i) => (
    <span key={i}>
      {line}
      {i < parts.length - 1 && <br />}
    </span>
  ));
}
