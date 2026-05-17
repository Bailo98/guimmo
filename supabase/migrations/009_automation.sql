-- ============================================================
-- BienLoger — Automation tables & columns (2026-05-17)
-- À exécuter dans Supabase Dashboard → SQL Editor
-- ============================================================

-- ── reminder_sent column on properties ───────────────────────────────────────
-- Already added expires_at in migration 008. Add reminder_sent here.
ALTER TABLE properties ADD COLUMN IF NOT EXISTS reminder_sent boolean NOT NULL DEFAULT false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS moderated_at  TIMESTAMPTZ;

-- ── notifications_sent — dedup table for saved search alerts ─────────────────
CREATE TABLE IF NOT EXISTS notifications_sent (
  id              uuid             PRIMARY KEY DEFAULT gen_random_uuid(),
  saved_search_id uuid             NOT NULL REFERENCES saved_searches(id) ON DELETE CASCADE,
  user_id         uuid             NOT NULL REFERENCES auth.users(id)     ON DELETE CASCADE,
  property_id     uuid             NOT NULL REFERENCES properties(id)     ON DELETE CASCADE,
  created_at      TIMESTAMPTZ      NOT NULL DEFAULT now(),
  UNIQUE (saved_search_id, property_id)
);

ALTER TABLE notifications_sent ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_sent_owner" ON notifications_sent FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "notifications_sent_admin_all" ON notifications_sent FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Service role (Edge Functions) bypasses RLS — no extra policy needed.

-- ── cleanup_logs — audit trail for the cleanup function ──────────────────────
CREATE TABLE IF NOT EXISTS cleanup_logs (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  ran_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  results    jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE cleanup_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cleanup_logs_admin" ON cleanup_logs FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ── pg_cron schedules (optional — requires pg_cron extension) ────────────────
-- Enable via: Supabase Dashboard → Database → Extensions → pg_cron
--
-- SELECT cron.schedule('expire-listings',       '0 6 * * *',   $$ SELECT net.http_post('https://kqshknfrtlbjaufkdeeg.supabase.co/functions/v1/expire-listings',       '{}', '{"Content-Type":"application/json"}') $$);
-- SELECT cron.schedule('notify-saved-searches', '0 * * * *',   $$ SELECT net.http_post('https://kqshknfrtlbjaufkdeeg.supabase.co/functions/v1/notify-saved-searches', '{}', '{"Content-Type":"application/json"}') $$);
-- SELECT cron.schedule('monthly-report',        '0 9 1 * *',   $$ SELECT net.http_post('https://kqshknfrtlbjaufkdeeg.supabase.co/functions/v1/monthly-report',        '{}', '{"Content-Type":"application/json"}') $$);
-- SELECT cron.schedule('auto-moderate',         '0 * * * *',   $$ SELECT net.http_post('https://kqshknfrtlbjaufkdeeg.supabase.co/functions/v1/auto-moderate',         '{}', '{"Content-Type":"application/json"}') $$);
-- SELECT cron.schedule('cleanup',               '0 3 * * 0',   $$ SELECT net.http_post('https://kqshknfrtlbjaufkdeeg.supabase.co/functions/v1/cleanup',               '{}', '{"Content-Type":"application/json"}') $$);
