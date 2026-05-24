-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 016 — Favorites : ajout de la policy UPDATE manquante
-- ─────────────────────────────────────────────────────────────────────────────
--
-- Contexte :
--   Le swipe droite dans SwipeFeed utilisait .upsert(..., { onConflict: ... })
--   sans ignoreDuplicates:true. PostgREST génère alors un
--   "INSERT … ON CONFLICT DO UPDATE SET …" qui déclenche à la fois la vérification
--   INSERT et UPDATE. La policy UPDATE n'existant pas sur favorites, toute tentative
--   d'upsert sur une ligne existante retournait 403.
--
-- Fix côté code (SwipeFeed.tsx) : ignoreDuplicates:true → ON CONFLICT DO NOTHING
--   → seule la policy INSERT est vérifiée → 403 disparu.
--
-- Ce fichier ajoute quand même la policy UPDATE pour couvrir tout autre code
-- qui ferait un UPDATE direct sur favorites (ex: marquer un favori comme "vu").
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Nettoyage : supprimer les policies qui pourraient avoir des noms différents
--    selon la version du schema déployée (001_schema.sql vs schema.sql).

DROP POLICY IF EXISTS "favorites: modification par soi-même"    ON favorites;
DROP POLICY IF EXISTS "favorites update own"                     ON favorites;
DROP POLICY IF EXISTS "Users can update own favorites"           ON favorites;

-- 2. Recréer les policies INSERT + DELETE avec la syntaxe canonique
--    (certains déploiements ont pu utiliser USING au lieu de WITH CHECK sur INSERT,
--    ce qui est ignoré silencieusement par PostgreSQL mais peut causer confusion).

DROP POLICY IF EXISTS "favorites: insertion par soi-même"       ON favorites;
DROP POLICY IF EXISTS "Users can add favorites"                  ON favorites;

CREATE POLICY "favorites_insert_own"
  ON favorites
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 3. Nouvelle policy UPDATE (manquante dans tous les schemas précédents)

CREATE POLICY "favorites_update_own"
  ON favorites
  FOR UPDATE
  USING     (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. S'assurer que les policies SELECT et DELETE existent
--    (idempotentes — ne modifient rien si elles sont déjà correctes)

DROP POLICY IF EXISTS "favorites: lecture par soi-même"         ON favorites;
DROP POLICY IF EXISTS "Users can view own favorites"             ON favorites;

CREATE POLICY "favorites_select_own"
  ON favorites
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "favorites: suppression par soi-même"     ON favorites;
DROP POLICY IF EXISTS "Users can remove favorites"               ON favorites;

CREATE POLICY "favorites_delete_own"
  ON favorites
  FOR DELETE
  USING (auth.uid() = user_id);

-- ─── Vérification ─────────────────────────────────────────────────────────────
-- À coller dans l'éditeur SQL Supabase pour confirmer :
--
-- SELECT policyname, cmd, qual, with_check
-- FROM   pg_policies
-- WHERE  tablename = 'favorites'
-- ORDER  BY cmd;
--
-- Résultat attendu : 4 lignes (DELETE, INSERT, SELECT, UPDATE)
-- ─────────────────────────────────────────────────────────────────────────────
