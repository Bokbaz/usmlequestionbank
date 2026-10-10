# Argonaut Question Format (AQF)

AQF is the plain-text format the admin importer (`/admin/import`) reads. The importer also reads ARGO pipeline exports as they are; see [ARGO pipeline exports](#argo-pipeline-exports). One file can hold any number of questions. The parser is lenient: loosely formatted text pasted from elsewhere ("Question 12", "A)", "Answer: C") is understood too, and the importer shows every problem before anything is saved.

Re-importing a question with the same `ID` updates it in place. Answer history is kept when option labels survive the edit.

## Block structure

```
### QUESTION
ID: AQ-2001
Exam: Step 1
System: Renal
Discipline: Physiology
Competency: Causes & mechanisms
Category: Acid-base disorders
Topic: Renal tubular acidosis
Difficulty: 3
Tags: acidosis, potassium
Free: no
Daily: no
Status: published

Stem:
A 34-year-old woman comes to the physician because of ...
Her pulse is 84/min and blood pressure is 118/76 mm Hg.
Serum:
Na+ 140 mEq/L
K+ 3.1 mEq/L

Lead-in: Which of the following is the most likely cause of this patient's condition?

A. First choice
B. Second choice
C. Third choice
D. Fourth choice
E. Fifth choice

Answer: B
Key concept: Distal (type 1) renal tubular acidosis

Concepts:
A = Proximal renal tubular acidosis
B = Distal renal tubular acidosis

Explanation:
Why the answer is correct. Markdown is allowed: **bold**, lists, tables.

Option explanations:
A. Why A is wrong, and what finding would have made it right.
B. Correct. Why B is right.
C. ...

Objective: One or two sentences stating the rule a student should remember.

Textbook:
A study note of 120 to 250 words written to stand alone. It becomes part of the
Library chapter for this question's Topic. Tables and bullets are welcome.

References:
- Author. Title. Edition. Publisher; Year.

Nuggets:
- Card title :: One-sentence high-yield point in your own words
### END
```

`### QUESTION` starts a block and `### END` closes it. `### END` is optional when the next block starts immediately. Lines such as `Question 12`, `Q12:` or a row of `====` also start a new block.

## Fields

| Field | Required | Notes |
|---|---|---|
| Stem | yes | The vignette. Paragraphs separated by a blank line; keep each vital sign or lab on its own line. |
| Lead-in | yes | The question sentence. If omitted, the last sentence of the stem ending in `?` is used. |
| Options | yes | 3 to 10 lines `A.` `B)` `(C)` or `D -`. Continuation lines join the option above. |
| Answer | yes | The correct label. `Answer: C. Long rationale ...` keeps the rationale as the explanation. |
| ID | recommended | Stable identifier such as `AQ-2001`. Without it a new ID is assigned on every import. |
| System | recommended | Organ system from the USMLE content outline. If missing, the importer guesses from keywords, uses the fallback you pick, or AI classification fills it. |
| Exam | no | `Step 1` (default), `Step 2 CK`, or `Step 3`. |
| Discipline | no | Pathology, Physiology, Pharmacology, Microbiology, Biochemistry, ... and clinical disciplines (Medicine, Surgery, Pediatrics, ...). |
| Competency | no | Physician task, for example `Formulating the diagnosis`, `Pharmacotherapy`, `Causes & mechanisms`. |
| Category | no | Outline category within the system. |
| Topic | strongly recommended | Library chapter the question belongs to. Questions sharing a topic build one chapter; ARGO tracks mastery per topic. |
| Difficulty | no | 1 to 5, or words such as `easy`, `hard`, `ultra hard`. Default 3. |
| Tags | no | Comma-separated. |
| Free | no | `yes` makes the question available on the free plan. |
| Daily | no | `yes` adds it to the Daily Challenge pool. Use only for very hard Step 1 items. |
| Status | no | `published` (default) or `draft`. The importer can default everything to draft. |
| Image | no | `Image: https://... alt text`, one line per image. |
| Key concept | no | The single fact tested. Used for Nugget detection and analytics. |
| Concepts | no | `A = concept` per option. Powers ARGO's confusion tracking (what students mistake for what). |
| Explanation | recommended | Why the answer is right. |
| Option explanations | recommended | One entry per option, including the correct one. |
| Objective | recommended | The educational objective. |
| Textbook | recommended | Library text for the topic. |
| References | no | One per line, with or without a leading `-`. |
| Nuggets | no | Hand-curated high-yield cards: `- Title :: body`. Without them, Nuggets are detected automatically by comparing the question with the private high-yield index. |

Metadata lines (`System:`, `Difficulty:` ...) may appear anywhere outside the Stem and Textbook sections.

## What happens on import

1. The file is parsed in the browser. Each question is marked ready, ready with warnings, or blocked, with the reasons listed.
2. Optional AI assist (requires `ANTHROPIC_API_KEY`): **Classify** fills missing system, discipline, competency, category, topic and key concept; **Repair** restructures blocks the parser could not read. Neither rewrites medical content.
3. Questions are saved in chunks of 20. For each one the testing point is embedded and compared with the high-yield index: strong matches become Nuggets automatically, borderline ones go to `/admin/nuggets` for review.
4. Library chapters are rebuilt for every topic touched by the import.

## ARGO pipeline exports

The importer also reads approved batches from the ARGO authoring pipeline exactly as exported, in any of its four formats. All four give the same questions on the site (`src/lib/import/argo-format.ts`).

| File | Shape |
|---|---|
| `approved_….json` | Array of items |
| `approved_….jsonl` | One item per line |
| `approved_….csv` | One row per item: choices in columns `A` to `E`, `distractor_explanations` and `tags` as JSON text |
| `approved_….txt` | Readable blocks separated by a row of `=`: `Question ID:`, vignette, lead-in, choices, `Correct Answer:`, explanation, `Why each other option is incorrect:`, `Educational Objective:`, `Core Concept:`, `Tags:`, `Sources:` |

The `.txt` and `.csv` exports carry exam, system, difficulty, physician task and condition only as tags (`EXAM: STEP1; SYSTEM: respiratory_renal; ...`). When a file has both, the item's own fields win over tags. Only `APPROVED` items are read; `sources` (licensed study notes) are never read.

How fields map:

| On the site | From the file |
|---|---|
| Stem, lead-in, options, answer | `stem`, `lead_in`, `choices`, `correct_choice`. A question repeated at the end of the stem is removed (the lead-in is the question); quoted speech stays. |
| Explanation | `correct_explanation` |
| Option explanations | `distractor_explanations`, plus `Correct. <core concept>` for the answer |
| Objective | `educational_objective` |
| Key concept | the `core testing point` tag, else `core_concept` |
| Exam, difficulty | `exam_target`; `EASY` 2, `MEDIUM` 3, `HARD` 4, `ULTRAHARD` 5. `ULTRAHARD` joins the Daily pool. |
| Discipline, task | `DISCIPLINE` tags; `physician_task` |
| Tags | the condition |
| Re-import match | `question_id` (stored as `source_ref`) |

Placement:

- **Already in the bank** (same `question_id`): the text is updated in place; system, topic, category, key concept, discipline, task, Free, Daily and status stay as the site has them.
- **New**: the pipeline's systems are combined (`respiratory_renal`), so each question is embedded and compared with the bank. The system is a similarity-weighted vote of its 5 closest questions among the systems its label allows (`multisystem` and `social` may go anywhere). The topic is the closest question's topic in that system when it is at least 88% similar, else an existing topic whose name sits inside the condition, else a new topic named after the condition. On the 1,361 hand-placed questions this matched the hand-picked system 84% of the time. Every placement can be changed in the review before importing.
- **Duplicates**: a new question on the same exam with the same testing point as a bank question (96% similar, or 93% with mostly the same condition words), or as an earlier question in the file, is set aside. So are questions listed in `content/approved/skipped.json`. Open one to compare and import it anyway if it is different.

## Exporting

`/admin/questions` exports any filtered set as AQF. Edit the file and import it again to update those questions in place. Retired questions export with `Status: draft` so a round trip never republishes them.
