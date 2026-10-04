// Argonaut Question Format (AQF) parser. See docs/question-format.md.
//
// Lenient by design: the same parser handles hand-written AQF files and loosely
// formatted text pasted from other sources ("Question 12 ... A) ... Answer: C").
// Runs in the browser (instant preview) and on the server (authoritative validation).

import {
  guessSystem,
  resolveCompetency,
  resolveDiscipline,
  resolveExam,
  resolveSystem,
  type ExamKey,
} from "@/lib/taxonomy";

export type AqfOption = { label: string; body: string; concept?: string };

export type AqfQuestion = {
  index: number;
  code?: string;
  exam: ExamKey;
  system?: string;
  systemGuessed?: boolean;
  discipline?: string;
  competency?: string;
  category?: string;
  topic?: string;
  difficulty: number;
  tags: string[];
  isFree: boolean;
  isDaily: boolean;
  status: "draft" | "published";
  stem: string;
  leadIn: string;
  media: { type: "image"; url: string; alt?: string }[];
  options: AqfOption[];
  correct?: string;
  keyConcept?: string;
  explanation: string;
  optionExplanations: Record<string, string>;
  objective?: string;
  textbook?: string;
  references: string[];
  nuggets: { title: string; body?: string }[];
  errors: string[];
  warnings: string[];
};

export type AqfParseResult = { questions: AqfQuestion[]; fileErrors: string[] };

const BLOCK_SPLIT = /^\s*(?:#{2,}\s*(?:QUESTION|Q)\b.*|(?:QUESTION|Q)\s*#?\s*\d+\s*[:.)-]?\s*|={4,}\s*)$/i;
const BLOCK_END = /^\s*#{2,}\s*END\s*$/i;
const OPTION_LINE = /^\s*(?:\(([A-J])\)|([A-J])[\).:]|([A-J])\s+[-–—])\s+(\S.*)$/;

const SINGLE_KEYS: Record<string, string> = {
  id: "code",
  code: "code",
  "question id": "code",
  exam: "exam",
  step: "exam",
  system: "system",
  "organ system": "system",
  discipline: "discipline",
  subject: "discipline",
  competency: "competency",
  task: "competency",
  "physician task": "competency",
  category: "category",
  topic: "topic",
  difficulty: "difficulty",
  tags: "tags",
  free: "free",
  daily: "daily",
  status: "status",
  answer: "answer",
  "correct answer": "answer",
  correct: "answer",
  "key concept": "keyConcept",
  image: "image",
  media: "image",
};

const SECTION_KEYS: Record<string, Section> = {
  stem: "stem",
  vignette: "stem",
  "lead-in": "leadIn",
  "lead in": "leadIn",
  leadin: "leadIn",
  question: "leadIn",
  options: "options",
  choices: "options",
  "answer choices": "options",
  explanation: "explanation",
  rationale: "explanation",
  "option explanations": "optionExplanations",
  "choice explanations": "optionExplanations",
  "why the others are wrong": "optionExplanations",
  "incorrect answers": "optionExplanations",
  objective: "objective",
  "educational objective": "objective",
  "bottom line": "objective",
  textbook: "textbook",
  library: "textbook",
  "high-yield summary": "textbook",
  references: "references",
  reference: "references",
  sources: "references",
  nuggets: "nuggets",
  nugget: "nuggets",
  concepts: "concepts",
};

type Section =
  | "header"
  | "stem"
  | "leadIn"
  | "options"
  | "explanation"
  | "optionExplanations"
  | "objective"
  | "textbook"
  | "references"
  | "nuggets"
  | "concepts";

const truthy = (v: string) => /^(y|yes|true|1|on)$/i.test(v.trim());

function parseDifficulty(v: string): number {
  const n = Number.parseInt(v, 10);
  if (Number.isFinite(n)) return Math.min(5, Math.max(1, n));
  const w = v.toLowerCase();
  if (w.startsWith("ultra") || w.includes("very hard")) return 5;
  if (w.includes("hard")) return 4;
  if (w.includes("easy")) return 2;
  return 3;
}

function splitBlocks(text: string): string[] {
  const lines = text.replace(/\r\n?/g, "\n").replace(/ /g, " ").split("\n");
  const blocks: string[][] = [];
  let cur: string[] | null = null;
  let sawDelimiter = false;
  for (const line of lines) {
    if (BLOCK_SPLIT.test(line)) {
      sawDelimiter = true;
      if (cur && cur.join("").trim()) blocks.push(cur);
      cur = [];
      continue;
    }
    if (BLOCK_END.test(line)) {
      if (cur && cur.join("").trim()) blocks.push(cur);
      cur = null;
      continue;
    }
    if (!cur) cur = [];
    cur.push(line);
  }
  if (cur && cur.join("").trim()) blocks.push(cur);
  if (!sawDelimiter && blocks.length === 1) {
    // No explicit delimiters: split on "Answer:" boundaries followed by a blank line and new stem.
    return [blocks[0].join("\n")];
  }
  return blocks.map((b) => b.join("\n"));
}

function keyOf(line: string): { key: string; rest: string } | null {
  const m = line.match(/^\s*\**([A-Za-z][A-Za-z \-/']{0,40}?)\**\s*:\s*(.*)$/);
  if (!m) return null;
  return { key: m[1].trim().toLowerCase(), rest: m[2] };
}

function tidy(s: string) {
  return s.replace(/\n{3,}/g, "\n\n").replace(/[ \t]+\n/g, "\n").trim();
}

export function parseQuestionBlock(raw: string, index: number): AqfQuestion {
  const q: AqfQuestion = {
    index,
    exam: "step1",
    difficulty: 3,
    tags: [],
    isFree: false,
    isDaily: false,
    status: "published",
    stem: "",
    leadIn: "",
    media: [],
    options: [],
    explanation: "",
    optionExplanations: {},
    references: [],
    nuggets: [],
    errors: [],
    warnings: [],
  };

  const buf: Record<string, string[]> = {
    stem: [],
    leadIn: [],
    explanation: [],
    objective: [],
    textbook: [],
    references: [],
    nuggets: [],
    concepts: [],
  };
  const optExplain: Record<string, string[]> = {};
  let currentOptExplain: string | null = null;
  let section: Section = "header";
  let lastOption: AqfOption | null = null;
  let sawOptions = false;
  let explicitLeadIn = false;

  for (const line of raw.split("\n")) {
    const k = keyOf(line);
    if (k) {
      const single = SINGLE_KEYS[k.key];
      const sec = SECTION_KEYS[k.key];
      // "Question:" is a section key, but "Question 3:" style labels are handled by the splitter.
      // Metadata keys are honoured anywhere except inside the vignette and Library text.
      if (single && (section === "header" || (section !== "stem" && section !== "textbook"))) {
        const v = k.rest.trim();
        switch (single) {
          case "code":
            q.code = v || undefined;
            break;
          case "exam":
            q.exam = resolveExam(v) ?? q.exam;
            if (!resolveExam(v)) q.warnings.push(`Unknown exam "${v}", using Step 1`);
            break;
          case "system":
            q.system = resolveSystem(v);
            if (!q.system && v) q.errors.push(`Unknown system "${v}"`);
            break;
          case "discipline":
            q.discipline = resolveDiscipline(v);
            if (!q.discipline && v) q.warnings.push(`Unknown discipline "${v}" (left blank)`);
            break;
          case "competency":
            q.competency = resolveCompetency(v);
            if (!q.competency && v) q.warnings.push(`Unknown competency "${v}" (left blank)`);
            break;
          case "category":
            q.category = v || undefined;
            break;
          case "topic":
            q.topic = v || undefined;
            break;
          case "difficulty":
            q.difficulty = parseDifficulty(v);
            break;
          case "tags":
            q.tags = v.split(/[,;]/).map((t) => t.trim()).filter(Boolean);
            break;
          case "free":
            q.isFree = truthy(v);
            break;
          case "daily":
            q.isDaily = truthy(v);
            break;
          case "status":
            q.status = /draft/i.test(v) ? "draft" : "published";
            break;
          case "answer": {
            const m = v.match(/\b([A-J])\b/) ?? v.match(/^\(?([A-J])/i);
            if (m) q.correct = m[1].toUpperCase();
            section = "explanation";
            // "Answer: C. <long rationale>" keeps the rationale; a bare option name is dropped.
            const tail = v.replace(/^\(?[A-J]\)?[.:)]?\s*/i, "").trim();
            if (tail.length > 80) buf.explanation.push(tail);
            break;
          }
          case "keyConcept":
            q.keyConcept = v || undefined;
            break;
          case "image":
            if (v) q.media.push({ type: "image", url: v.split(/\s+/)[0], alt: v.split(/\s+/).slice(1).join(" ") || undefined });
            break;
        }
        continue;
      }
      if (sec) {
        section = sec;
        if (sec === "leadIn") explicitLeadIn = true;
        if (sec === "optionExplanations") currentOptExplain = null;
        if (k.rest.trim()) {
          if (sec === "leadIn") buf.leadIn.push(k.rest.trim());
          else if (sec !== "options" && sec !== "optionExplanations") buf[sec].push(k.rest.trim());
        }
        continue;
      }
    }

    const opt = line.match(OPTION_LINE);

    if (section === "optionExplanations") {
      if (opt) {
        currentOptExplain = (opt[1] ?? opt[2] ?? opt[3]).toUpperCase();
        optExplain[currentOptExplain] = [opt[4]];
      } else if (currentOptExplain) {
        optExplain[currentOptExplain].push(line);
      }
      continue;
    }

    if (section === "concepts") {
      const m = line.match(/^\s*\(?([A-J])\)?\s*[=:\-–]\s*(.+)$/);
      if (m) buf.concepts.push(`${m[1].toUpperCase()}\u0000${m[2].trim()}`);
      continue;
    }

    if (opt && (section === "options" || ((section === "stem" || section === "leadIn" || section === "header") && !sawOptions))) {
      sawOptions = true;
      section = "options";
      lastOption = { label: (opt[1] ?? opt[2] ?? opt[3]).toUpperCase(), body: opt[4].trim() };
      q.options.push(lastOption);
      continue;
    }

    if (section === "options") {
      if (!line.trim()) {
        lastOption = null;
        continue;
      }
      if (lastOption) {
        lastOption.body += " " + line.trim();
        continue;
      }
      // Text after the options but before "Answer:" is treated as explanation.
      section = "explanation";
    }

    if (section === "header") {
      if (!line.trim()) continue;
      section = "stem";
    }

    if (section === "explanation" && opt && !q.correct) {
      // Some sources list explanations per option without a header.
      section = "optionExplanations";
      currentOptExplain = (opt[1] ?? opt[2] ?? opt[3]).toUpperCase();
      optExplain[currentOptExplain] = [opt[4]];
      continue;
    }

    if (section in buf) buf[section].push(line);
  }

  q.stem = tidy(buf.stem.join("\n"));
  q.leadIn = tidy(buf.leadIn.join(" "));
  if (!explicitLeadIn || !q.leadIn) {
    // Pull the final question sentence out of the stem.
    const paragraphs = q.stem.split(/\n\s*\n/);
    const last = paragraphs[paragraphs.length - 1] ?? "";
    const m = last.match(/([^.?!]*\?)\s*$/);
    if (m && !q.leadIn) {
      q.leadIn = m[1].trim();
      const before = last.slice(0, last.length - m[0].length).trim();
      paragraphs[paragraphs.length - 1] = before;
      q.stem = tidy(paragraphs.filter(Boolean).join("\n\n"));
    }
  }
  q.explanation = tidy(buf.explanation.join("\n"));
  q.objective = tidy(buf.objective.join(" ")) || undefined;
  q.textbook = tidy(buf.textbook.join("\n")) || undefined;
  q.references = buf.references.map((r) => r.replace(/^\s*[-*•]\s*/, "").trim()).filter(Boolean);
  q.nuggets = buf.nuggets
    .map((l) => l.replace(/^\s*[-*•]\s*/, "").trim())
    .filter(Boolean)
    .map((l) => {
      const [title, ...rest] = l.split("::");
      return { title: title.trim(), body: rest.join("::").trim() || undefined };
    });
  for (const [label, lines] of Object.entries(optExplain)) {
    q.optionExplanations[label] = tidy(lines.join("\n"));
  }
  for (const c of buf.concepts) {
    const [label, concept] = c.split("\u0000");
    const o = q.options.find((x) => x.label === label);
    if (o) o.concept = concept;
  }

  // Validation -----------------------------------------------------------------
  if (!q.stem) q.errors.push("Missing stem (vignette)");
  if (!q.leadIn) q.errors.push("Missing lead-in question");
  else if (!q.leadIn.trim().endsWith("?")) q.warnings.push("Lead-in does not end with a question mark");
  if (q.options.length < 3) q.errors.push(`Only ${q.options.length} answer options found (need at least 3)`);
  const labels = q.options.map((o) => o.label);
  if (new Set(labels).size !== labels.length) q.errors.push("Duplicate option labels");
  labels.forEach((l, i) => {
    if (l !== String.fromCharCode(65 + i)) q.warnings.push(`Option labels are not consecutive (found ${labels.join(", ")})`);
  });
  if (!q.correct) q.errors.push("Missing answer");
  else if (!labels.includes(q.correct)) q.errors.push(`Answer ${q.correct} is not one of the options`);
  if (!q.system) {
    const guess = guessSystem(`${q.stem} ${q.leadIn} ${q.explanation}`);
    if (guess) {
      q.system = guess;
      q.systemGuessed = true;
      q.warnings.push(`System not given; guessed "${guess}"`);
    } else if (!q.errors.some((e) => e.startsWith("Unknown system"))) {
      q.errors.push("Missing system");
    }
  }
  if (!q.explanation) q.warnings.push("No explanation");
  const missingExplain = labels.filter((l) => !q.optionExplanations[l]);
  if (q.explanation && missingExplain.length && missingExplain.length < labels.length) {
    q.warnings.push(`No explanation for option(s) ${missingExplain.join(", ")}`);
  } else if (missingExplain.length === labels.length && labels.length) {
    q.warnings.push("No per-option explanations");
  }
  if (!q.objective) q.warnings.push("No educational objective");
  if (!q.topic) q.warnings.push("No topic (Library article will not be linked)");
  q.warnings = [...new Set(q.warnings)];
  return q;
}

export function parseAqf(text: string): AqfParseResult {
  const fileErrors: string[] = [];
  if (!text.trim()) return { questions: [], fileErrors: ["File is empty"] };
  const blocks = splitBlocks(text);
  const questions = blocks.map((b, i) => parseQuestionBlock(b, i + 1)).filter((q) => q.stem || q.options.length);
  if (!questions.length) fileErrors.push("No questions found. Separate questions with a line '### QUESTION'.");
  const codes = new Map<string, number>();
  for (const q of questions) {
    if (!q.code) continue;
    if (codes.has(q.code)) q.errors.push(`Duplicate ID ${q.code} (also question #${codes.get(q.code)})`);
    else codes.set(q.code, q.index);
  }
  return { questions, fileErrors };
}

// Shape sent to the admin_upsert_question RPC.
export function toUpsertPayload(q: AqfQuestion, extra: { batchId?: string; source?: string } = {}) {
  return {
    code: q.code,
    exam: q.exam,
    status: q.status,
    stem: q.stem,
    lead_in: q.leadIn,
    media: q.media,
    system: q.system,
    discipline: q.discipline ?? null,
    competency: q.competency ?? null,
    category: q.category ?? null,
    topic: q.topic ?? null,
    difficulty: q.difficulty,
    is_free: q.isFree,
    is_daily_eligible: q.isDaily,
    tags: q.tags,
    options: q.options.map((o) => ({ label: o.label, body: o.body, concept: o.concept ?? null })),
    correct: q.correct,
    explanation: q.explanation,
    option_explanations: q.optionExplanations,
    objective: q.objective ?? null,
    textbook: q.textbook ?? null,
    key_concept: q.keyConcept ?? q.options.find((o) => o.label === q.correct)?.concept ?? null,
    references: q.references,
    nuggets: q.nuggets.length ? q.nuggets : undefined,
    batch_id: extra.batchId ?? null,
    source: extra.source ?? "import",
  };
}
