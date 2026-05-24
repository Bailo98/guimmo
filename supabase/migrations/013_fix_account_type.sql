-- ============================================================
-- LogerBien — Migration 013 : corriger account_type depuis role
-- À exécuter dans Supabase Dashboard → SQL Editor
-- ============================================================

-- Migration 011 a ajouté account_type avec DEFAULT 'chercheur',
-- ce qui a assigné 'chercheur' à tous les utilisateurs existants,
-- y compris les agents/agences/propriétaires.
-- Ce script corrige account_type d'après role pour les profils affectés.

UPDATE profiles
SET account_type = CASE
  WHEN role IN ('proprietaire', 'owner') THEN 'proprietaire'
  WHEN role = 'agent'                    THEN 'agent'
  WHEN role IN ('agence', 'agency')      THEN 'agence'
  ELSE 'chercheur'
END
WHERE account_type IS NULL
   OR (account_type = 'chercheur' AND role IN ('proprietaire', 'owner', 'agent', 'agence', 'agency'));

-- Ajout de la contrainte anti auto-messagerie (idempotent)
ALTER TABLE messages
  DROP CONSTRAINT IF EXISTS no_self_message;

ALTER TABLE messages
  ADD CONSTRAINT no_self_message CHECK (sender_id <> receiver_id);

-- Vérification (décommenter pour contrôler le résultat)
-- SELECT role, account_type, COUNT(*) FROM profiles GROUP BY role, account_type ORDER BY role;
