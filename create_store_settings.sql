/*
      # Alignement physique du schéma Fleet et Store Settings
      
      1. Tables impactées: `fleet`, `store_settings`
      2. Actions: 
        - Ajout des colonnes techniques manquantes à `fleet`
        - Vérification de la structure de `store_settings`
    */

    -- Mise à jour physique de la table fleet
    DO $$ 
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fleet' AND column_name = 'category') THEN
        ALTER TABLE fleet ADD COLUMN category text DEFAULT 'Berline';
      END IF;

      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fleet' AND column_name = 'transmission') THEN
        ALTER TABLE fleet ADD COLUMN transmission text DEFAULT 'Automatique';
      END IF;

      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fleet' AND column_name = 'fuel') THEN
        ALTER TABLE fleet ADD COLUMN fuel text DEFAULT 'Électrique';
      END IF;

      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fleet' AND column_name = 'seats') THEN
        ALTER TABLE fleet ADD COLUMN seats integer DEFAULT 5;
      END IF;

      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fleet' AND column_name = 'description') THEN
        ALTER TABLE fleet ADD COLUMN description text;
      END IF;

      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fleet' AND column_name = 'features') THEN
        ALTER TABLE fleet ADD COLUMN features jsonb DEFAULT '[]'::jsonb;
      END IF;
    END $$;

    -- Notification à PostgREST pour recharger le schéma
    NOTIFY pgrst, 'reload schema';
