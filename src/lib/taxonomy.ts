// Mirrors supabase/migrations/20261004120000_taxonomy.sql. Slugs are the contract
// between the importer, the database and the UI.

export type ExamKey = "step1" | "step2ck" | "step3";

export const EXAMS: { key: ExamKey; label: string; short: string }[] = [
  { key: "step1", label: "USMLE Step 1", short: "Step 1" },
  { key: "step2ck", label: "USMLE Step 2 CK", short: "Step 2 CK" },
  { key: "step3", label: "USMLE Step 3", short: "Step 3" },
];

export const SYSTEMS = [
  { slug: "general-principles", name: "General Principles", aliases: ["general principles of foundational science", "general", "foundational science", "biochemistry", "genetics", "cell biology"] },
  { slug: "human-development", name: "Human Development", aliases: ["development", "growth and development", "normal development"] },
  { slug: "immune", name: "Immune", aliases: ["immune system", "immunology", "allergy", "allergy and immunology"] },
  { slug: "blood-lymph", name: "Hematology", aliases: ["blood", "blood & lymphoreticular system", "blood and lymphoreticular", "heme", "hematology", "hematology/oncology", "heme/onc", "heme onc", "oncology"] },
  { slug: "behavioral-health", name: "Behavioral Health", aliases: ["psychiatry", "psych", "behavioral", "behavioral science", "mental health"] },
  { slug: "nervous", name: "Nervous & Special Senses", aliases: ["nervous system", "nervous system & special senses", "neurology", "neuro", "neuroscience", "ophthalmology", "ent", "special senses"] },
  { slug: "skin", name: "Dermatology", aliases: ["skin & subcutaneous tissue", "dermatology", "derm", "skin and subcutaneous tissue"] },
  { slug: "musculoskeletal", name: "Musculoskeletal", aliases: ["musculoskeletal system", "msk", "rheumatology", "orthopedics", "orthopaedics"] },
  { slug: "cardiovascular", name: "Cardiovascular", aliases: ["cardiovascular system", "cardiology", "cardio", "cvs", "heart"] },
  { slug: "respiratory", name: "Respiratory", aliases: ["respiratory system", "pulmonary", "pulmonology", "pulm", "lung"] },
  { slug: "gastrointestinal", name: "Gastrointestinal", aliases: ["gastrointestinal system", "gi", "gastroenterology", "hepatology", "digestive"] },
  { slug: "renal", name: "Renal & Urinary", aliases: ["renal & urinary system", "renal", "nephrology", "urinary", "kidney", "urology"] },
  { slug: "pregnancy", name: "Pregnancy & Childbirth", aliases: ["pregnancy, childbirth, & the puerperium", "obstetrics", "ob", "pregnancy", "childbirth", "neonatology"] },
  { slug: "female-reproductive", name: "Female Reproductive & Breast", aliases: ["female and transgender reproductive system & breast", "female reproductive", "gynecology", "gyn", "breast", "reproductive"] },
  { slug: "male-reproductive", name: "Male Reproductive", aliases: ["male and transgender reproductive system", "male reproductive", "andrology"] },
  { slug: "endocrine", name: "Endocrine", aliases: ["endocrine system", "endocrinology", "endo", "diabetes"] },
  { slug: "multisystem", name: "Multisystem", aliases: ["multisystem processes & disorders", "multisystem processes and disorders", "toxicology", "infectious disease", "infectious diseases", "nutrition"] },
  { slug: "biostatistics", name: "Biostatistics & Epidemiology", aliases: ["biostatistics", "biostats", "epidemiology", "biostatistics & epidemiology", "statistics", "population health"] },
  { slug: "social-sciences", name: "Social Sciences & Ethics", aliases: ["social sciences", "ethics", "communication", "patient safety", "medical ethics", "professionalism", "health policy"] },
] as const;

export const DISCIPLINES = [
  { slug: "pathology", name: "Pathology", kind: "foundational", aliases: ["path", "pathophysiology"] },
  { slug: "physiology", name: "Physiology", kind: "foundational", aliases: ["physio"] },
  { slug: "pharmacology", name: "Pharmacology", kind: "foundational", aliases: ["pharm", "pharmacotherapy"] },
  { slug: "biochemistry", name: "Biochemistry & Nutrition", kind: "foundational", aliases: ["biochem", "biochemistry", "nutrition", "molecular biology"] },
  { slug: "microbiology", name: "Microbiology", kind: "foundational", aliases: ["micro", "infectious disease"] },
  { slug: "immunology", name: "Immunology", kind: "foundational", aliases: ["immuno"] },
  { slug: "anatomy", name: "Gross Anatomy & Embryology", kind: "foundational", aliases: ["anatomy", "gross anatomy", "embryology", "neuroanatomy"] },
  { slug: "histology", name: "Histology & Cell Biology", kind: "foundational", aliases: ["histo", "cell biology", "histology"] },
  { slug: "behavioral-science", name: "Behavioral Sciences", kind: "foundational", aliases: ["behavioral", "behavioral science", "behavioural science"] },
  { slug: "genetics", name: "Genetics", kind: "foundational", aliases: ["genetic"] },
  { slug: "biostatistics-epi", name: "Biostatistics & Epidemiology", kind: "foundational", aliases: ["biostatistics", "biostats", "epidemiology", "statistics"] },
  { slug: "medicine", name: "Internal Medicine", kind: "clinical", aliases: ["internal medicine", "medicine", "im"] },
  { slug: "surgery", name: "Surgery", kind: "clinical", aliases: ["general surgery"] },
  { slug: "pediatrics", name: "Pediatrics", kind: "clinical", aliases: ["peds", "paediatrics"] },
  { slug: "obgyn", name: "Obstetrics & Gynecology", kind: "clinical", aliases: ["ob/gyn", "obgyn", "obstetrics and gynecology", "obstetrics", "gynecology"] },
  { slug: "psychiatry", name: "Psychiatry", kind: "clinical", aliases: ["psych"] },
  { slug: "neurology", name: "Neurology", kind: "clinical", aliases: ["neuro"] },
  { slug: "family-medicine", name: "Family Medicine & Preventive Care", kind: "clinical", aliases: ["family medicine", "preventive medicine", "primary care"] },
  { slug: "emergency-medicine", name: "Emergency Medicine", kind: "clinical", aliases: ["em", "emergency"] },
  { slug: "ethics", name: "Ethics & Communication", kind: "clinical", aliases: ["ethics", "communication", "professionalism"] },
] as const;

export const COMPETENCIES = [
  { slug: "foundational-science", name: "Applying foundational science concepts", group: "Medical knowledge", aliases: ["foundational", "basic science", "medical knowledge"] },
  { slug: "dx-mechanism", name: "Causes & mechanisms", group: "Diagnosis", aliases: ["mechanism", "mechanisms", "pathophysiology", "causes", "etiology", "pathogenesis"] },
  { slug: "dx-history-physical", name: "History & physical examination", group: "Diagnosis", aliases: ["history", "physical exam", "physical examination", "history and physical"] },
  { slug: "dx-studies", name: "Laboratory & diagnostic studies", group: "Diagnosis", aliases: ["diagnostic studies", "labs", "laboratory", "investigations", "next step in diagnosis", "imaging"] },
  { slug: "dx-diagnosis", name: "Formulating the diagnosis", group: "Diagnosis", aliases: ["diagnosis", "most likely diagnosis"] },
  { slug: "dx-prognosis", name: "Prognosis & outcome", group: "Diagnosis", aliases: ["prognosis", "complication", "complications", "outcome"] },
  { slug: "mgmt-prevention", name: "Health maintenance & prevention", group: "Management", aliases: ["prevention", "screening", "health maintenance", "vaccination"] },
  { slug: "mgmt-pharmacotherapy", name: "Pharmacotherapy", group: "Management", aliases: ["pharmacotherapy", "treatment", "drug therapy", "medication"] },
  { slug: "mgmt-interventions", name: "Clinical interventions", group: "Management", aliases: ["intervention", "interventions", "procedure", "surgery"] },
  { slug: "mgmt-mixed", name: "Mixed management", group: "Management", aliases: ["management", "next step in management", "next best step"] },
  { slug: "mgmt-surveillance", name: "Surveillance & recurrence", group: "Management", aliases: ["surveillance", "follow-up", "monitoring"] },
  { slug: "communication", name: "Communication & interpersonal skills", group: "Professional", aliases: ["communication skills", "interpersonal"] },
  { slug: "professionalism", name: "Professionalism, legal & ethical issues", group: "Professional", aliases: ["ethics", "legal", "professionalism"] },
  { slug: "systems-safety", name: "Systems-based practice & patient safety", group: "Professional", aliases: ["patient safety", "quality improvement", "systems-based practice"] },
  { slug: "evidence-based", name: "Evidence-based medicine & study interpretation", group: "Professional", aliases: ["biostatistics", "evidence-based medicine", "ebm", "study interpretation"] },
] as const;

export type SystemSlug = (typeof SYSTEMS)[number]["slug"];
export type DisciplineSlug = (typeof DISCIPLINES)[number]["slug"];
export type CompetencySlug = (typeof COMPETENCIES)[number]["slug"];

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9/]+/g, " ")
    .trim();

function resolver<T extends { slug: string; name: string; aliases: readonly string[] }>(items: readonly T[]) {
  const map = new Map<string, string>();
  for (const it of items) {
    map.set(norm(it.slug.replace(/-/g, " ")), it.slug);
    map.set(norm(it.slug), it.slug);
    map.set(norm(it.name), it.slug);
    for (const a of it.aliases) if (!map.has(norm(a))) map.set(norm(a), it.slug);
  }
  return (value: string | undefined | null): T["slug"] | undefined => {
    if (!value) return undefined;
    const key = norm(value);
    if (map.has(key)) return map.get(key) as T["slug"];
    // Prefix match ("Cardiovascular system disorders" -> cardiovascular)
    for (const [k, v] of map) if (k.length > 3 && (key.startsWith(k + " ") || key === k)) return v as T["slug"];
    return undefined;
  };
}

export const resolveSystem = resolver(SYSTEMS);
export const resolveDiscipline = resolver(DISCIPLINES);
export const resolveCompetency = resolver(COMPETENCIES);

export function resolveExam(value: string | undefined | null): ExamKey | undefined {
  if (!value) return undefined;
  const v = norm(value).replace(/usmle/g, "").replace(/\s+/g, "");
  if (/^(step)?1$/.test(v) || v === "s1") return "step1";
  if (/^(step)?2(ck)?$/.test(v) || v === "2ck" || v === "s2") return "step2ck";
  if (/^(step)?3$/.test(v) || v === "s3") return "step3";
  return undefined;
}

export function systemName(slug: string) {
  return SYSTEMS.find((s) => s.slug === slug)?.name ?? slug;
}
export function disciplineName(slug: string) {
  return DISCIPLINES.find((d) => d.slug === slug)?.name ?? slug;
}

// Keyword fallback used only when an import omits the System field.
const SYSTEM_KEYWORDS: Record<SystemSlug, string[]> = {
  "general-principles": ["enzyme", "dna", "rna", "mitochondri", "lysosom", "pharmacokinetic", "half-life", "inheritance", "karyotype"],
  "human-development": ["developmental milestone", "well-child", "growth chart"],
  immune: ["immunodeficiency", "complement", "hypersensitivity", "transplant", "hiv"],
  "blood-lymph": ["anemia", "platelet", "leukemia", "lymphoma", "coagul", "hemoglobin", "thrombocyt"],
  "behavioral-health": ["depress", "schizophren", "bipolar", "anxiety", "psychosis", "suicid", "substance"],
  nervous: ["seizure", "stroke", "neuropath", "weakness", "reflex", "cranial nerve", "dementia", "headache"],
  skin: ["rash", "lesion", "blister", "pruritic", "melanoma", "dermat"],
  musculoskeletal: ["fracture", "joint", "arthritis", "bone", "tendon", "muscle"],
  cardiovascular: ["murmur", "myocardial", "chest pain", "ecg", "arrhythm", "heart failure", "hypertension"],
  respiratory: ["dyspnea", "cough", "pulmonary", "pneumonia", "asthma", "copd", "lung"],
  gastrointestinal: ["diarrhea", "abdominal pain", "liver", "jaundice", "bowel", "esophag", "pancrea"],
  renal: ["creatinine", "proteinuria", "hematuria", "kidney", "nephr", "urine"],
  pregnancy: ["gestation", "pregnan", "postpartum", "fetal", "newborn", "labor"],
  "female-reproductive": ["menstrua", "ovar", "uter", "breast", "cervi", "vagin"],
  "male-reproductive": ["testi", "prostat", "scrot", "erectile", "penile"],
  endocrine: ["thyroid", "insulin", "diabetes", "adrenal", "cortisol", "pituitar", "calcium"],
  multisystem: ["sepsis", "toxicity", "overdose", "poisoning", "electrolyte", "vitamin"],
  biostatistics: ["sensitivity", "specificity", "study", "bias", "confidence interval", "incidence", "prevalence"],
  "social-sciences": ["consent", "capacity", "confidential", "ethic", "disclose", "malpractice"],
};

export function guessSystem(text: string): SystemSlug | undefined {
  const t = text.toLowerCase();
  let best: SystemSlug | undefined;
  let bestScore = 0;
  for (const [slug, words] of Object.entries(SYSTEM_KEYWORDS) as [SystemSlug, string[]][]) {
    const score = words.reduce((n, w) => n + (t.includes(w) ? 1 : 0), 0);
    if (score > bestScore) {
      best = slug;
      bestScore = score;
    }
  }
  return bestScore >= 2 ? best : undefined;
}
