/*
  # Correction de la table store_settings

  1. Changements
    - Ajout de la colonne `user_id` liée à `auth.users`
    - Définition de `user_id` comme clé unique pour permettre l'upsert
    - Ajout des colonnes `latitude` et `longitude` en `float8`
    - Mise à jour des politiques RLS pour permettre INSERT/UPDATE
*/

-- 1. Ajout des colonnes si elles n'existent pas
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_settings' AND column_name = 'user_id') THEN
    ALTER TABLE store_settings ADD COLUMN user_id uuid REFERENCES auth.users(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_settings' AND column_name = 'latitude') THEN
    ALTER TABLE store_settings ADD COLUMN latitude float8;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_settings' AND column_name = 'longitude') THEN
    ALTER TABLE store_settings ADD COLUMN longitude float8;
  END IF;
END $$;

-- 2. Rendre user_id unique pour l'upsert (si ce n'est pas déjà la PK)
ALTER TABLE store_settings DROP CONSTRAINT IF EXISTS store_settings_user_id_key;
ALTER TABLE store_settings ADD CONSTRAINT store_settings_user_id_key UNIQUE (user_id);

-- 3. Mise à jour des politiques RLS
DROP POLICY IF EXISTS "Lecture publique des paramètres" ON store_settings;
CREATE POLICY "Lecture publique des paramètres" ON store_settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Gestion par le propriétaire" ON store_settings;
CREATE POLICY "Gestion par le propriétaire" ON store_settings
  FOR ALL 
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
