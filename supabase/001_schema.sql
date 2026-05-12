-- ============================================================
-- GuImmo — Schéma initial
-- À exécuter dans : Supabase Dashboard → SQL Editor
-- ============================================================

-- ─── PROFILES ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name   TEXT,
  phone       TEXT UNIQUE,
  role        TEXT NOT NULL DEFAULT 'buyer'
                CHECK (role IN ('buyer','owner','agent','agency','admin')),
  agency_name TEXT,
  avatar_url  TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, phone, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'phone',
    COALESCE(NEW.raw_user_meta_data->>'role', 'buyer')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── PROPERTIES ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS properties (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id            UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title               TEXT NOT NULL,
  description         TEXT NOT NULL DEFAULT '',
  transaction_type    TEXT NOT NULL CHECK (transaction_type IN ('rent','sale')),
  type                TEXT NOT NULL CHECK (type IN ('apartment','house','studio','villa','room','office','shop','land')),
  status              TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active','pending','paused','sold')),
  price               BIGINT NOT NULL,
  price_period        TEXT NOT NULL DEFAULT 'month' CHECK (price_period IN ('month','year','total')),
  surface             INTEGER,
  rooms               INTEGER DEFAULT 0,
  bathrooms           INTEGER DEFAULT 0,
  furnished           BOOLEAN NOT NULL DEFAULT false,
  available_now       BOOLEAN NOT NULL DEFAULT true,
  neighborhood        TEXT NOT NULL,
  city                TEXT NOT NULL DEFAULT 'Conakry',
  features            TEXT[] DEFAULT '{}',
  contact_phone       TEXT,
  contact_preference  TEXT DEFAULT 'both' CHECK (contact_preference IN ('call','whatsapp','both')),
  views               INTEGER NOT NULL DEFAULT 0,
  whatsapp_clicks     INTEGER NOT NULL DEFAULT 0,
  is_boosted          BOOLEAN NOT NULL DEFAULT false,
  boost_expires_at    TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── PROPERTY IMAGES ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS property_images (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  alt         TEXT DEFAULT '',
  is_primary  BOOLEAN NOT NULL DEFAULT false,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── FAVORITES ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS favorites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, property_id)
);

-- ─── MESSAGES ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  receiver_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  content     TEXT NOT NULL,
  is_read     BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── SITE CONFIG ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS site_config (
  key        TEXT PRIMARY KEY,
  value      JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO site_config (key, value) VALUES
  ('neighborhood_prices', '{"kipe":2500000,"hamdallaye":1800000,"dixinn":2200000,"ratoma":1500000,"taouyah":2000000,"sonfonia":1200000,"lambanyi":1000000,"matam":1600000,"kobaya":1100000,"cosa":1700000}'),
  ('contact_phone',       '"+224 620 00 00 00"'),
  ('contact_whatsapp',    '"+224 620 00 00 00"'),
  ('free_listings_limit', '3'),
  ('site_title',          '"GuImmo — Immobilier de confiance en Guinée"')
ON CONFLICT (key) DO NOTHING;

-- ─── INDEXES ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_properties_status      ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_neighborhood ON properties(neighborhood);
CREATE INDEX IF NOT EXISTS idx_properties_type         ON properties(type);
CREATE INDEX IF NOT EXISTS idx_properties_owner        ON properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user          ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver       ON messages(receiver_id, is_read);

-- ─── ROW LEVEL SECURITY ─────────────────────────────────────
ALTER TABLE profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties      ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites       ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages        ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_config     ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "profiles: lecture publique"
  ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles: modification par soi-même"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- properties
CREATE POLICY "properties: lecture publique (actives)"
  ON properties FOR SELECT USING (status = 'active' OR owner_id = auth.uid());
CREATE POLICY "properties: insertion par utilisateur connecté"
  ON properties FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "properties: modification par le propriétaire"
  ON properties FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "properties: suppression par le propriétaire"
  ON properties FOR DELETE USING (auth.uid() = owner_id);

-- property_images (suit la politique de properties)
CREATE POLICY "images: lecture publique"
  ON property_images FOR SELECT USING (true);
CREATE POLICY "images: gestion par le propriétaire"
  ON property_images FOR ALL USING (
    EXISTS (SELECT 1 FROM properties p WHERE p.id = property_id AND p.owner_id = auth.uid())
  );

-- favorites
CREATE POLICY "favorites: lecture par soi-même"
  ON favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "favorites: insertion par soi-même"
  ON favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "favorites: suppression par soi-même"
  ON favorites FOR DELETE USING (auth.uid() = user_id);

-- messages
CREATE POLICY "messages: lecture sender/receiver"
  ON messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "messages: envoi par utilisateur connecté"
  ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "messages: marquer lu par receiver"
  ON messages FOR UPDATE USING (auth.uid() = receiver_id);

-- site_config: lecture publique, écriture admin uniquement
CREATE POLICY "site_config: lecture publique"
  ON site_config FOR SELECT USING (true);
CREATE POLICY "site_config: écriture admin"
  ON site_config FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ─── updated_at trigger ─────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_properties_updated_at
  BEFORE UPDATE ON properties FOR EACH ROW EXECUTE FUNCTION update_updated_at();
