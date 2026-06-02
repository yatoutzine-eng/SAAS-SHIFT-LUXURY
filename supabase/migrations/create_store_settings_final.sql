/*
  # Création de la table store_settings
  
  1. Table
    - `user_id` (uuid, primary key) : Lié à auth.users
    - `store_code` (text) : Code unique de l'agence
    - `shop_name` (text) : Nom commercial
    - `phone` (text)
    - `address` (text)
    - `latitude` (float8)
    - `longitude` (float8)
    - `rental_conditions` (text)
    - `min_age` (int)
    - `opening_hours` (jsonb)
    - `updated_at` (timestamptz)

  2. Sécurité
    - RLS activé
    - Lecture publique autorisée
    - Gestion totale pour le propriétaire (user_id)
*/

-- Création de la table si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.store_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  store_code text UNIQUE NOT NULL,
  shop_name text,
  phone text,
  address text,
  latitude float8,
  longitude float8,
  rental_conditions text,
  min_age integer DEFAULT 21,
  opening_hours jsonb DEFAULT '{"mon": "09:00-18:00", "tue": "09:00-18:00", "wed": "09:00-18:00", "thu": "09:00-18:00", "fri": "09:00-18:00", "sat": "10:00-16:00", "sun": "Fermé"}'::jsonb,
  updated_at timestamptz DEFAULT now()
);

-- Activation de la sécurité
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- Politique de lecture publique
DROP POLICY IF EXISTS "Public read access" ON public.store_settings;
CREATE POLICY "Public read access" ON public.store_settings
  FOR SELECT USING (true);

-- Politique de gestion par le propriétaire
DROP POLICY IF EXISTS "Owner management" ON public.store_settings;
CREATE POLICY "Owner management" ON public.store_settings
  FOR ALL 
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
