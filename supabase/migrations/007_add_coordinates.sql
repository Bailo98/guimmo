-- Migration 007 — Add GPS coordinates to properties
-- Run in: Supabase Dashboard → SQL Editor

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS latitude  DECIMAL(10, 8),
  ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Sparse index: only rows that actually have coordinates
CREATE INDEX IF NOT EXISTS idx_properties_coords
  ON properties (latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
