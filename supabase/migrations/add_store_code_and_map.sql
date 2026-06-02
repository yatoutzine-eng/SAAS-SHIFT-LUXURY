/*
  1. Nouvelles Colonnes
    - `store_code` (text, unique) : Identifiant public du vendeur
  
  2. Sécurité
    - Index unique sur store_code pour éviter les doublons
*/

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_settings' AND column_name = 'store_code') THEN
    ALTER TABLE public.store_settings ADD COLUMN store_code text UNIQUE;
  END IF;
END $$;

-- Création d'un index pour la recherche rapide par code boutique
CREATE UNIQUE INDEX IF NOT EXISTS idx_store_settings_store_code ON public.store_settings(store_code);
