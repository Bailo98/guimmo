-- Migration 018 — reactions table for property listings
-- Run once in Supabase SQL editor

CREATE TABLE IF NOT EXISTS reactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reaction    TEXT NOT NULL CHECK (reaction IN ('love', 'fire', 'eyes', 'expensive')),
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reactions_select"
  ON reactions FOR SELECT
  USING (true);

CREATE POLICY "reactions_insert"
  ON reactions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "reactions_delete"
  ON reactions FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_reactions_property ON reactions(property_id);
