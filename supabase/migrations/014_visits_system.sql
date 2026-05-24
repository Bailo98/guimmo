-- ============================================================
-- LogerBien — Migration 014 : système de visites temps réel
-- À exécuter dans Supabase Dashboard → SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS visits (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id     UUID        NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  visitor_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_id        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scheduled_date  DATE        NOT NULL,
  scheduled_time  TEXT        NOT NULL,
  visitor_name    TEXT        NOT NULL,
  visitor_phone   TEXT        NOT NULL,
  visitor_email   TEXT,
  visitor_message TEXT,
  status          TEXT        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  owner_note      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE visits ENABLE ROW LEVEL SECURITY;

-- Le visiteur voit ses propres visites
DROP POLICY IF EXISTS "visits_visitor_select" ON visits;
CREATE POLICY "visits_visitor_select" ON visits FOR SELECT
  USING (visitor_id = auth.uid());

-- Le propriétaire/agent voit les visites de ses annonces
DROP POLICY IF EXISTS "visits_owner_select" ON visits;
CREATE POLICY "visits_owner_select" ON visits FOR SELECT
  USING (owner_id = auth.uid());

-- Un visiteur connecté peut créer une visite (pas pour sa propre annonce)
DROP POLICY IF EXISTS "visits_insert" ON visits;
CREATE POLICY "visits_insert" ON visits FOR INSERT
  WITH CHECK (visitor_id = auth.uid() AND visitor_id <> owner_id);

-- Le propriétaire/agent peut modifier le statut et ajouter une note
DROP POLICY IF EXISTS "visits_owner_update" ON visits;
CREATE POLICY "visits_owner_update" ON visits FOR UPDATE
  USING (owner_id = auth.uid());

-- Admin voit et gère tout
DROP POLICY IF EXISTS "visits_admin" ON visits;
CREATE POLICY "visits_admin" ON visits FOR ALL
  USING (is_admin());

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_visits_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_visits_updated_at ON visits;
CREATE TRIGGER trg_visits_updated_at
  BEFORE UPDATE ON visits FOR EACH ROW EXECUTE FUNCTION update_visits_updated_at();

-- Activer Realtime pour les mises à jour temps réel
ALTER PUBLICATION supabase_realtime ADD TABLE visits;

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_visits_owner_id    ON visits(owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_visits_visitor_id  ON visits(visitor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_visits_property_id ON visits(property_id);
CREATE INDEX IF NOT EXISTS idx_visits_status      ON visits(status);
