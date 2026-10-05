-- Medical schools for onboarding ("Which school are you at?").
-- Seeded from open data (Wikidata, CC0, plus medical entries from the Hipo university list, MIT) by
-- scripts/seed-schools.ts, which also imports the official WDOMS School.csv export when available.

create table public.medical_schools (
  id integer primary key generated always as identity,
  name text not null check (char_length(name) between 2 and 200),
  country text check (country is null or country ~ '^[A-Z]{2}$'),
  city text,
  source text not null check (source in ('wikidata', 'hipo', 'wdoms', 'admin')),
  external_id text,
  created_at timestamptz not null default now()
);
create unique index medical_schools_name_country_key on public.medical_schools (lower(name), coalesce(country, ''));
create unique index medical_schools_external_key on public.medical_schools (source, external_id) where external_id is not null;
create index medical_schools_name_trgm on public.medical_schools using gin (lower(name) extensions.gin_trgm_ops);

alter table public.medical_schools enable row level security;
create policy "medical schools readable" on public.medical_schools for select to anon, authenticated using (true);
create policy "medical schools admin write" on public.medical_schools for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- A profile points at a listed school, or keeps the name the student typed when theirs isn't listed.
alter table public.profiles
  add column school_id integer references public.medical_schools (id) on delete set null,
  add column school_name text check (school_name is null or char_length(school_name) between 2 and 200);
create index profiles_school_idx on public.profiles (school_id) where school_id is not null;

-- Typeahead: every word typed must appear in the name (accents ignored), best matches first.
-- Falls back to fuzzy matching so small typos ("univeristy") still find the school.
create or replace function public.search_medical_schools(p_q text, p_limit integer default 12)
returns table (id integer, name text, country text, city text)
language sql
stable
set search_path = ''
as $$
  with q as (
    select lower(extensions.unaccent('extensions.unaccent'::regdictionary, trim(coalesce(p_q, '')))) as t
  ),
  words as (
    select w from q, unnest(regexp_split_to_array(q.t, '[^[:alnum:]]+')) as w where w <> ''
  ),
  scored as (
    select
      s.id, s.name, s.country, s.city,
      lower(extensions.unaccent('extensions.unaccent'::regdictionary, s.name)) as n,
      extensions.word_similarity(q.t, lower(extensions.unaccent('extensions.unaccent'::regdictionary, s.name))) as sim
    from public.medical_schools s, q
    where char_length(q.t) >= 2
  )
  select sc.id, sc.name, sc.country, sc.city
  from scored sc, q
  where not exists (select 1 from words where position(words.w in sc.n) = 0)
     or sc.sim >= 0.5
  order by
    (sc.n like q.t || '%') desc,
    (not exists (select 1 from words where position(words.w in sc.n) = 0)) desc,
    sc.sim desc,
    char_length(sc.name),
    sc.name
  limit least(greatest(coalesce(p_limit, 12), 1), 30);
$$;

revoke execute on function public.search_medical_schools(text, integer) from public;
grant execute on function public.search_medical_schools(text, integer) to anon, authenticated, service_role;
