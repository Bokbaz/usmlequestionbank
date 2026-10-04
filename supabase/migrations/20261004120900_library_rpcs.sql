-- Nuggets covered by a Library chapter (study mode: the chapter teaches the same content).
create or replace function public.article_nuggets(p_article integer)
returns table (id integer, slug text, title text, body text)
language sql
stable
security definer
set search_path = ''
as $$
  select distinct n.id, n.slug, n.title, n.body
  from public.article_questions aq
  join public.question_nuggets qn on qn.question_id = aq.question_id
  join public.nuggets n on n.id = qn.nugget_id
  join public.library_articles a on a.id = aq.article_id
  where aq.article_id = p_article
    and a.status = 'published'
    and (a.is_free or public.has_plan('core'));
$$;
grant execute on function public.article_nuggets(integer) to authenticated, service_role;
