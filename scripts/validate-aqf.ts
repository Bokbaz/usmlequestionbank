// Usage: npx tsx scripts/validate-aqf.ts content/seed/*.aqf.txt
import fs from "node:fs";
import { parseAqf } from "../src/lib/aqf/parse";

let total = 0;
let bad = 0;
const answers: Record<string, number> = {};
for (const file of process.argv.slice(2)) {
  const { questions, fileErrors } = parseAqf(fs.readFileSync(file, "utf8"));
  if (fileErrors.length) console.log(file, fileErrors);
  for (const q of questions) {
    total++;
    answers[q.correct ?? "?"] = (answers[q.correct ?? "?"] ?? 0) + 1;
    const optExp = Object.keys(q.optionExplanations).length;
    const flag = q.errors.length ? "ERROR" : q.warnings.length ? "warn " : "ok   ";
    if (q.errors.length) bad++;
    console.log(
      `${flag} ${q.code ?? "#" + q.index} ${q.exam} ${q.system}/${q.discipline}/${q.competency} topic="${q.topic}" opts=${q.options.length} ans=${q.correct} optExp=${optExp} nuggets=${q.nuggets.length} stem=${q.stem.length}c lead="${q.leadIn.slice(0, 50)}"`,
    );
    for (const e of q.errors) console.log("    error:", e);
    for (const w of q.warnings) console.log("    warn:", w);
  }
}
console.log(`\n${total} questions, ${bad} with errors. Answer distribution:`, answers);
