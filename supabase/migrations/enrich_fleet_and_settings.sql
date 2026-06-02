/*
  # Enrichissement du schéma Fleet et Settings

  1. Modifications Table `fleet`
    - Ajout de colonnes techniques : category, transmission, fuel, seats, description, features (jsonb)
  
  2. Mise à jour `store_settings`
    - Support complet des horaires éditables
*/

-- Enrichissement de la table fleet
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fleet' AND column_name = 'category') THEN
    ALTER TABLE fleet 
    ADD COLUMN category text DEFAULT 'Berline',
    ADD COLUMN transmission text DEFAULT 'Automatique',
    ADD COLUMN fuel text DEFAULT 'Électrique',
    ADD COLUMN seats integer DEFAULT 5,
    ADD COLUMN description text,
    ADD COLUMN features jsonb DEFAULT '["GPS", "Bluetooth", "Climatisation"]'::jsonb;
  END IF;
END $$;

-- S'assurer que RLS est correct pour store_settings
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;
