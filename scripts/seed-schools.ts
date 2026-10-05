// Loads the medical school list used by onboarding's school search. Idempotent: rows upsert by
// (source, external_id), and a name already present for the same country is skipped.
//
//   npx tsx scripts/seed-schools.ts                      # content/schools/medical-schools.json (open data)
//   npx tsx scripts/seed-schools.ts --wdoms School.csv   # the official WDOMS export (FAIMER subscription)
//
// The open-data seed comes from Wikidata (CC0: "medical school" and its subclasses, closed schools
// removed) plus medical entries from the Hipo university-domains list (MIT). WDOMS columns are
// matched by header name, so minor layout changes in the export don't break the import.
//
// Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.

import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

type School = { name: string; country: string | null; city: string | null; source: "wikidata" | "hipo" | "wdoms"; external_id: string | null };

const root = path.resolve(__dirname, "..");
const env = Object.fromEntries(
  fs
    .readFileSync(path.join(root, ".env.local"), "utf8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim()]),
);
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
const sb = createClient(url, serviceKey, { auth: { persistSession: false } });

// Minimal RFC 4180 parser: quoted fields, escaped quotes, newlines inside quotes.
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((f) => f.trim()));
}

// Country name -> ISO 3166 alpha-2, built from the runtime's own region names.
function countryLookup() {
  const names = new Intl.DisplayNames(["en"], { type: "region" });
  const map = new Map<string, string>();
  const A = 65;
  for (let a = 0; a < 26; a++)
    for (let b = 0; b < 26; b++) {
      const code = String.fromCharCode(A + a, A + b);
      const name = names.of(code);
      if (name && name !== code) map.set(name.toLowerCase(), code);
    }
  return (v: string) => {
    const t = v.trim();
    if (/^[A-Za-z]{2}$/.test(t)) return t.toUpperCase();
    return map.get(t.toLowerCase()) ?? null;
  };
}

function readWdoms(file: string): School[] {
  const [header, ...rows] = parseCsv(fs.readFileSync(file, "utf8").replace(/^﻿/, ""));
  const norm = header.map((h) => h.toLowerCase().replace(/[^a-z]/g, ""));
  const col = (...names: string[]) => norm.findIndex((h) => names.includes(h));
  const iId = col("schoolid", "id", "wdomsid");
  const iName = col("schoolname", "name", "officialname", "englishname");
  const iCountry = col("country", "countryname", "countrycode", "iso", "isocode");
  const iCity = col("city", "cityname");
  const iStatus = col("operationalstatus", "status", "schoolstatus");
  if (iName < 0) throw new Error(`No school name column in ${file}. Headers: ${header.join(", ")}`);
  const toCode = countryLookup();
  return rows
    .filter((r) => iStatus < 0 || !/not operational|closed|inactive/i.test(r[iStatus] ?? ""))
    .map((r) => ({
      name: r[iName].trim(),
      country: iCountry >= 0 ? toCode(r[iCountry] ?? "") : null,
      city: iCity >= 0 ? r[iCity]?.trim() || null : null,
      source: "wdoms" as const,
      external_id: iId >= 0 ? r[iId]?.trim() || null : null,
    }))
    .filter((s) => s.name.length >= 2);
}

async function main() {
  const wdomsArg = process.argv.indexOf("--wdoms");
  const schools: School[] =
    wdomsArg > 0
      ? readWdoms(path.resolve(process.argv[wdomsArg + 1] ?? ""))
      : JSON.parse(fs.readFileSync(path.join(root, "content/schools/medical-schools.json"), "utf8"));

  const key = (n: string, c: string | null) => `${n.toLowerCase()}|${c ?? ""}`;
  const seen = new Set<string>();
  // The API returns at most 1,000 rows per request: page through what's already there.
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb.from("medical_schools").select("name, country").order("id").range(from, from + 999);
    if (error) throw error;
    for (const r of data) seen.add(key(r.name, r.country));
    if (data.length < 1000) break;
  }

  const fresh = schools.filter((s) => {
    const k = key(s.name, s.country);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  for (let i = 0; i < fresh.length; i += 500) {
    const { error } = await sb.from("medical_schools").insert(fresh.slice(i, i + 500));
    if (error) throw error;
  }
  console.log(`${schools.length} read, ${fresh.length} added, ${schools.length - fresh.length} already listed.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
