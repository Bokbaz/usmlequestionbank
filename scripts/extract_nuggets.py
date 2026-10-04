"""Build the private Nugget index from licensed high-yield PDFs.

Each PDF becomes a list of short concept units (one bullet or one "clue -> answer" line)
with its section heading. Output is JSON for the seeding step. The PDFs and the JSON are
third-party material: never commit them; the index is only used to *detect* whether a
question tests an ultra-high-yield concept.

Usage: python scripts/extract_nuggets.py "<pdf dir>" out.json
"""
import json
import os
import re
import sys

import pymupdf

GLYPHS = {
    "à": "→",  # à  -> →  (Symbol font arrow)
    "­": "↑",  # soft hyphen -> ↑
    "¯": "↓",  # macron -> ↓
    "«": "↔",  # « -> ↔ (no change)
}
BOILER = re.compile(r"^(MEHLMANMEDICAL(\.COM)?|YouTube|Instagram|@mehlman\S*|\d{1,3})$", re.I)
BULLET = re.compile(r"^(?:-|o|•|▪|)\s+")
NUMBERED = re.compile(r"^\d{1,3}\.\s+\S")

SYSTEM_BY_FILE = {
    "Cardio": "cardiovascular", "Renal": "renal", "Gastrointestinal": "gastrointestinal",
    "Neuro": "nervous", "Neuroanatomy": "nervous", "Ophthal": "nervous", "Dermatology": "skin",
    "MSK_Anatomy": "musculoskeletal", "Heme_Onc": "blood-lymph", "Immunology": "immune",
    "Endocrine": "endocrine", "Biochem": "general-principles", "Genetics": "general-principles",
    "Pathology": "general-principles", "Communication_Ethics": "social-sciences",
    "Biostatistics": "biostatistics", "Obgyn": None, "Pediatrics": None,
}


def clean(s: str) -> str:
    for k, v in GLYPHS.items():
        s = s.replace(k, v)
    s = s.replace("’", "'").replace("“", '"').replace("”", '"')
    return re.sub(r"\s+", " ", s).strip()


def source_meta(fname: str):
    base = os.path.splitext(fname)[0].strip()
    title = base.replace("MEHLMANMEDICAL - ", "").replace("_", " & ").strip()
    key = base.replace("HY ", "").replace("MEHLMANMEDICAL - ", "").replace(" Review", "").strip()
    system = None
    for k, v in SYSTEM_BY_FILE.items():
        if key == k or key.startswith(k):
            system = v
            break
    slug = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
    return slug, title, system


def is_heading(line: str, nxt: str) -> bool:
    if BULLET.match(line) or NUMBERED.match(line) or "→" in line:
        return False
    if len(line) > 70 or line.endswith((".", ",", ";", ":")) or line[:1].islower():
        return False
    words = line.split()
    return 0 < len(words) <= 9 and (nxt is None or BULLET.match(nxt) is not None or len(nxt) < 45)


def units_from_doc(doc):
    lines = []
    for pno, page in enumerate(doc, start=1):
        for raw in page.get_text().splitlines():
            t = clean(raw)
            if not t or BOILER.match(t):
                continue
            lines.append((pno, t))

    arrow_ratio = sum(1 for _, t in lines if "→" in t) / max(1, len(lines))
    bullet_ratio = sum(1 for _, t in lines if BULLET.match(t)) / max(1, len(lines))
    line_mode = arrow_ratio > 0.35 and bullet_ratio < 0.1

    units, cur, section, pending_heading = [], None, None, []
    bullet_next = False

    def flush():
        nonlocal cur
        if cur and len(cur["body"]) >= 25:
            units.append(cur)
        cur = None

    for i, (pno, t) in enumerate(lines):
        nxt = lines[i + 1][1] if i + 1 < len(lines) else None
        if line_mode:
            starts_new = "→" in t and not (cur and cur["body"].rstrip().endswith(("+", ",", "(", "→", "/", "or", "and")))
            if cur is None or starts_new or (t[:1].isupper() and cur["body"].endswith((".", ")")) ):
                flush()
                cur = {"page": pno, "section": section, "body": t}
            else:
                cur["body"] += " " + t
            continue

        if t in ("-", "o", "\u2022", "\u25aa", "\uf0b7"):
            flush()
            bullet_next = True
            continue
        if bullet_next:
            bullet_next = False
            pending_heading = []
            flush()
            cur = {"page": pno, "section": section, "body": t}
            continue
        if is_heading(t, nxt):
            flush()
            pending_heading.append(t)
            section = " ".join(pending_heading)[:120]
            continue
        pending_heading = []
        if BULLET.match(t) or NUMBERED.match(t):
            flush()
            cur = {"page": pno, "section": section, "body": BULLET.sub("", t)}
            if NUMBERED.match(t) and len(t) < 260:
                section = t[:120]
        elif cur is not None:
            cur["body"] += " " + t
        else:
            cur = {"page": pno, "section": section, "body": t}
    flush()

    out = []
    for u in units:
        body = u["body"].strip()
        chunks = [body]
        if len(body) > 700:
            sentences = re.split(r"(?<=[.!?])\s+(?=[A-Z])", body)
            chunks, buf = [], ""
            for s in sentences:
                if len(buf) + len(s) > 420 and buf:
                    chunks.append(buf.strip())
                    buf = ""
                buf += " " + s
            if buf.strip():
                chunks.append(buf.strip())
        for c in chunks:
            if len(c) < 25:
                continue
            trig, ans = None, None
            m = re.search(r"answer\s*=\s*([^.;]+)", c, re.I)
            if "→" in c:
                left, _, right = c.partition("→")
                trig, ans = left.strip(" -"), right.strip()
            if m:
                ans = m.group(1).strip()
                trig = trig or c[: m.start()].strip()
            out.append({"page": u["page"], "section": u["section"], "body": c[:900],
                        "trigger": (trig or None) and trig[:400], "answer": (ans or None) and ans[:300]})
    return out


def main():
    src, dest = sys.argv[1], sys.argv[2]
    sources = []
    for fname in sorted(os.listdir(src)):
        if not fname.lower().endswith(".pdf") or "Item-Writing" in fname or "Content_Outline" in fname:
            continue
        doc = pymupdf.open(os.path.join(src, fname))
        slug, title, system = source_meta(fname)
        units = units_from_doc(doc)
        sources.append({"slug": slug, "title": title, "file_name": fname, "pages": len(doc),
                        "system": system, "units": units})
        print(f"{fname[:45]:45s} pages={len(doc):4d} units={len(units):5d} system={system}")
    with open(dest, "w") as fh:
        json.dump(sources, fh)
    print("total units:", sum(len(s["units"]) for s in sources))


if __name__ == "__main__":
    main()
