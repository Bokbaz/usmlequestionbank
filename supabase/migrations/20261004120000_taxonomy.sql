-- Argonaut USMLE: extensions, enums and the exam taxonomy.
-- Taxonomy mirrors the USMLE Content Outline (2026) systems/categories, the Step 1
-- discipline blueprint, and the NBME physician task competencies.

create extension if not exists vector with schema extensions;
create extension if not exists pg_trgm with schema extensions;
create extension if not exists unaccent with schema extensions;
create extension if not exists citext with schema extensions;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create type public.exam_type as enum ('step1', 'step2ck', 'step3');
create type public.question_status as enum ('draft', 'published', 'retired');
create type public.test_mode as enum ('tutor', 'timed', 'untimed');
create type public.test_kind as enum ('custom', 'argo', 'daily', 'review');
create type public.test_status as enum ('active', 'suspended', 'completed');
create type public.plan_tier as enum ('free', 'core', 'argo');
create type public.user_role as enum ('user', 'admin');

-- Systems ------------------------------------------------------------------
create table public.systems (
  id smallint primary key generated always as identity,
  slug text not null unique,
  name text not null,
  short_name text not null,
  sort smallint not null default 0,
  step1_weight numeric not null default 0,
  step2_weight numeric not null default 0
);

insert into public.systems (slug, name, short_name, sort, step1_weight, step2_weight) values
  ('general-principles', 'General Principles of Foundational Science', 'General Principles', 1, 14, 2),
  ('human-development', 'Human Development', 'Human Development', 2, 2, 3),
  ('immune', 'Immune System', 'Immune', 3, 4, 4),
  ('blood-lymph', 'Blood & Lymphoreticular System', 'Hematology', 4, 5, 6),
  ('behavioral-health', 'Behavioral Health', 'Behavioral Health', 5, 5, 8),
  ('nervous', 'Nervous System & Special Senses', 'Nervous & Special Senses', 6, 7, 8),
  ('skin', 'Skin & Subcutaneous Tissue', 'Dermatology', 7, 3, 5),
  ('musculoskeletal', 'Musculoskeletal System', 'Musculoskeletal', 8, 5, 7),
  ('cardiovascular', 'Cardiovascular System', 'Cardiovascular', 9, 9, 8),
  ('respiratory', 'Respiratory System', 'Respiratory', 10, 6.5, 8),
  ('gastrointestinal', 'Gastrointestinal System', 'Gastrointestinal', 11, 8, 8),
  ('renal', 'Renal & Urinary System', 'Renal & Urinary', 12, 6.5, 5),
  ('pregnancy', 'Pregnancy, Childbirth, & the Puerperium', 'Pregnancy & Childbirth', 13, 4, 8),
  ('female-reproductive', 'Female and Transgender Reproductive System & Breast', 'Female Reproductive & Breast', 14, 5, 6),
  ('male-reproductive', 'Male and Transgender Reproductive System', 'Male Reproductive', 15, 2, 2),
  ('endocrine', 'Endocrine System', 'Endocrine', 16, 7, 7),
  ('multisystem', 'Multisystem Processes & Disorders', 'Multisystem', 17, 10, 6),
  ('biostatistics', 'Biostatistics, Epidemiology/Population Health, & Interpretation of the Medical Literature', 'Biostatistics & Epidemiology', 18, 5, 4),
  ('social-sciences', 'Social Sciences: Communication, Ethics & Patient Safety', 'Social Sciences & Ethics', 19, 7, 11);

-- Disciplines ----------------------------------------------------------------
create table public.disciplines (
  id smallint primary key generated always as identity,
  slug text not null unique,
  name text not null,
  kind text not null check (kind in ('foundational', 'clinical')),
  sort smallint not null default 0,
  step1_weight numeric not null default 0
);

insert into public.disciplines (slug, name, kind, sort, step1_weight) values
  ('pathology', 'Pathology', 'foundational', 1, 48),
  ('physiology', 'Physiology', 'foundational', 2, 30),
  ('pharmacology', 'Pharmacology', 'foundational', 3, 18),
  ('biochemistry', 'Biochemistry & Nutrition', 'foundational', 4, 19),
  ('microbiology', 'Microbiology', 'foundational', 5, 12),
  ('immunology', 'Immunology', 'foundational', 6, 8),
  ('anatomy', 'Gross Anatomy & Embryology', 'foundational', 7, 13),
  ('histology', 'Histology & Cell Biology', 'foundational', 8, 10),
  ('behavioral-science', 'Behavioral Sciences', 'foundational', 9, 10),
  ('genetics', 'Genetics', 'foundational', 10, 7),
  ('biostatistics-epi', 'Biostatistics & Epidemiology', 'foundational', 11, 5),
  ('medicine', 'Internal Medicine', 'clinical', 20, 0),
  ('surgery', 'Surgery', 'clinical', 21, 0),
  ('pediatrics', 'Pediatrics', 'clinical', 22, 0),
  ('obgyn', 'Obstetrics & Gynecology', 'clinical', 23, 0),
  ('psychiatry', 'Psychiatry', 'clinical', 24, 0),
  ('neurology', 'Neurology', 'clinical', 25, 0),
  ('family-medicine', 'Family Medicine & Preventive Care', 'clinical', 26, 0),
  ('emergency-medicine', 'Emergency Medicine', 'clinical', 27, 0),
  ('ethics', 'Ethics & Communication', 'clinical', 28, 0);

-- Physician task competencies (NBME item-writing guide) ----------------------
create table public.competencies (
  id smallint primary key generated always as identity,
  slug text not null unique,
  name text not null,
  group_name text not null,
  sort smallint not null default 0
);

insert into public.competencies (slug, name, group_name, sort) values
  ('foundational-science', 'Applying foundational science concepts', 'Medical knowledge', 1),
  ('dx-mechanism', 'Causes & mechanisms', 'Diagnosis', 2),
  ('dx-history-physical', 'History & physical examination', 'Diagnosis', 3),
  ('dx-studies', 'Laboratory & diagnostic studies', 'Diagnosis', 4),
  ('dx-diagnosis', 'Formulating the diagnosis', 'Diagnosis', 5),
  ('dx-prognosis', 'Prognosis & outcome', 'Diagnosis', 6),
  ('mgmt-prevention', 'Health maintenance & prevention', 'Management', 7),
  ('mgmt-pharmacotherapy', 'Pharmacotherapy', 'Management', 8),
  ('mgmt-interventions', 'Clinical interventions', 'Management', 9),
  ('mgmt-mixed', 'Mixed management', 'Management', 10),
  ('mgmt-surveillance', 'Surveillance & recurrence', 'Management', 11),
  ('communication', 'Communication & interpersonal skills', 'Professional', 12),
  ('professionalism', 'Professionalism, legal & ethical issues', 'Professional', 13),
  ('systems-safety', 'Systems-based practice & patient safety', 'Professional', 14),
  ('evidence-based', 'Evidence-based medicine & study interpretation', 'Professional', 15);

-- Outline categories (second level of the content outline) ---------------------
create table public.categories (
  id integer primary key generated always as identity,
  system_id smallint not null references public.systems (id) on delete cascade,
  slug text not null,
  name text not null,
  sort smallint not null default 0,
  unique (system_id, slug)
);

with c(system_slug, name, sort) as (values
  ('general-principles', 'Biochemistry & molecular biology', 1),
  ('general-principles', 'Genetics', 2),
  ('general-principles', 'Cell biology & histology', 3),
  ('general-principles', 'Pharmacokinetics & pharmacodynamics', 4),
  ('general-principles', 'Microbiology principles', 5),
  ('general-principles', 'Immunology principles', 6),
  ('general-principles', 'Cell injury, inflammation & neoplasia', 7),
  ('general-principles', 'Nutrition & metabolism', 8),
  ('human-development', 'Normal age-related findings & care of the well patient', 1),
  ('immune', 'Immunodeficiency disorders', 1),
  ('immune', 'HIV/AIDS', 2),
  ('immune', 'Immunologically mediated disorders', 3),
  ('immune', 'Adverse effects of drugs on the immune system', 4),
  ('blood-lymph', 'Infectious & immunologic disorders', 1),
  ('blood-lymph', 'Neoplasms', 2),
  ('blood-lymph', 'Anemia, cytopenias & polycythemia', 3),
  ('blood-lymph', 'Coagulation disorders', 4),
  ('blood-lymph', 'Reactions to blood components', 5),
  ('blood-lymph', 'Traumatic, mechanical & vascular disorders', 6),
  ('blood-lymph', 'Adverse effects of drugs on blood', 7),
  ('behavioral-health', 'Psychotic disorders', 1),
  ('behavioral-health', 'Anxiety disorders', 2),
  ('behavioral-health', 'Mood disorders', 3),
  ('behavioral-health', 'Somatic symptom & factitious disorders', 4),
  ('behavioral-health', 'Eating & impulse-control disorders', 5),
  ('behavioral-health', 'Disorders originating in childhood', 6),
  ('behavioral-health', 'Personality disorders', 7),
  ('behavioral-health', 'Psychosocial disorders & behaviors', 8),
  ('behavioral-health', 'Substance use disorders', 9),
  ('nervous', 'Infectious, immunologic & inflammatory disorders', 1),
  ('nervous', 'Neoplasms', 2),
  ('nervous', 'Cerebrovascular disease', 3),
  ('nervous', 'Spine, spinal cord & nerve roots', 4),
  ('nervous', 'Cranial & peripheral nerve disorders', 5),
  ('nervous', 'Degenerative disorders & dementia', 6),
  ('nervous', 'Neuromuscular disorders', 7),
  ('nervous', 'Movement disorders', 8),
  ('nervous', 'Paroxysmal disorders (headache, seizure)', 9),
  ('nervous', 'Sleep disorders', 10),
  ('nervous', 'Trauma & increased intracranial pressure', 11),
  ('nervous', 'Congenital disorders', 12),
  ('nervous', 'Adverse effects of drugs on the nervous system', 13),
  ('nervous', 'Eye & eyelid', 14),
  ('nervous', 'Ear', 15),
  ('skin', 'Infectious, immunologic & inflammatory disorders', 1),
  ('skin', 'Neoplasms', 2),
  ('skin', 'Hair, nail & gland disorders', 3),
  ('skin', 'Pigmentation, trauma & congenital disorders', 4),
  ('skin', 'Adverse effects of drugs on skin', 5),
  ('musculoskeletal', 'Infectious, inflammatory & immunologic disorders', 1),
  ('musculoskeletal', 'Neoplasms', 2),
  ('musculoskeletal', 'Degenerative & metabolic disorders', 3),
  ('musculoskeletal', 'Traumatic & mechanical disorders', 4),
  ('musculoskeletal', 'Congenital disorders', 5),
  ('musculoskeletal', 'Adverse effects of drugs on muscle & bone', 6),
  ('cardiovascular', 'Infectious & inflammatory disorders', 1),
  ('cardiovascular', 'Dysrhythmias', 2),
  ('cardiovascular', 'Heart failure', 3),
  ('cardiovascular', 'Ischemic heart disease', 4),
  ('cardiovascular', 'Diseases of the myocardium', 5),
  ('cardiovascular', 'Diseases of the pericardium', 6),
  ('cardiovascular', 'Valvular heart disease', 7),
  ('cardiovascular', 'Hypertension & hypotension', 8),
  ('cardiovascular', 'Dyslipidemia', 9),
  ('cardiovascular', 'Vascular disorders', 10),
  ('cardiovascular', 'Congenital disorders', 11),
  ('cardiovascular', 'Adverse effects of drugs on the heart', 12),
  ('respiratory', 'Infectious & inflammatory disorders', 1),
  ('respiratory', 'Neoplasms', 2),
  ('respiratory', 'Obstructive airway disease', 3),
  ('respiratory', 'Interstitial & restrictive lung disease', 4),
  ('respiratory', 'Respiratory failure & pulmonary vascular disorders', 5),
  ('respiratory', 'Gas exchange & ventilation', 6),
  ('respiratory', 'Pleura, mediastinum & chest wall', 7),
  ('respiratory', 'Congenital disorders', 8),
  ('respiratory', 'Adverse effects of drugs on the lung', 9),
  ('gastrointestinal', 'Infectious & inflammatory disorders', 1),
  ('gastrointestinal', 'Neoplasms', 2),
  ('gastrointestinal', 'Oral cavity & esophagus', 3),
  ('gastrointestinal', 'Stomach, intestine, colon & anorectum', 4),
  ('gastrointestinal', 'Liver & biliary system', 5),
  ('gastrointestinal', 'Pancreas', 6),
  ('gastrointestinal', 'Congenital disorders', 7),
  ('gastrointestinal', 'Adverse effects of drugs on the GI tract', 8),
  ('renal', 'Infectious & inflammatory disorders', 1),
  ('renal', 'Glomerular disease', 2),
  ('renal', 'Neoplasms', 3),
  ('renal', 'Metabolic & regulatory disorders', 4),
  ('renal', 'Vascular disorders', 5),
  ('renal', 'Traumatic, obstructive & congenital disorders', 6),
  ('renal', 'Adverse effects of drugs on the kidney', 7),
  ('pregnancy', 'Prenatal care', 1),
  ('pregnancy', 'Obstetric complications', 2),
  ('pregnancy', 'Labor & delivery', 3),
  ('pregnancy', 'Puerperium', 4),
  ('pregnancy', 'Newborn', 5),
  ('pregnancy', 'Teratology & drugs in pregnancy', 6),
  ('female-reproductive', 'Breast', 1),
  ('female-reproductive', 'Infectious & inflammatory disorders', 2),
  ('female-reproductive', 'Neoplasms', 3),
  ('female-reproductive', 'Fertility, contraception & menopause', 4),
  ('female-reproductive', 'Menstrual & endocrine disorders', 5),
  ('female-reproductive', 'Structural & congenital disorders', 6),
  ('male-reproductive', 'Infectious & inflammatory disorders', 1),
  ('male-reproductive', 'Neoplasms', 2),
  ('male-reproductive', 'Sexual dysfunction & infertility', 3),
  ('male-reproductive', 'Structural & congenital disorders', 4),
  ('endocrine', 'Diabetes mellitus & endocrine pancreas', 1),
  ('endocrine', 'Thyroid disorders', 2),
  ('endocrine', 'Parathyroid & calcium disorders', 3),
  ('endocrine', 'Adrenal disorders', 4),
  ('endocrine', 'Pituitary & hypothalamic disorders', 5),
  ('endocrine', 'Multiple endocrine neoplasia', 6),
  ('endocrine', 'Congenital disorders', 7),
  ('multisystem', 'Infectious disorders', 1),
  ('multisystem', 'Autoimmune & inflammatory disorders', 2),
  ('multisystem', 'Paraneoplastic & inherited cancer syndromes', 3),
  ('multisystem', 'Nutrition', 4),
  ('multisystem', 'Toxins & environmental injury', 5),
  ('multisystem', 'Fluid, electrolyte & acid-base disorders', 6),
  ('multisystem', 'Shock & multiple trauma', 7),
  ('multisystem', 'Genetic & metabolic disorders', 8),
  ('multisystem', 'Abuse', 9),
  ('biostatistics', 'Epidemiology & population health', 1),
  ('biostatistics', 'Study design', 2),
  ('biostatistics', 'Measures of association & effect', 3),
  ('biostatistics', 'Testing & screening', 4),
  ('biostatistics', 'Study interpretation, bias & validity', 5),
  ('biostatistics', 'Research ethics', 6),
  ('social-sciences', 'Communication & interpersonal skills', 1),
  ('social-sciences', 'Medical ethics & jurisprudence', 2),
  ('social-sciences', 'Patient safety & quality improvement', 3),
  ('social-sciences', 'Health care policy & economics', 4)
)
insert into public.categories (system_id, slug, name, sort)
select s.id,
       trim(both '-' from regexp_replace(lower(c.name), '[^a-z0-9]+', '-', 'g')),
       c.name,
       c.sort
from c join public.systems s on s.slug = c.system_slug;

-- Topics: the finest level (one Library article per topic). Created on import.
create table public.topics (
  id integer primary key generated always as identity,
  system_id smallint not null references public.systems (id),
  category_id integer references public.categories (id) on delete set null,
  slug text not null unique,
  name text not null,
  created_at timestamptz not null default now()
);
create index topics_system_idx on public.topics (system_id);

alter table public.systems enable row level security;
alter table public.disciplines enable row level security;
alter table public.competencies enable row level security;
alter table public.categories enable row level security;
alter table public.topics enable row level security;

create policy "taxonomy readable" on public.systems for select to anon, authenticated using (true);
create policy "taxonomy readable" on public.disciplines for select to anon, authenticated using (true);
create policy "taxonomy readable" on public.competencies for select to anon, authenticated using (true);
create policy "taxonomy readable" on public.categories for select to anon, authenticated using (true);
create policy "taxonomy readable" on public.topics for select to anon, authenticated using (true);
