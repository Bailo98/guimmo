-- ============================================================
-- LogerBien — Migration 012 : colonne views sur properties
-- À exécuter dans Supabase Dashboard → SQL Editor
-- ============================================================

-- S'assure que la colonne views existe (idempotent)
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS views INTEGER NOT NULL DEFAULT 0;

-- Index pour trier les annonces les plus vues
CREATE INDEX IF NOT EXISTS idx_properties_views ON properties(views DESC);

-- (optionnel) Remet à zéro les vues nulles
UPDATE properties SET views = 0 WHERE views IS NULL;
