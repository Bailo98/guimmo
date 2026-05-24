-- Migration 015 : champs premium et diaspora sur les annonces
-- À exécuter dans Supabase SQL Editor

ALTER TABLE properties ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS is_diaspora BOOLEAN DEFAULT false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS lat FLOAT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS lng FLOAT;

-- Index de performance pour les requêtes filtrées
CREATE INDEX IF NOT EXISTS idx_properties_featured ON properties(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_properties_diaspora ON properties(is_diaspora) WHERE is_diaspora = true;
CREATE INDEX IF NOT EXISTS idx_properties_location ON properties(lat, lng) WHERE lat IS NOT NULL;
