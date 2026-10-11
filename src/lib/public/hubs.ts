import { EXAMS, type ExamKey } from "@/lib/exams";
import type { HubFilter } from "./content";

// Subject practice pages. Each groups real bank questions by organ system (or clinical
// discipline) and lists the topics the bank actually covers. Only launch a hub when its
// classification is clean and the bank has enough questions to be useful: Step 2 CK pediatrics is
// left out until its discipline tags are reliable. Official shares are from the USMLE content
// outlines (see lib/exams.ts).

export type Hub = {
  key: string;
  path: string;
  exam: ExamKey;
  filter: HubFilter;
  /** Short subject name: "Cardiology". */
  label: string;
  /** Link text in navigation and the footer: "Step 1 cardiology". */
  nav: string;
  /** The subject mid-sentence: "cardiology", "OB/GYN". */
  subject: string;
  title: string;
  h1: string;
  description: string;
  /** The official content outline line and its share of the exam. */
  outline: { line: string; share: string };
  /** One sentence after the share, with {n} for the live question count. */
  lead: string;
  /** What this exam tends to ask on the subject: general guidance, not a claim about the bank. */
  asks: string[];
};

export const HUBS: Hub[] = [
  {
    key: "step1-cardiology",
    path: "/usmle-step-1-cardiology-questions",
    exam: "step1",
    filter: { exam: "step1", systems: ["cardiovascular"] },
    label: "Cardiology",
    nav: "Step 1 cardiology",
    subject: "cardiology",
    title: "USMLE Step 1 Cardiology Questions",
    h1: "USMLE Step 1 cardiology questions",
    description:
      "USMLE Step 1 cardiology questions with every answer explained: heart failure, cardiomyopathies, valve and aortic disease, cardiac drugs. Free samples.",
    outline: { line: "Cardiovascular System", share: "7–11%" },
    lead: "Argonaut has {n} Step 1 cardiovascular questions, each a full clinical vignette mapped to the official content outline.",
    asks: [
      "Physiology you can apply: the cardiac cycle, pressure–volume loops, and how preload, afterload and contractility shift them.",
      "Valve lesions and their murmurs, and what bedside maneuvers do to them.",
      "Ischemic heart disease, and the complications of myocardial infarction by timeline.",
      "Cardiomyopathies, pericardial disease and heart failure, with the drugs that change outcomes.",
      "Congenital heart disease, aortic disease and vasculitis.",
      "Pharmacology: antihypertensive, antianginal, lipid-lowering and antiarrhythmic drugs and their adverse effects.",
    ],
  },
  {
    key: "step1-neurology",
    path: "/usmle-step-1-neurology-questions",
    exam: "step1",
    filter: { exam: "step1", systems: ["nervous"] },
    label: "Neurology",
    nav: "Step 1 neurology",
    subject: "neurology",
    title: "USMLE Step 1 Neurology Questions",
    h1: "USMLE Step 1 neurology questions",
    description:
      "USMLE Step 1 neurology questions with every answer explained: stroke, seizures, brain tumors, neuromuscular disease, eye and ear. Free samples.",
    outline: { line: "Behavioral Health & Nervous Systems/Special Senses", share: "10–14%" },
    lead: "Argonaut has {n} Step 1 nervous system and special senses questions, written as full clinical vignettes.",
    asks: [
      "Localizing a lesion from the examination: spinal cord syndromes, brainstem strokes and cranial nerves.",
      "Stroke and intracranial hemorrhage, by vessel and by imaging.",
      "Seizures, headache and movement disorders, with the drugs that treat them.",
      "Demyelinating disease, neuromuscular junction disorders and hereditary neuropathies.",
      "Brain tumors and neurocutaneous syndromes.",
      "The eye and ear: glaucoma, visual field defects, hearing loss and vertigo.",
    ],
  },
  {
    key: "step1-gastrointestinal",
    path: "/usmle-step-1-gastrointestinal-questions",
    exam: "step1",
    filter: { exam: "step1", systems: ["gastrointestinal"] },
    label: "Gastrointestinal",
    nav: "Step 1 GI",
    subject: "gastrointestinal",
    title: "USMLE Step 1 Gastrointestinal Questions",
    h1: "USMLE Step 1 gastrointestinal questions",
    description:
      "USMLE Step 1 GI questions with every answer explained: esophagus, gastritis, pancreatitis, liver disease, polyposis and GI cancers. Free samples.",
    outline: { line: "Gastrointestinal System", share: "6–10%" },
    lead: "Argonaut has {n} Step 1 gastrointestinal questions, each with every answer choice explained.",
    asks: [
      "Esophageal and gastric disease, from reflux and motility disorders to gastritis and cancer.",
      "The liver: hepatitis, cirrhosis, portal hypertension and drug-induced injury.",
      "The pancreas and biliary tree: pancreatitis, gallstones and cancer.",
      "Malabsorption, inflammatory bowel disease and diarrheal infections.",
      "Polyposis syndromes and colorectal cancer.",
      "GI embryology and congenital anomalies.",
    ],
  },
  {
    key: "step1-renal",
    path: "/usmle-step-1-renal-questions",
    exam: "step1",
    filter: { exam: "step1", systems: ["renal"] },
    label: "Renal",
    nav: "Step 1 renal",
    subject: "renal",
    title: "USMLE Step 1 Renal Questions",
    h1: "USMLE Step 1 renal questions",
    description:
      "USMLE Step 1 renal questions with every answer explained: nephritic and nephrotic syndromes, tubular disorders, anomalies and UTIs. Free samples.",
    outline: { line: "Respiratory & Renal/Urinary Systems", share: "11–15%" },
    lead: "That share covers respiratory and renal questions together. Argonaut has {n} Step 1 renal and urinary questions.",
    asks: [
      "Nephron physiology: what each segment reabsorbs, and where each diuretic acts.",
      "Acid-base disorders, including the renal tubular acidoses, worked from the numbers.",
      "Glomerular disease: telling nephritic from nephrotic syndrome, and the biopsy findings for each.",
      "Water and electrolyte disorders, including diabetes insipidus.",
      "Congenital anomalies, cystic disease, stones, obstruction and urinary tract infection.",
      "Renal and bladder tumors.",
    ],
  },
  {
    key: "step1-biostatistics",
    path: "/usmle-step-1-biostatistics-questions",
    exam: "step1",
    filter: { exam: "step1", systems: ["biostatistics"] },
    label: "Biostatistics",
    nav: "Step 1 biostatistics",
    subject: "biostatistics",
    title: "USMLE Step 1 Biostatistics Questions",
    h1: "USMLE Step 1 biostatistics questions",
    description:
      "USMLE Step 1 biostatistics questions with worked explanations: study design, sensitivity and specificity, bias and measures of risk. Free samples.",
    outline: { line: "Biostatistics & Epidemiology/Population Health", share: "4–6%" },
    lead: "These are some of the most learnable points on the exam. Argonaut has {n} Step 1 biostatistics and epidemiology questions.",
    asks: [
      "Test characteristics: sensitivity, specificity, predictive values and likelihood ratios, often from a 2×2 table you build yourself.",
      "Study designs, and what each one can and can't show.",
      "Bias and confounding: naming the type from a short description.",
      "Measures of risk: relative risk, odds ratio, attributable risk, number needed to treat and to harm.",
      "Hypothesis testing: p-values, confidence intervals, power and error types.",
      "Reading a study abstract or figure and drawing the right conclusion.",
    ],
  },
  {
    key: "step2ck-internal-medicine",
    path: "/usmle-step-2-ck-internal-medicine-questions",
    exam: "step2ck",
    filter: {
      exam: "step2ck",
      systems: ["cardiovascular", "respiratory", "gastrointestinal", "renal", "endocrine", "blood-lymph", "immune", "multisystem"],
    },
    label: "Internal medicine",
    nav: "Step 2 CK internal medicine",
    subject: "internal medicine",
    title: "USMLE Step 2 CK Internal Medicine Questions",
    h1: "USMLE Step 2 CK internal medicine questions",
    description:
      "Step 2 CK internal medicine questions on the next step in diagnosis and management, across cardiology, pulmonology, GI, renal and more. Free samples.",
    outline: { line: "Medicine (clinical science)", share: "55–65%" },
    lead: "Medicine is the largest clinical science on Step 2 CK. Argonaut groups {n} Step 2 CK questions from the core internal medicine systems here.",
    asks: [
      "The next best step: which test to order, and in what order.",
      "Management: first-line treatment, when to escalate, and when to stop.",
      "Pharmacotherapy choices and the adverse effects that change them.",
      "Reading labs, ECG findings and imaging descriptions in context.",
      "Prevention: screening, vaccination and risk-factor control.",
      "Prognosis, and the complications you need to anticipate.",
    ],
  },
  {
    key: "step2ck-obgyn",
    path: "/usmle-step-2-ck-obgyn-questions",
    exam: "step2ck",
    filter: { exam: "step2ck", systems: ["pregnancy", "female-reproductive"], disciplines: ["obgyn"] },
    label: "OB/GYN",
    nav: "Step 2 CK OB/GYN",
    subject: "OB/GYN",
    title: "USMLE Step 2 CK OB/GYN Questions",
    h1: "USMLE Step 2 CK OB/GYN questions",
    description:
      "Step 2 CK OB/GYN questions with every answer explained: prenatal care, pregnancy complications, labor, postpartum and gynecologic cancers. Free samples.",
    outline: { line: "Obstetrics & Gynecology (clinical science)", share: "10–20%" },
    lead: "Argonaut has {n} Step 2 CK obstetrics, gynecology and breast questions.",
    asks: [
      "Prenatal care: what to screen for, and when in pregnancy.",
      "Complications of pregnancy: hypertensive disorders, diabetes, bleeding and preterm labor.",
      "Labor and delivery decisions, and postpartum problems such as hemorrhage and mastitis.",
      "Contraception, menopause and abnormal uterine bleeding.",
      "Cervical and breast cancer screening, and gynecologic and breast cancers.",
      "The infertility workup.",
    ],
  },
  {
    key: "step2ck-psychiatry",
    path: "/usmle-step-2-ck-psychiatry-questions",
    exam: "step2ck",
    filter: { exam: "step2ck", systems: ["behavioral-health"] },
    label: "Psychiatry",
    nav: "Step 2 CK psychiatry",
    subject: "psychiatry",
    title: "USMLE Step 2 CK Psychiatry Questions",
    h1: "USMLE Step 2 CK psychiatry questions",
    description:
      "Step 2 CK psychiatry questions with every answer explained: mood, anxiety, somatic and personality disorders, substance use, drugs. Free samples.",
    outline: { line: "Psychiatry (clinical science)", share: "10–15%" },
    lead: "Argonaut has {n} Step 2 CK behavioral health questions.",
    asks: [
      "Diagnosis from the history: mood, anxiety, psychotic, somatic symptom and personality disorders.",
      "First-line treatment, and what to do when it fails.",
      "Adverse effects of psychiatric drugs, including emergencies such as neuroleptic malignant syndrome.",
      "Substance use, intoxication and withdrawal.",
      "Safety: suicide risk, decision-making capacity and involuntary treatment.",
      "Psychiatry in pregnancy and after delivery.",
    ],
  },
];

export function hubByKey(key: string) {
  const hub = HUBS.find((h) => h.key === key);
  if (!hub) throw new Error(`Unknown hub ${key}`);
  return hub;
}

export function hubsFor(exam: ExamKey) {
  return HUBS.filter((h) => h.exam === exam);
}

export function hubExamName(hub: Hub) {
  return EXAMS[hub.exam].name;
}
