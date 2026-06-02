/*
  # Mise à jour du schéma store_settings
  
  1. Nouvelles Colonnes
    - `concierge_phone` (text) : Numéro direct pour le service client
    - `dynamic_pricing_enabled` (boolean) : Activation de la tarification dynamique
    - `weekend_markup` (integer) : Pourcentage de majoration
  
  2. Sécurité
    - Maintien du RLS existant
*/

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_settings' AND column_name = 'concierge_phone') THEN
    ALTER TABLE public.store_settings ADD COLUMN concierge_phone text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_settings' AND column_name = 'dynamic_pricing_enabled') THEN
    ALTER TABLE public.store_settings ADD COLUMN dynamic_pricing_enabled boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_settings' AND column_name = 'weekend_markup') THEN
    ALTER TABLE public.store_settings ADD COLUMN weekend_markup integer DEFAULT 25;
  END IF;
END $$;
