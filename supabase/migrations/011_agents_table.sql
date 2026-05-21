-- ============================================================
-- LogerBien — Agents & dashboard (2026-05-21)
-- À exécuter dans Supabase Dashboard → SQL Editor
-- ============================================================

-- ── Table agents (annuaire géré par l'admin) ──────────────────────────────────
-- Séparée de "profiles" : liste curatée d'agents par quartier avec WhatsApp.
CREATE TABLE IF NOT EXISTS agents (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT        NOT NULL,
  neighborhood   TEXT        NOT NULL DEFAULT '',
  whatsapp       TEXT        NOT NULL DEFAULT '',
  phone          TEXT,
  photo_url      TEXT,
  description    TEXT,
  listings_count INTEGER     NOT NULL DEFAULT 0,
  is_active      BOOLEAN     NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agents_neighborhood ON agents(neighborhood);
CREATE INDEX IF NOT EXISTS idx_agents_active       ON agents(is_active);

ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

-- Lecture publique pour les agents actifs
DROP POLICY IF EXISTS "agents_public_select" ON agents;
CREATE POLICY "agents_public_select" ON agents FOR SELECT
  USING (is_active = true OR is_admin());

-- Gestion admin complète
DROP POLICY IF EXISTS "agents_admin_all" ON agents;
CREATE POLICY "agents_admin_all" ON agents FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_agents_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_agents_updated_at ON agents;
CREATE TRIGGER trg_agents_updated_at
  BEFORE UPDATE ON agents FOR EACH ROW EXECUTE FUNCTION update_agents_updated_at();

-- ── Column account_type sur profiles (si non présente) ───────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'chercheur'
  CHECK (account_type IN ('chercheur', 'proprietaire', 'agent', 'agence', NULL));

-- ── Column is_verified_pro sur profiles (si non présente) ────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_verified_pro BOOLEAN NOT NULL DEFAULT false;

-- ── Column bio sur profiles (si non présente) ────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS bio TEXT;

-- ── Column website sur profiles (si non présente) ────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS website TEXT;

-- ── Column agency_logo_url sur profiles (si non présente) ────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS agency_logo_url TEXT;

-- ── Activer Realtime sur favorites (pour synchronisation temps-réel) ─────────
ALTER PUBLICATION supabase_realtime ADD TABLE favorites;

-- ── Vérification ─────────────────────────────────────────────────────────────
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public' AND table_name IN ('agents', 'favorites', 'messages');
