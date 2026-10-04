-- Nightly item analysis + ARGO snapshots.
create extension if not exists pg_cron with schema pg_catalog;
grant usage on schema cron to postgres;
select cron.schedule('argonaut-nightly', '15 3 * * *', $$select private.nightly()$$);
