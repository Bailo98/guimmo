-- ─── Migration 020: new features ────────────────────────────────────────────

-- Feature 1: Mode urgence
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS availability_mode TEXT DEFAULT 'flexible';

-- Feature 4: Badges de confiance
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS badges TEXT[] DEFAULT '{}';

-- Feature 10: Boost / premium columns (may already exist from earlier migrations)
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS is_boosted BOOLEAN DEFAULT false;
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS boosted_until TIMESTAMPTZ;

-- Feature 8: Système "Je cherche" — demandes inversées
CREATE TABLE IF NOT EXISTS public.property_requests (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  budget_min  BIGINT,
  budget_max  BIGINT,
  neighborhood TEXT,
  property_type TEXT,
  rooms       INTEGER,
  description TEXT,
  contact_phone TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.property_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "requests public read"   ON public.property_requests;
DROP POLICY IF EXISTS "requests auth insert"   ON public.property_requests;
DROP POLICY IF EXISTS "requests owner update"  ON public.property_requests;

CREATE POLICY "requests public read"
  ON public.property_requests FOR SELECT USING (true);

CREATE POLICY "requests auth insert"
  ON public.property_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "requests owner update"
  ON public.property_requests FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "requests owner delete"
  ON public.property_requests FOR DELETE
  USING (auth.uid() = user_id);
