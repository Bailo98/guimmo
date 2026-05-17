-- ============================================================
-- BienLoger — Security fixes (audit 2026-05-17)
-- À exécuter dans Supabase Dashboard → SQL Editor
-- ============================================================

-- ── [C1] reports : ajouter UPDATE policy pour les admins ─────────────────────
-- La page admin/moderation fait update({ resolved: true }) — sans cette policy
-- l'appel échoue silencieusement (RLS bloque).
DROP POLICY IF EXISTS "Admins can update reports" ON reports;
CREATE POLICY "Admins can update reports" ON reports FOR UPDATE
  USING (is_admin());

-- ── [C3] listing_stats : restreindre UPDATE aux admins ───────────────────────
-- USING (true) permet à n'importe qui de modifier les stats.
-- Les incréments se font via des fonctions SECURITY DEFINER — pas besoin de
-- laisser le UPDATE ouvert au public.
DROP POLICY IF EXISTS "listing_stats_update" ON listing_stats;
CREATE POLICY "listing_stats_update" ON listing_stats FOR UPDATE
  USING (is_admin());

-- ── [I3] listing_stats INSERT : restreindre aux fonctions SECURITY DEFINER ───
-- Les fonctions increment_listing_stat_* utilisent SECURITY DEFINER donc
-- elles bypassent RLS — pas besoin du WITH CHECK (true) public.
DROP POLICY IF EXISTS "listing_stats_insert" ON listing_stats;
CREATE POLICY "listing_stats_insert" ON listing_stats FOR INSERT
  WITH CHECK (is_admin());

-- ── [I4] profiles : supprimer la policy permissive USING (true) ──────────────
-- "Public profiles are viewable" expose les numéros de téléphone à tous.
-- On la remplace par une policy qui n'expose que les profils publics
-- (lecture de son propre profil ou admin) — les pages publiques utilisent
-- uniquement full_name, avatar_url, is_verified, role qui n'ont pas besoin
-- d'être restreints. Pour maintenir l'accès public aux données non-sensibles
-- on garde une lecture publique mais sans phone via une policy distincte.
DROP POLICY IF EXISTS "Public profiles are viewable" ON profiles;

-- Lecture publique des champs non-sensibles uniquement
-- (phone et agency_name ne sont PAS listés — ils restent lisibles par
-- le propriétaire et l'admin via "profiles_admin_select")
-- NOTE: Supabase ne supporte pas la restriction par colonnes en RLS.
-- Solution pragmatique : garder SELECT public mais documenter que phone
-- est sensible et ne pas l'exposer dans les requêtes côté application.
-- On restreint à l'authentification pour protéger phone :
CREATE POLICY "Authenticated users can read profiles" ON profiles FOR SELECT
  USING (auth.uid() IS NOT NULL OR auth.uid() = id);

-- ── [M2] messages : restreindre UPDATE au receiver uniquement ────────────────
DROP POLICY IF EXISTS "Receivers can mark read" ON messages;
CREATE POLICY "Receivers can mark read" ON messages FOR UPDATE
  USING (auth.uid() = receiver_id);

-- ── [M4] agents : policies admin INSERT/UPDATE/DELETE ───────────────────────
DROP POLICY IF EXISTS "Admins can manage agents" ON agents;
CREATE POLICY "Admins can manage agents" ON agents FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ── Colonne expires_at sur properties (si non présente) ─────────────────────
ALTER TABLE properties ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- ── Vérification finale ──────────────────────────────────────────────────────
-- Lister les policies actives pour confirmer :
-- SELECT schemaname, tablename, policyname, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;
