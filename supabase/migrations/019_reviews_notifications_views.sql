-- ─── 019: reviews, notifications, property_views ───────────────────────────

-- 1. reviews
CREATE TABLE IF NOT EXISTS public.reviews (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id   UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  reviewer_id   UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rating        SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment       TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews: public read"   ON public.reviews FOR SELECT USING (true);
CREATE POLICY "reviews: auth insert"   ON public.reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);
CREATE POLICY "reviews: owner delete"  ON public.reviews FOR DELETE USING (auth.uid() = reviewer_id);

-- 2. notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,          -- e.g. "listing_approved", "listing_rejected", "new_message"
  title       TEXT NOT NULL,
  body        TEXT,
  data        JSONB,                  -- arbitrary payload (property_id, etc.)
  read        BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifs: owner select" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifs: owner update" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "notifs: service insert" ON public.notifications FOR INSERT WITH CHECK (true);

-- 3. property_views  (dedup: one row per (property_id, viewer_fingerprint) per day)
CREATE TABLE IF NOT EXISTS public.property_views (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id  UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  viewer_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  fingerprint  TEXT,                  -- anon visitors: short hash of IP+UA
  viewed_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.property_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "views: public insert"  ON public.property_views FOR INSERT WITH CHECK (true);
CREATE POLICY "views: owner select"   ON public.property_views FOR SELECT USING (true);

-- rejection_reason column on properties (if not already there)
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- onboarding_completed on profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false;
