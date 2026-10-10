-- Closest bank questions to an embedded testing point (questionMatchText). The admin importer
-- uses it to place new questions from ARGO pipeline exports next to similar ones (organ
-- system, Library topic, category) and to flag questions the bank already has.
create or replace function public.admin_match_questions(p_embedding extensions.vector(384), p_count integer default 10)
returns table (
  code text,
  exam public.exam_type,
  system text,
  topic text,
  category text,
  condition text,
  lead_in text,
  answer text,
  similarity real
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'Admins only' using errcode = '42501'; end if;
  return query
    select q.code, q.exam, s.slug, t.name, c.name, q.tags[1], q.lead_in, o.body,
           (-(q.embedding operator(extensions.<#>) p_embedding))::real
    from public.questions q
    join public.systems s on s.id = q.system_id
    left join public.topics t on t.id = q.topic_id
    left join public.categories c on c.id = q.category_id
    left join public.question_keys k on k.question_id = q.id
    left join public.question_options o on o.id = k.correct_option_id
    where q.embedding is not null and q.owner_id is null
    order by q.embedding operator(extensions.<#>) p_embedding
    limit least(greatest(p_count, 1), 50);
end;
$$;

revoke execute on function public.admin_match_questions(extensions.vector, integer) from public, anon;
grant execute on function public.admin_match_questions(extensions.vector, integer) to authenticated, service_role;
