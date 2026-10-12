-- Daily Challenge board: 200 seeded players ranked alongside real attempts every day, and a
-- daily player count. Each day's numbers come from a hash of the date, so they're stable all
-- day and change at the 00:00 UTC reset with no cron job.

create table private.daily_board_seed (
  id smallint primary key,
  username extensions.citext not null unique check (username ~ '^[A-Za-z0-9_.-]{3,24}$'),
  display_name text,
  country text not null check (country ~ '^[A-Z]{2}$'),
  school_id integer references public.medical_schools (id) on delete set null,
  skill real not null check (skill between 0 and 1),
  cycle smallint not null check (cycle > 0),
  phase smallint not null check (phase >= 0)
);

insert into private.daily_board_seed (id, username, display_name, country, skill, cycle, phase) values
  (1, 'mdcandidate27', 'Tom N.', 'US', 0.782, 35, 5),
  (2, 'glomerulonerd', null, 'US', 0.718, 17, 3),
  (3, 'gevans', 'George Evans', 'GB', 0.751, 41, 33),
  (4, 'osler_fan', 'Isabella', 'US', 0.109, 31, 26),
  (5, 'natalie_ros', 'Natalie R.', 'US', 0.102, 13, 3),
  (6, 'isla_clarke', 'Isla Clarke', 'GB', 0.044, 32, 22),
  (7, 'ondrej_cer', 'Ondrej Cerny', 'CZ', 0.525, 24, 17),
  (8, 'valeria125', 'Valeria Perez', 'US', 0.241, 22, 20),
  (9, 'trossi', 'Tyler Rossi', 'US', 0.704, 29, 18),
  (10, 'ben_mit', 'Ben M.', 'US', 0.695, 11, 4),
  (11, 'boards_or_bust', null, 'PL', 0.591, 36, 35),
  (12, 'nikhil_white', 'Nikhil White', 'US', 0.82, 45, 33),
  (13, 'pablo_lop', 'Pablo Lopez', 'ES', 0.507, 38, 5),
  (14, 'annahoffmann58', 'Anna Hoffmann', 'DE', 0.277, 38, 33),
  (15, 'zara122', 'Zara Hussain', 'GB', 0.679, 3, 0),
  (16, 'tomas.cerny', 'Tomas C.', 'CZ', 0.795, 5, 0),
  (17, 't_wave_tina', null, 'PL', 0.167, 39, 2),
  (18, 'sinus_rhythm', 'Andres', 'US', 0.178, 10, 6),
  (19, 'rachel_wilson', 'Rachel Wilson', 'US', 0.418, 37, 16),
  (20, 'hugo_martin', 'Hugo M.', 'FR', 0.201, 32, 17),
  (21, 'hugo106', 'Hugo Martin', 'FR', 0.695, 13, 6),
  (22, 'docinprogress', null, 'GB', 0.864, 56, 1),
  (23, 'rhys.taylor.md', 'Rhys T.', 'GB', 0.48, 19, 0),
  (24, 'george123', 'George Brown', 'GB', 0.031, 41, 16),
  (25, 'aortic_annie', null, 'US', 0.673, 48, 7),
  (26, 'dana.torres', 'Dana Torres', 'US', 0.704, 52, 11),
  (27, 'dr.leaschulz', 'Lea Schulz', 'DE', 0.475, 11, 5),
  (28, 'firstaidfiend', 'Mihai S.', 'RO', 0.164, 48, 6),
  (29, 'dr.samevans', 'Sam Evans', 'US', 0.308, 13, 1),
  (30, 'rubys', 'Ruby Smith', 'GB', 0.426, 45, 15),
  (31, 'thompson.noor', 'Noor Thompson', 'US', 0.111, 31, 6),
  (32, 'ventricle_vic', null, 'US', 0.376, 44, 20),
  (33, 'dr.adityarao', 'Aditya R.', 'US', 0.345, 3, 0),
  (34, 'dr.thomasgreen', 'Thomas Green', 'GB', 0.133, 28, 24),
  (35, 'alfie_kha', 'Alfie K.', 'GB', 0.57, 50, 11),
  (36, 'lisa_gruber', 'Lisa Gruber', 'AT', 0.481, 29, 2),
  (37, 'dana110', 'Dana', 'US', 0.438, 46, 28),
  (38, 'fracture_frank', null, 'GR', 0.221, 56, 36),
  (39, 'aaliyahtran78', 'Aaliyah Tran', 'US', 0.807, 29, 13),
  (40, 'torres.tom', 'Tom Torres', 'US', 0.449, 12, 5),
  (41, 'Bdavis', 'Brian D.', 'US', 0.757, 32, 12),
  (42, 'dr.lindalewis', 'Linda Lewis', 'US', 0.507, 26, 18),
  (43, 'lupus_lou', null, 'GB', 0.732, 15, 1),
  (44, 'rbc_rocket', null, 'DE', 0.4, 49, 9),
  (45, 'adams.diego', 'Diego Adams', 'US', 0.592, 8, 4),
  (46, 'andres.patel', 'Andres P.', 'US', 0.783, 13, 9),
  (47, 'giorgos_georgiou', 'Giorgos Georgiou', 'GR', 0.29, 30, 28),
  (48, 'lactate_lad', null, 'GB', 0.054, 35, 9),
  (49, 'ekg_eddie', null, 'IE', 0.203, 37, 18),
  (50, 'james92', 'James H.', 'GB', 0.789, 24, 16),
  (51, 'clot_buster', 'Sophie', 'GB', 0.626, 17, 12),
  (52, 'poppy.jones', 'Poppy Jones', 'GB', 0.952, 37, 27),
  (53, 'connor.cohen', 'Connor Cohen', 'US', 0.481, 31, 10),
  (54, 'sketchy_sam', null, 'US', 0.768, 9, 4),
  (55, 'quiz_squid', null, 'US', 0.44, 3, 1),
  (56, 'sam_bianchi', 'Sam Bianchi', 'US', 0.329, 57, 44),
  (57, 'tereza110', 'Tereza Novotny', 'CZ', 0.325, 32, 24),
  (58, 'anki_addict', 'Julia', 'NL', 0.051, 60, 0),
  (59, 'renal_ronnie', null, 'HR', 0.747, 52, 28),
  (60, 'imani110', 'Imani Novak', 'US', 0.589, 8, 2),
  (61, 'ella129', 'Ella Collins', 'US', 0.377, 54, 11),
  (62, 'ms3_survivor', 'Jordan C.', 'US', 0.41, 36, 15),
  (63, 'dr.valeriagupta', 'Valeria Gupta', 'US', 0.494, 52, 48),
  (64, 'immuno_izzy', null, 'US', 0.414, 17, 13),
  (65, 'Scrub_life', null, 'IE', 0.613, 50, 42),
  (66, 'jessica.gonzalez.md', 'Jessica Gonzalez', 'US', 0.476, 41, 24),
  (67, 'Murphy.conor', 'Conor M.', 'IE', 0.492, 23, 19),
  (68, 'haugen.ola', 'Ola H.', 'PL', 0.719, 10, 0),
  (69, 'qtc_prolonged', 'Pablo', 'ES', 0.451, 25, 18),
  (70, 'cgupta', 'Caleb Gupta', 'US', 0.68, 22, 4),
  (71, 'gut_feeling_md', null, 'NL', 0.34, 31, 7),
  (72, 'dr.aoifeosullivan', 'Aoife O''Sullivan', 'IE', 0.693, 5, 0),
  (73, 'andre_jones', 'Andre J.', 'US', 0.583, 46, 25),
  (74, 'heme_queen', null, 'US', 0.392, 16, 4),
  (75, 'elijahl', 'Elijah Levy', 'US', 0.511, 52, 12),
  (76, 'dr.amandaiyer', 'Amanda I.', 'US', 0.483, 38, 28),
  (77, 'klein.leon', 'Leon Klein', 'DE', 0.733, 37, 20),
  (78, 'jordan116', 'Jordan Scott', 'US', 0.375, 9, 3),
  (79, 'tachy_tom', null, 'US', 0.098, 25, 16),
  (80, 'Baker.ella', 'Ella Baker', 'US', 0.896, 36, 22),
  (81, 'Okafor.natalie', 'Natalie O.', 'US', 0.505, 34, 8),
  (82, 'christinecollins80', 'Christine Collins', 'US', 0.543, 37, 9),
  (83, 'shelf_slayer', null, 'GB', 0.199, 39, 17),
  (84, 'Leaf', 'Lea Fischer', 'DE', 0.493, 37, 19),
  (85, 'lewis.kavya', 'Kavya Lewis', 'US', 0.727, 44, 20),
  (86, 'rhysw', 'Rhys W.', 'GB', 0.612, 50, 13),
  (87, 'goldberg.fatima', 'Fatima Goldberg', 'US', 0.537, 33, 10),
  (88, 'rohan.zhang.md', 'Rohan Zhang', 'US', 0.401, 12, 7),
  (89, 'bun_n_creatinine', 'Louis', 'FR', 0.72, 59, 7),
  (90, 'myelin_dreams', 'Omar D.', 'US', 0.118, 15, 0),
  (91, 'nikhil125', 'Nikhil Davis', 'US', 0.542, 12, 11),
  (92, 'carlosa', 'Carlos Anderson', 'US', 0.263, 32, 14),
  (93, 'brady_bunch', null, 'GR', 0.863, 52, 35),
  (94, 'dr.zuzannaszymanski', 'Zuzanna S.', 'PL', 0.642, 9, 2),
  (95, 'dopamine_dani', null, 'US', 0.356, 21, 8),
  (96, 'avar', 'Ava Rossi', 'US', 0.403, 43, 33),
  (97, 'Cyto_chrome', 'Maja J.', 'PL', 0.45, 7, 2),
  (98, 'eleanor_wil', 'Eleanor Wilson', 'GB', 0.809, 21, 20),
  (99, 'dr.omarallen', 'Omar', 'US', 0.343, 53, 18),
  (100, 'barteksuzuki14', 'Bartek S.', 'PL', 0.83, 12, 10),
  (101, 'gruber.florian', 'Florian Gruber', 'AT', 0.225, 14, 12),
  (102, 'julia_car', 'Julia Carter', 'US', 0.494, 12, 0),
  (103, 'pharm_phantom', null, 'DE', 0.774, 51, 47),
  (104, 'Biochem_bandit', null, 'IT', 0.721, 32, 12),
  (105, 'danarogers90', 'Dana R.', 'US', 0.78, 56, 25),
  (106, 'tom_mal', 'Tom Malik', 'US', 0.186, 56, 55),
  (107, 'chiefcomplaint', 'Jacob N.', 'US', 0.632, 24, 14),
  (108, 'hannahmurphy99', 'Hannah Murphy', 'US', 0.521, 44, 31),
  (109, 'white_coat_will', null, 'US', 0.765, 40, 9),
  (110, 'the_vagus_nerve', 'Saanvi', 'PL', 0.448, 51, 16),
  (111, 'leah.kapoor', 'Leah K.', 'US', 0.288, 25, 1),
  (112, 'Bence.toth.md', 'Bence Toth', 'HU', 0.49, 50, 19),
  (113, 'p_value_paul', null, 'US', 0.415, 30, 5),
  (114, 'Hilum_hunter', null, 'US', 0.817, 33, 22),
  (115, 'Green.alex', 'Alex G.', 'US', 0.444, 46, 28),
  (116, 'thalamus_theo', null, 'CZ', 0.389, 53, 35),
  (117, 'dr.ellanovak', 'Ella Novak', 'US', 0.527, 59, 49),
  (118, 'lub_dub_doc', 'Lena', 'DE', 0.593, 26, 12),
  (119, 'chloeallen48', 'Chloe Allen', 'US', 0.761, 48, 22),
  (120, 'lewandowski.wiktoria', 'Wiktoria Lewandowski', 'PL', 0.689, 12, 1),
  (121, 'zebra_hunter', null, 'US', 0.822, 51, 49),
  (122, 'valeriaz', 'Valeria Zhang', 'US', 0.533, 17, 0),
  (123, 'vikram_wan', 'Vikram Wang', 'US', 0.645, 42, 20),
  (124, 'wobbly_wenckebach', null, 'US', 0.745, 19, 14),
  (125, 'James_hussain', 'James H.', 'GB', 0.381, 19, 18),
  (126, 'chloehill50', 'Chloe Hill', 'US', 0.093, 59, 52),
  (127, 'islajones18', 'Isla Jones', 'GB', 0.782, 57, 29),
  (128, 'snehagoldberg93', 'Sneha Goldberg', 'US', 0.727, 38, 18),
  (129, 'amyloid_amy', null, 'US', 0.38, 49, 48),
  (130, 'nbme_nemesis', null, 'DE', 0.214, 54, 8),
  (131, 'noar', 'Noa Rahimi', 'HU', 0.7, 33, 2),
  (132, 'sam.haddad', 'Sam Haddad', 'US', 0.871, 27, 2),
  (133, 'dsm_daria', null, 'PL', 0.758, 30, 18),
  (134, 'wisniewski.julia', 'Julia Wisniewski', 'PL', 0.505, 10, 4),
  (135, 'crodriguez', 'Carlos Rodriguez', 'ES', 0.214, 39, 36),
  (136, 'dr.ameliamorgan', 'Amelia Morgan', 'GB', 0.424, 30, 24),
  (137, 'dr.elenigeorgiou', 'Eleni Georgiou', 'GR', 0.647, 40, 2),
  (138, 'wilson.megan', 'Megan', 'US', 0.603, 26, 14),
  (139, 'ejohansson', 'Elsa J.', 'SE', 0.692, 49, 19),
  (140, 'leon.klein.md', 'Leon Klein', 'DE', 0.817, 12, 6),
  (141, 'dr.brianroberts', 'Brian Roberts', 'US', 0.465, 36, 20),
  (142, 'med_mango', 'Zuzanna', 'PL', 0.285, 19, 2),
  (143, 'marco91', 'Marco Russo', 'IT', 0.548, 27, 5),
  (144, 'bence_kov', 'Bence Kovacs', 'HU', 0.551, 25, 12),
  (145, 'marcor', 'Marco Ricci', 'IT', 0.202, 38, 0),
  (146, 'atp_synthase', null, 'GB', 0.193, 4, 1),
  (147, 'aisharoberts3', 'Aisha Roberts', 'GB', 0.659, 34, 20),
  (148, 'pathoma_enjoyer', 'Katerina P.', 'GR', 0.768, 5, 3),
  (149, 'oliviaallen84', 'Olivia Allen', 'US', 0.736, 3, 0),
  (150, 'ioana_ghe', 'Ioana Gheorghe', 'RO', 0.68, 12, 6),
  (151, 'lucia_mar', 'Lucia M.', 'ES', 0.556, 19, 10),
  (152, 'Neuro_nomad', 'Kavya', 'US', 0.326, 17, 1),
  (153, 'mariam_ahmed', 'Mariam Ahmed', 'US', 0.721, 24, 19),
  (154, 'svoboda.ondrej', 'Ondrej Svoboda', 'CZ', 0.451, 46, 43),
  (155, 'cranial_nerve_7', 'Chiara', 'IT', 0.474, 22, 2),
  (156, 'daily_dose_dan', null, 'DE', 0.722, 13, 7),
  (157, 'sodium_sally', null, 'DE', 0.823, 29, 8),
  (158, 'Cortisol_kid', null, 'US', 0.526, 4, 2),
  (159, 'Lowyield_larry', null, 'US', 0.916, 15, 1),
  (160, 'saoirsek', 'Saoirse', 'IE', 0.362, 9, 2),
  (161, 'thomas101', 'Thomas', 'GB', 0.282, 8, 1),
  (162, 'pgy0', 'Kacper', 'PL', 0.629, 8, 5),
  (163, 'stat_lytes', 'Yusuf', 'US', 0.404, 53, 8),
  (164, 'kinase_kat', null, 'AT', 0.211, 11, 4),
  (165, 'Jwalker', 'Jessica Walker', 'US', 0.418, 30, 23),
  (166, 'grind_mode_md', null, 'PL', 0.25, 41, 29),
  (167, 'Pons_and_medulla', null, 'US', 0.668, 45, 39),
  (168, 'eliska97', 'Eliska Svoboda', 'CZ', 0.843, 60, 53),
  (169, 'madisonjones63', 'Madison Jones', 'US', 0.222, 20, 1),
  (170, 'Mitral_mel', null, 'HU', 0.456, 45, 24),
  (171, 'dr_tbd', null, 'US', 0.107, 48, 31),
  (172, 'tcampbell', 'Thomas C.', 'GB', 0.218, 46, 8),
  (173, 'hb_a1c', null, 'RO', 0.442, 3, 0),
  (174, 'kevin_roberts', 'Kevin Roberts', 'US', 0.46, 37, 7),
  (175, 'dr.mateuszeze', 'Mateusz Eze', 'PL', 0.495, 18, 10),
  (176, 'futuredoc_jay', null, 'DE', 0.152, 39, 13),
  (177, 'micro_mike', null, 'FR', 0.201, 36, 13),
  (178, 'Hannahm', 'Hannah Meyer', 'DE', 0.512, 27, 18),
  (179, 'cwilson', 'Charlie Wilson', 'GB', 0.515, 51, 2),
  (180, 'Step1_or_bust', 'Ali T.', 'US', 0.253, 18, 3),
  (181, 'ms2_and_tired', null, 'PL', 0.797, 24, 15),
  (182, 'nephron_ninja', null, 'US', 0.547, 31, 28),
  (183, 'davidi', 'David', 'US', 0.61, 39, 1),
  (184, 'lucijah', 'Lucija Horvat', 'HR', 0.301, 50, 47),
  (185, 'omar.martinez.md', 'Omar Martinez', 'US', 0.74, 7, 5),
  (186, 'andresiyer19', 'Andres I.', 'US', 0.813, 34, 22),
  (187, 'coffee_n_ekgs', 'Ava', 'US', 0.292, 37, 18),
  (188, 'pablo100', 'Pablo M.', 'ES', 0.486, 6, 4),
  (189, 'kavyah', 'Kavya H.', 'US', 0.522, 26, 11),
  (190, 'krebs_cycler', 'Omar', 'US', 0.485, 5, 2),
  (191, 'andrei.popescu', 'Andrei Popescu', 'RO', 0.399, 41, 38),
  (192, 'isabella_ros', 'Isabella Rossi', 'US', 0.631, 56, 35),
  (193, 'beta_blocked', 'Conor', 'IE', 0.738, 58, 26),
  (194, 'nehachen29', 'Neha Chen', 'US', 0.353, 55, 4),
  (195, 'lea.leroy.md', 'Lea Leroy', 'FR', 0.856, 54, 32),
  (196, 'tbrown', 'Tom B.', 'US', 0.17, 25, 8),
  (197, 'morris.kate', 'Kate Morris', 'US', 0.393, 49, 10),
  (198, 'mariamm', 'Mariam Mitchell', 'US', 0.613, 20, 12),
  (199, 'rahimi.ahmed', 'Ahmed Rahimi', 'HU', 0.721, 30, 27),
  (200, 'amanda111', 'Amanda R.', 'US', 0.384, 60, 51);

-- A medical school in each player's country.
update private.daily_board_seed s
set school_id = (select m.id from public.medical_schools m where m.country = s.country order by md5(m.id || ':' || s.id) limit 1);

-- Stable pseudo-random number in [0, 1) for a key.
create or replace function private.unit_hash(p_key text)
returns double precision
language sql
immutable
set search_path = ''
as $$ select (hashtextextended(p_key, 0) & 9007199254740991)::double precision / 9007199254740992.0; $$;

-- The seeded players' results for a day: all correct, scored with the same formula as
-- daily_submit, at times that land around the real average (about 36 to 68 s of 120 s).
create or replace function private.daily_board_rows(p_day date)
returns table (username text, display_name text, country text, score integer, time_ms integer, streak integer)
language sql
stable
security definer
set search_path = ''
as $$
  with dc as (select time_limit_s from public.daily_challenges where day = p_day),
  t as (
    select s.*, dc.time_limit_s lim,
      round(dc.time_limit_s * 1000 * (0.30 + 0.27 * (1 - (0.55 * s.skill + 0.45 * private.unit_hash(p_day::text || ':' || s.id)))))::integer ms
    from private.daily_board_seed s cross join dc
  )
  select t.username::text, t.display_name, t.country,
    round(1000 * (0.5 + 0.5 * greatest(0, 1 - t.ms / (t.lim * 1000.0))))::integer,
    t.ms,
    least(((p_day - date '2026-01-01') + t.phase) % t.cycle + 1, private.daily_number(p_day))::integer
  from t;
$$;

-- "Played today": 4,000 to 7,500 a day, plus every real submission.
create or replace function private.daily_players(p_day date)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select (case when exists (select 1 from public.daily_challenges where day = p_day)
               then 4000 + floor(private.unit_hash('players:' || p_day) * 3501)::integer else 0 end)
       + (select count(*) from public.daily_attempts a where a.day = p_day and a.submitted_at is not null)::integer;
$$;

-- Share correct across everyone counted in daily_players: 38 to 68% for the base, blended with real answers.
create or replace function private.daily_pct_correct(p_day date)
returns numeric
language sql
stable
security definer
set search_path = ''
as $$
  with r as (
    select count(*) n, count(*) filter (where a.is_correct) ok
    from public.daily_attempts a where a.day = p_day and a.submitted_at is not null
  ), b as (select private.daily_players(p_day) - r.n base_n from r)
  select round((b.base_n * (38 + private.unit_hash('pct:' || p_day) * 30) / 100.0 + r.ok) * 100.0 / nullif(b.base_n + r.n, 0))
  from r, b;
$$;

revoke all on function private.unit_hash(text) from public, anon, authenticated;
revoke all on function private.daily_board_rows(date) from public, anon, authenticated;
revoke all on function private.daily_players(date) from public, anon, authenticated;
revoke all on function private.daily_pct_correct(date) from public, anon, authenticated;

-- Seeded handles can't be taken by real accounts (surfaces as "That handle is taken").
create or replace function private.profiles_username_reserved()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.username is not null
     and exists (select 1 from private.daily_board_seed s where lower(s.username::text) = lower(new.username::text)) then
    raise exception 'username % is taken', new.username using errcode = 'unique_violation';
  end if;
  return new;
end;
$$;
revoke all on function private.profiles_username_reserved() from public, anon, authenticated;

create trigger profiles_username_reserved
  before insert or update of username on public.profiles
  for each row execute function private.profiles_username_reserved();

create or replace function public.daily_leaderboard(p_day date default null, p_limit integer default 50)
returns table (
  rank bigint, username text, display_name text, country text, score integer, time_ms integer,
  is_correct boolean, streak integer, is_me boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  with d as (select coalesce(p_day, private.daily_day()) as day),
  board as (
    select p.username::text as username, p.display_name, p.country, a.score, a.time_ms, a.is_correct, p.daily_streak as streak,
      a.user_id = (select auth.uid()) as is_me
    from d, public.daily_attempts a
    join public.profiles p on p.id = a.user_id
    where a.day = d.day and a.submitted_at is not null
    union all
    select b.username, b.display_name, b.country, b.score, b.time_ms, true, b.streak, false
    from d, private.daily_board_rows(d.day) b
  )
  select rank() over (order by score desc, time_ms asc), username, display_name, country, score, time_ms, is_correct, streak, is_me
  from board
  order by score desc, time_ms asc
  limit least(greatest(p_limit, 1), 200);
$$;

create or replace function private.daily_result(p_attempt public.daily_attempts, p_limit smallint)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'is_correct', p_attempt.is_correct,
    'selected_option_id', p_attempt.selected_option_id,
    'time_ms', p_attempt.time_ms,
    'score', p_attempt.score,
    'timed_out', p_attempt.time_ms > (p_limit + 3) * 1000,
    'rank', (select count(*) + 1 from public.daily_attempts o
             where o.day = p_attempt.day and o.user_id is not null and o.submitted_at is not null
               and (o.score > p_attempt.score or (o.score = p_attempt.score and o.time_ms < p_attempt.time_ms)))
          + (select count(*) from private.daily_board_rows(p_attempt.day) b
             where b.score > p_attempt.score or (b.score = p_attempt.score and b.time_ms < p_attempt.time_ms)),
    'players', private.daily_players(p_attempt.day),
    'pct_correct', private.daily_pct_correct(p_attempt.day)
  );
$$;

create or replace function public.daily_today(p_guest uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_day date := private.daily_day();
  v_dc public.daily_challenges;
  q public.questions;
  v_att public.daily_attempts;
  v_state text := 'none';
  v_payload jsonb := null;
begin
  v_dc := private.ensure_daily(v_day);
  if v_dc is null then
    return jsonb_build_object('day', v_day, 'available', false);
  end if;
  select * into q from public.questions where id = v_dc.question_id;
  v_att := private.daily_attempt_for(v_day, p_guest);

  if v_att.id is not null then
    v_state := case when v_att.submitted_at is null then 'started' else 'done' end;
  end if;

  if v_state = 'started' then
    v_payload := jsonb_build_object(
      'stem', q.stem, 'lead_in', q.lead_in, 'media', q.media,
      'options', (select jsonb_agg(jsonb_build_object('id', o.id, 'label', o.label, 'body', o.body) order by o.label)
                  from public.question_options o where o.question_id = q.id),
      'started_at', v_att.started_at,
      'elapsed_ms', (extract(epoch from (now() - v_att.started_at)) * 1000)::integer);
  elsif v_state = 'done' then
    v_payload := jsonb_build_object(
      'stem', q.stem, 'lead_in', q.lead_in, 'media', q.media,
      'options', (select jsonb_agg(jsonb_build_object('id', o.id, 'label', o.label, 'body', o.body) order by o.label)
                  from public.question_options o where o.question_id = q.id),
      'result', private.daily_result(v_att, v_dc.time_limit_s),
      'review', private.review_payload(q.id));
  end if;

  return jsonb_build_object(
    'day', v_day,
    'number', private.daily_number(v_day),
    'available', true,
    'time_limit_s', v_dc.time_limit_s,
    'system', (select s.short_name from public.systems s where s.id = q.system_id),
    'discipline', (select d.name from public.disciplines d where d.id = q.discipline_id),
    'difficulty', q.author_difficulty,
    'state', v_state,
    'payload', v_payload,
    'players', private.daily_players(v_day),
    'pct_correct', private.daily_pct_correct(v_day),
    'next_reset', ((v_day + 1)::timestamp at time zone 'utc')
  );
end;
$$;
