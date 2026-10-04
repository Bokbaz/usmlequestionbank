-- Argonaut USMLE: core content, user state, ARGO, daily challenge and billing tables.
-- Answer keys, explanations, peer statistics and the Nugget source index are never
-- directly readable by clients; they are served through SECURITY DEFINER RPCs.

-- Profiles --------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  username extensions.citext unique check (username ~ '^[A-Za-z0-9_.-]{3,24}$'),
  country text check (country is null or country ~ '^[A-Z]{2}$'),
  target_exam public.exam_type not null default 'step1',
  exam_date date,
  role public.user_role not null default 'user',
  plan public.plan_tier not null default 'free',
  plan_expires_at timestamptz,
  stripe_customer_id text unique,
  daily_streak integer not null default 0,
  daily_best_streak integer not null default 0,
  daily_last_win date,
  settings jsonb not null default '{}'::jsonb,
  onboarded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Emails that become admins on sign-up (populated out of band, never committed).
create table private.admin_emails (email extensions.citext primary key);

-- Questions -------------------------------------------------------------------
create sequence public.question_code_seq start 1001;

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique default ('AQ-' || nextval('public.question_code_seq')::text),
  exam public.exam_type not null default 'step1',
  status public.question_status not null default 'published',
  stem text not null,
  lead_in text not null,
  media jsonb not null default '[]'::jsonb,
  system_id smallint not null references public.systems (id),
  discipline_id smallint references public.disciplines (id),
  competency_id smallint references public.competencies (id),
  category_id integer references public.categories (id) on delete set null,
  topic_id integer references public.topics (id) on delete set null,
  author_difficulty smallint not null default 3 check (author_difficulty between 1 and 5),
  is_free boolean not null default false,
  is_daily_eligible boolean not null default false,
  is_nugget boolean not null default false,
  source text not null default 'import' check (source in ('seed', 'import', 'argo', 'admin')),
  owner_id uuid references auth.users (id) on delete cascade,
  tags text[] not null default '{}',
  import_batch_id uuid,
  embedding extensions.vector(384),
  search tsvector generated always as (
    to_tsvector('english', coalesce(stem, '') || ' ' || coalesce(lead_in, ''))
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index questions_system_idx on public.questions (system_id) where status = 'published';
create index questions_discipline_idx on public.questions (discipline_id);
create index questions_topic_idx on public.questions (topic_id);
create index questions_owner_idx on public.questions (owner_id) where owner_id is not null;
create index questions_search_idx on public.questions using gin (search);
create index questions_daily_idx on public.questions (is_daily_eligible) where is_daily_eligible;

create table public.question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions (id) on delete cascade,
  label text not null check (label ~ '^[A-J]$'),
  body text not null,
  concept text,
  unique (question_id, label)
);
create index question_options_q_idx on public.question_options (question_id);

create table public.question_keys (
  question_id uuid primary key references public.questions (id) on delete cascade,
  correct_option_id uuid not null references public.question_options (id),
  explanation text not null,
  option_explanations jsonb not null default '{}'::jsonb,
  educational_objective text,
  textbook text,
  key_concept text,
  "references" text[] not null default '{}'
);

create table public.question_stats (
  question_id uuid primary key references public.questions (id) on delete cascade,
  n_attempts integer not null default 0,
  n_correct integer not null default 0,
  option_counts jsonb not null default '{}'::jsonb,
  total_time_ms bigint not null default 0,
  difficulty_b real not null default 0,
  discrimination real,
  updated_at timestamptz not null default now()
);

-- Nuggets -----------------------------------------------------------------------
-- nugget_sources/nugget_index: private index built from licensed HY PDFs. Used only to
-- detect whether a question tests an ultra-high-yield concept. Never exposed.
create table public.nugget_sources (
  id smallint primary key generated always as identity,
  slug text not null unique,
  title text not null,
  file_name text,
  pages integer,
  imported_at timestamptz not null default now()
);

create table public.nugget_index (
  id integer primary key generated always as identity,
  source_id smallint not null references public.nugget_sources (id) on delete cascade,
  page integer,
  section text,
  body text not null,
  trigger_text text,
  answer_text text,
  system_id smallint references public.systems (id),
  embedding extensions.vector(384),
  fts tsvector generated always as (to_tsvector('english', body)) stored
);
create index nugget_index_fts_idx on public.nugget_index using gin (fts);
create index nugget_index_embedding_idx on public.nugget_index
  using hnsw (embedding extensions.vector_ip_ops);

-- Public Nugget cards: our own wording of a high-yield concept that questions test.
create table public.nuggets (
  id integer primary key generated always as identity,
  slug text not null unique,
  title text not null,
  body text,
  system_id smallint references public.systems (id),
  index_ids integer[] not null default '{}',
  created_by text not null default 'seed' check (created_by in ('seed', 'auto', 'ai', 'admin')),
  created_at timestamptz not null default now()
);

create table public.question_nuggets (
  question_id uuid not null references public.questions (id) on delete cascade,
  nugget_id integer not null references public.nuggets (id) on delete cascade,
  score real,
  method text not null default 'manual' check (method in ('manual', 'auto', 'ai')),
  primary key (question_id, nugget_id)
);
create index question_nuggets_nugget_idx on public.question_nuggets (nugget_id);

-- Library ------------------------------------------------------------------------
create table public.library_articles (
  id integer primary key generated always as identity,
  slug text not null unique,
  system_id smallint not null references public.systems (id),
  topic_id integer unique references public.topics (id) on delete set null,
  title text not null,
  summary text,
  body text not null,
  is_free boolean not null default false,
  status text not null default 'published' check (status in ('draft', 'published')),
  generated_by text not null default 'seed' check (generated_by in ('seed', 'auto', 'ai', 'admin')),
  reading_minutes smallint not null default 3,
  search tsvector generated always as (
    to_tsvector('english', title || ' ' || coalesce(summary, '') || ' ' || body)
  ) stored,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index library_articles_search_idx on public.library_articles using gin (search);

create table public.article_questions (
  article_id integer not null references public.library_articles (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete cascade,
  primary key (article_id, question_id)
);

-- Tests ---------------------------------------------------------------------------
create table public.tests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text,
  kind public.test_kind not null default 'custom',
  mode public.test_mode not null default 'tutor',
  status public.test_status not null default 'active',
  filters jsonb not null default '{}'::jsonb,
  question_count smallint not null check (question_count between 1 and 80),
  seconds_per_question smallint not null default 90,
  elapsed_seconds integer not null default 0,
  current_position smallint not null default 0,
  correct_count smallint,
  answered_count smallint,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);
create index tests_user_idx on public.tests (user_id, created_at desc);

create table public.test_items (
  test_id uuid not null references public.tests (id) on delete cascade,
  position smallint not null,
  question_id uuid not null references public.questions (id) on delete cascade,
  selected_option_id uuid references public.question_options (id),
  first_option_id uuid references public.question_options (id),
  changes smallint not null default 0,
  confidence smallint check (confidence between 1 and 3),
  marked boolean not null default false,
  struck text[] not null default '{}',
  highlights jsonb not null default '[]'::jsonb,
  time_ms integer not null default 0,
  labs_opened boolean not null default false,
  submitted boolean not null default false,
  is_correct boolean,
  answered_at timestamptz,
  primary key (test_id, position)
);
create index test_items_question_idx on public.test_items (question_id);

-- Attempts: append-only event log that powers analytics and ARGO --------------------
create table public.attempts (
  id bigint primary key generated always as identity,
  user_id uuid not null references auth.users (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete cascade,
  test_id uuid references public.tests (id) on delete set null,
  kind public.test_kind not null,
  mode public.test_mode,
  selected_option_id uuid,
  selected_label text,
  correct_label text,
  is_correct boolean not null,
  omitted boolean not null default false,
  time_ms integer not null default 0,
  position smallint,
  block_size smallint,
  first_label text,
  changes smallint not null default 0,
  change_pattern text check (change_pattern in ('none', 'c2i', 'i2c', 'i2i')),
  confidence smallint,
  struck_correct boolean not null default false,
  labs_opened boolean not null default false,
  is_first_attempt boolean not null,
  predicted_p real,
  error_type text,
  system_id smallint,
  discipline_id smallint,
  competency_id smallint,
  topic_id integer,
  created_at timestamptz not null default now()
);
create index attempts_user_idx on public.attempts (user_id, created_at desc);
create index attempts_user_question_idx on public.attempts (user_id, question_id, created_at desc);
create index attempts_question_idx on public.attempts (question_id);

-- ARGO state -------------------------------------------------------------------------
create table public.user_ability (
  user_id uuid primary key references auth.users (id) on delete cascade,
  theta real not null default 0,
  n integer not null default 0,
  updated_at timestamptz not null default now()
);

create table public.user_concepts (
  user_id uuid not null references auth.users (id) on delete cascade,
  dim text not null check (dim in ('system', 'discipline', 'competency', 'topic', 'nugget')),
  ref_id integer not null,
  delta real not null default 0,
  n integer not null default 0,
  n_correct integer not null default 0,
  streak smallint not null default 0,
  half_life real not null default 2,
  misconceptions smallint not null default 0,
  last_seen_at timestamptz,
  last_correct_at timestamptz,
  primary key (user_id, dim, ref_id)
);

create table public.user_confusions (
  user_id uuid not null references auth.users (id) on delete cascade,
  correct_concept text not null,
  chosen_concept text not null,
  n integer not null default 1,
  last_question_id uuid,
  last_at timestamptz not null default now(),
  primary key (user_id, correct_concept, chosen_concept)
);

create table public.argo_snapshots (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  theta real not null,
  readiness real,
  accuracy real,
  n_attempts integer not null default 0,
  mastery jsonb not null default '{}'::jsonb,
  primary key (user_id, day)
);

create table public.argo_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  test_id uuid references public.tests (id) on delete set null,
  plan jsonb not null default '{}'::jsonb,
  baseline jsonb not null default '{}'::jsonb,
  result jsonb,
  created_at timestamptz not null default now()
);
create index argo_sessions_user_idx on public.argo_sessions (user_id, created_at desc);

-- Daily challenge -------------------------------------------------------------------
create table public.daily_challenges (
  day date primary key,
  question_id uuid not null references public.questions (id),
  time_limit_s smallint not null default 120,
  created_at timestamptz not null default now()
);

create table public.daily_attempts (
  id bigint primary key generated always as identity,
  day date not null references public.daily_challenges (day) on delete cascade,
  user_id uuid references auth.users (id) on delete cascade,
  guest_token uuid,
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  selected_option_id uuid,
  is_correct boolean,
  time_ms integer,
  score integer,
  check (user_id is not null or guest_token is not null)
);
create unique index daily_attempts_user_uq on public.daily_attempts (day, user_id) where user_id is not null;
create unique index daily_attempts_guest_uq on public.daily_attempts (day, guest_token) where guest_token is not null;
create index daily_attempts_rank_idx on public.daily_attempts (day, score desc, time_ms asc);

-- Notebook, flashcards, feedback -------------------------------------------------------
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  question_id uuid references public.questions (id) on delete cascade,
  article_id integer references public.library_articles (id) on delete cascade,
  body text not null check (char_length(body) <= 20000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index notes_user_idx on public.notes (user_id, updated_at desc);
create unique index notes_user_question_uq on public.notes (user_id, question_id) where question_id is not null;

create table public.flashcards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  question_id uuid references public.questions (id) on delete set null,
  nugget_id integer references public.nuggets (id) on delete set null,
  front text not null,
  back text not null,
  ease real not null default 2.5,
  interval_days real not null default 0,
  reps integer not null default 0,
  lapses integer not null default 0,
  due_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index flashcards_due_idx on public.flashcards (user_id, due_at);

create table public.question_feedback (
  id bigint primary key generated always as identity,
  user_id uuid not null references auth.users (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete cascade,
  kind text not null check (kind in ('error', 'unclear', 'outdated', 'praise', 'other')),
  message text check (char_length(message) <= 4000),
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  created_at timestamptz not null default now()
);

-- Billing -------------------------------------------------------------------------------
create table public.subscriptions (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null,
  plan public.plan_tier not null,
  price_key text,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index subscriptions_user_idx on public.subscriptions (user_id);

-- Imports -------------------------------------------------------------------------------
create table public.import_batches (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references auth.users (id) on delete set null,
  file_name text,
  n_questions integer not null default 0,
  n_created integer not null default 0,
  n_updated integer not null default 0,
  n_errors integer not null default 0,
  report jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Helper predicates ------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select p.role = 'admin' from public.profiles p where p.id = (select auth.uid())),
    false
  ) or coalesce((select auth.role()) = 'service_role', false);
$$;

create or replace function public.plan_rank(p public.plan_tier)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case p when 'free' then 0 when 'core' then 1 when 'argo' then 2 end;
$$;

-- True when the current user holds at least p_min (admins always pass).
create or replace function public.has_plan(p_min public.plan_tier)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_admin() or coalesce((
    select public.plan_rank(p.plan) >= public.plan_rank(p_min)
       and (p.plan_expires_at is null or p.plan_expires_at > now())
    from public.profiles p
    where p.id = (select auth.uid())
  ), false);
$$;

-- Can the current user see this question's content?
create or replace function public.can_view_question(p_status public.question_status, p_owner uuid, p_is_free boolean)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_admin() or (
    p_status = 'published'
    and (p_owner is null or p_owner = (select auth.uid()))
    and (p_is_free or p_owner is not null or public.has_plan('core'))
  );
$$;

-- Row level security ----------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.questions enable row level security;
alter table public.question_options enable row level security;
alter table public.question_keys enable row level security;
alter table public.question_stats enable row level security;
alter table public.nugget_sources enable row level security;
alter table public.nugget_index enable row level security;
alter table public.nuggets enable row level security;
alter table public.question_nuggets enable row level security;
alter table public.library_articles enable row level security;
alter table public.article_questions enable row level security;
alter table public.tests enable row level security;
alter table public.test_items enable row level security;
alter table public.attempts enable row level security;
alter table public.user_ability enable row level security;
alter table public.user_concepts enable row level security;
alter table public.user_confusions enable row level security;
alter table public.argo_snapshots enable row level security;
alter table public.argo_sessions enable row level security;
alter table public.daily_challenges enable row level security;
alter table public.daily_attempts enable row level security;
alter table public.notes enable row level security;
alter table public.flashcards enable row level security;
alter table public.question_feedback enable row level security;
alter table public.subscriptions enable row level security;
alter table public.import_batches enable row level security;

-- Profiles: read/update own; admins read all.
create policy "profiles self read" on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.is_admin());
create policy "profiles self update" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy "profiles admin update" on public.profiles for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Questions & options: visible when the plan allows. Keys/stats only via RPC (admin direct).
create policy "questions visible" on public.questions for select to authenticated
  using (public.can_view_question(status, owner_id, is_free));
create policy "questions admin write" on public.questions for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "options visible" on public.question_options for select to authenticated
  using (exists (select 1 from public.questions q where q.id = question_id and public.can_view_question(q.status, q.owner_id, q.is_free)));
create policy "options admin write" on public.question_options for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "keys admin" on public.question_keys for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "stats admin" on public.question_stats for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "nugget sources admin" on public.nugget_sources for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "nugget index admin" on public.nugget_index for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "nuggets readable" on public.nuggets for select to anon, authenticated using (true);
create policy "nuggets admin write" on public.nuggets for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "question nuggets admin" on public.question_nuggets for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Library: free articles public; full catalogue for paid plans.
create policy "articles visible" on public.library_articles for select to anon, authenticated
  using (status = 'published' and (is_free or public.has_plan('core')));
create policy "articles admin write" on public.library_articles for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "article questions readable" on public.article_questions for select to authenticated using (true);
create policy "article questions admin write" on public.article_questions for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Personal data: own rows only. Scoring writes go through RPCs.
create policy "tests own read" on public.tests for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());
create policy "tests own delete" on public.tests for delete to authenticated
  using (user_id = (select auth.uid()));
create policy "test items own read" on public.test_items for select to authenticated
  using (exists (select 1 from public.tests t where t.id = test_id and (t.user_id = (select auth.uid()) or public.is_admin())));
create policy "attempts own read" on public.attempts for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());
create policy "ability own read" on public.user_ability for select to authenticated
  using (user_id = (select auth.uid()));
create policy "concepts own read" on public.user_concepts for select to authenticated
  using (user_id = (select auth.uid()));
create policy "confusions own read" on public.user_confusions for select to authenticated
  using (user_id = (select auth.uid()));
create policy "snapshots own read" on public.argo_snapshots for select to authenticated
  using (user_id = (select auth.uid()));
create policy "argo sessions own read" on public.argo_sessions for select to authenticated
  using (user_id = (select auth.uid()));

create policy "daily challenges admin" on public.daily_challenges for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "daily attempts own read" on public.daily_attempts for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

create policy "notes own" on public.notes for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "flashcards own" on public.flashcards for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "feedback own insert" on public.question_feedback for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "feedback own read" on public.question_feedback for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());
create policy "feedback admin update" on public.question_feedback for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "subscriptions own read" on public.subscriptions for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());
create policy "imports admin" on public.import_batches for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Triggers --------------------------------------------------------------------------------
create or replace function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_touch before update on public.profiles
  for each row execute function private.touch_updated_at();
create trigger questions_touch before update on public.questions
  for each row execute function private.touch_updated_at();
create trigger tests_touch before update on public.tests
  for each row execute function private.touch_updated_at();
create trigger notes_touch before update on public.notes
  for each row execute function private.touch_updated_at();
create trigger articles_touch before update on public.library_articles
  for each row execute function private.touch_updated_at();

-- Users cannot grant themselves plans, roles or Stripe ids.
create or replace function private.guard_profile_columns()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if public.is_admin() or current_user in ('postgres', 'service_role', 'supabase_admin') then
    return new;
  end if;
  if new.role is distinct from old.role
     or new.plan is distinct from old.plan
     or new.plan_expires_at is distinct from old.plan_expires_at
     or new.stripe_customer_id is distinct from old.stripe_customer_id
     or new.daily_streak is distinct from old.daily_streak
     or new.daily_best_streak is distinct from old.daily_best_streak
     or new.daily_last_win is distinct from old.daily_last_win then
    raise exception 'Not allowed to change protected profile fields';
  end if;
  return new;
end;
$$;

create trigger profiles_guard before update on public.profiles
  for each row execute function private.guard_profile_columns();

-- Create a profile for every new auth user.
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text := nullif(trim(coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'full_name', '')), '');
  v_username text;
begin
  v_username := 'argonaut_' || substr(replace(new.id::text, '-', ''), 1, 6);
  insert into public.profiles (id, display_name, username, role)
  values (
    new.id,
    coalesce(v_name, split_part(coalesce(new.email, ''), '@', 1)),
    v_username,
    case when exists (select 1 from private.admin_emails a where a.email = new.email::extensions.citext)
         then 'admin'::public.user_role else 'user'::public.user_role end
  )
  on conflict (id) do nothing;
  insert into public.user_ability (user_id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- Seed initial question stats rows automatically.
create or replace function private.init_question_stats()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.question_stats (question_id, difficulty_b)
  values (new.id, (new.author_difficulty - 3) * 0.6)
  on conflict (question_id) do nothing;
  return new;
end;
$$;

create trigger questions_init_stats
  after insert on public.questions
  for each row execute function private.init_question_stats();
