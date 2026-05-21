-- ============================================================
-- LogerBien — Admin policies manquantes (2026-05-21)
-- À exécuter dans Supabase Dashboard → SQL Editor
-- ============================================================

-- La migration 008 n'avait que UPDATE pour reports (is_admin()).
-- handleMasquer() fait un DELETE → la suppression échouait silencieusement.
DROP POLICY IF EXISTS "Admins can delete reports" ON reports;
CREATE POLICY "Admins can delete reports" ON reports FOR DELETE
  USING (is_admin());

-- Sécurité défensive : s'assurer que la policy ALL sur properties
-- est bien présente (déjà créée dans 006, mais on recrée par sécurité).
DROP POLICY IF EXISTS "properties_admin" ON properties;
CREATE POLICY "properties_admin" ON properties FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());
