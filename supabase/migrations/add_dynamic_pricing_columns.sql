/*
  # Ajout des colonnes de tarification dynamique
  
  1. Modifications
    - Ajout de `dynamic_pricing_enabled` (boolean)
    - Ajout de `weekend_markup` (integer)
  
  2. Sécurité
    - Les politiques RLS existantes couvrent déjà ces nouvelles colonnes
*/

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_settings' AND column_name = 'dynamic_pricing_enabled') THEN
    ALTER TABLE public.store_settings ADD COLUMN dynamic_pricing_enabled boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_settings' AND column_name = 'weekend_markup') THEN
    ALTER TABLE public.store_settings ADD COLUMN weekend_markup integer DEFAULT 25;
  END IF;
END $$;
