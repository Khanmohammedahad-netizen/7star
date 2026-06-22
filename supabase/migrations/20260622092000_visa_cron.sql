/*
  # Visa-check daily schedule (Phase 6)

  Schedules the cron-visa-check edge function to run at 09:00 GST (05:00 UTC).
  Requires the pg_cron and pg_net extensions (available on Supabase).

  Replace <PROJECT_REF> and <SERVICE_ROLE_KEY> before applying, or set them via
  Supabase Vault and reference accordingly. Idempotent: unschedules first.
*/

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$
BEGIN
  PERFORM cron.unschedule('visa-check-daily');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

SELECT cron.schedule(
  'visa-check-daily',
  '0 5 * * *',
  $$
  SELECT net.http_post(
    url := 'https://<PROJECT_REF>.functions.supabase.co/cron-visa-check',
    headers := jsonb_build_object(
      'Authorization', 'Bearer <SERVICE_ROLE_KEY>',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
