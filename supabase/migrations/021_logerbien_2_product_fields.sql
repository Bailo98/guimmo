-- LogerBien 2.0 - product trust and availability fields
-- Additive and idempotent. Existing rows stay public by default.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'chercheur';

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_account_type_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_account_type_check
  CHECK (account_type IN ('chercheur', 'proprietaire', 'agent', 'agence', 'seeker', 'owner'));

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS availability_status TEXT NOT NULL DEFAULT 'available_now',
  ADD COLUMN IF NOT EXISTS available_date DATE,
  ADD COLUMN IF NOT EXISTS advance_required BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS advance_months INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS availability_checked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS availability_reminder_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.properties
  DROP CONSTRAINT IF EXISTS properties_availability_status_check;

ALTER TABLE public.properties
  ADD CONSTRAINT properties_availability_status_check
  CHECK (availability_status IN ('available_now', 'available_soon', 'rented', 'paused'));

ALTER TABLE public.properties
  DROP CONSTRAINT IF EXISTS properties_advance_months_check;

ALTER TABLE public.properties
  ADD CONSTRAINT properties_advance_months_check
  CHECK (advance_months >= 0 AND advance_months <= 24);

UPDATE public.properties
SET availability_status = CASE
  WHEN status IN ('rented', 'sold') THEN 'rented'
  WHEN status = 'paused' THEN 'paused'
  WHEN available_now = false THEN 'rented'
  ELSE availability_status
END;

CREATE INDEX IF NOT EXISTS idx_properties_public_availability
  ON public.properties (status, availability_status, created_at DESC);

