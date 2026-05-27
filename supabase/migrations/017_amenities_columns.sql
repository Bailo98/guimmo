-- Migration 017 — amenity boolean columns on properties
-- Run once in Supabase SQL editor

ALTER TABLE properties ADD COLUMN IF NOT EXISTS has_edg          BOOLEAN DEFAULT false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS has_generator    BOOLEAN DEFAULT false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS has_solar        BOOLEAN DEFAULT false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS has_tap_water    BOOLEAN DEFAULT false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS has_borehole     BOOLEAN DEFAULT false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS has_running_water BOOLEAN DEFAULT false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS has_ac           BOOLEAN DEFAULT false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS is_furnished     BOOLEAN DEFAULT false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS has_parking      BOOLEAN DEFAULT false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS has_pool         BOOLEAN DEFAULT false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS has_security     BOOLEAN DEFAULT false;
