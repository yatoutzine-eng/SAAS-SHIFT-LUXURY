/*
      # Enrichissement de la table Fleet pour le standard Sixt

      1. Modifications
        - Ajout des colonnes techniques : `category`, `transmission`, `fuel`, `seats`, `description`, `features`
      2. Détails
        - `category`: Type de véhicule (Berline, SUV, etc.)
        - `transmission`: Automatique ou Manuelle
        - `fuel`: Type d'énergie
        - `seats`: Nombre de places
        - `features`: Liste des équipements (stockée en JSONB pour plus de flexibilité)
    */

    DO $$ 
    BEGIN
      -- Ajout de category
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fleet' AND column_name = 'category') THEN
        ALTER TABLE fleet ADD COLUMN category text DEFAULT 'Berline';
      END IF;

      -- Ajout de transmission
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fleet' AND column_name = 'transmission') THEN
        ALTER TABLE fleet ADD COLUMN transmission text DEFAULT 'Automatique';
      END IF;

      -- Ajout de fuel
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fleet' AND column_name = 'fuel') THEN
        ALTER TABLE fleet ADD COLUMN fuel text DEFAULT 'Électrique';
      END IF;

      -- Ajout de seats
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fleet' AND column_name = 'seats') THEN
        ALTER TABLE fleet ADD COLUMN seats integer DEFAULT 5;
      END IF;

      -- Ajout de description
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fleet' AND column_name = 'description') THEN
        ALTER TABLE fleet ADD COLUMN description text;
      END IF;

      -- Ajout de features (JSONB pour stocker un tableau d'équipements)
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fleet' AND column_name = 'features') THEN
        ALTER TABLE fleet ADD COLUMN features jsonb DEFAULT '[]'::jsonb;
      END IF;
    END $$;
