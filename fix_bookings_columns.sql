/*
      # Ajout des coordonnées géographiques aux agences

      1. Modifications Table `store_settings`
        - Ajout de `latitude` (float8)
        - Ajout de `longitude` (float8)
      2. Données de test
        - Mise à jour de l'agence par défaut avec des coordonnées sur Paris
    */

    DO $$ 
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_settings' AND column_name = 'latitude') THEN
        ALTER TABLE store_settings ADD COLUMN latitude float8;
      END IF;
      
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_settings' AND column_name = 'longitude') THEN
        ALTER TABLE store_settings ADD COLUMN longitude float8;
      END IF;
    END $$;

    -- Mise à jour d'exemple pour le store 'demo' s'il existe
    UPDATE store_settings 
    SET latitude = 48.8566, longitude = 2.3522 
    WHERE store_code = 'demo';
