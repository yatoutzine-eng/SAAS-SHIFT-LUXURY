/*
      # Mise à jour des politiques RLS pour store_settings

      1. Sécurité
        - Permettre la lecture publique des noms et coordonnées (pour la carte client)
        - Permettre aux commerçants de modifier uniquement leurs propres paramètres
    */

    -- On s'assure que la lecture est publique pour la carte
    DROP POLICY IF EXISTS "Allow public read access for store settings" ON store_settings;
    CREATE POLICY "Allow public read access for store settings"
      ON store_settings
      FOR SELECT
      TO public
      USING (true);

    -- On permet aux commerçants de modifier leur propre ligne
    DROP POLICY IF EXISTS "Allow vendors to update their own store settings" ON store_settings;
    CREATE POLICY "Allow vendors to update their own store settings"
      ON store_settings
      FOR UPDATE
      TO authenticated
      USING (auth.jwt() -> 'user_metadata' ->> 'store_code' = store_code)
      WITH CHECK (auth.jwt() -> 'user_metadata' ->> 'store_code' = store_code);
