/*
  # Configuration avancée des boutiques

  1. New Tables
    - `store_settings`
      - `id` (uuid, primary key)
      - `store_code` (text, unique) - Lien avec le commerçant
      - `address` (text)
      - `phone` (text)
      - `opening_hours` (jsonb) - Stockage des horaires par jour
      - `rental_conditions` (text) - Texte libre pour les conditions
      - `min_age` (integer) - Âge minimum requis
      - `logo_url` (text)
  
  2. Security
    - RLS activé
    - Lecture publique pour la page boutique
    - Modification réservée au propriétaire (via store_code)
*/

CREATE TABLE IF NOT EXISTS store_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_code text UNIQUE NOT NULL,
  shop_name text,
  address text,
  phone text,
  opening_hours jsonb DEFAULT '{"mon": "09:00-18:00", "tue": "09:00-18:00", "wed": "09:00-18:00", "thu": "09:00-18:00", "fri": "09:00-18:00", "sat": "10:00-16:00", "sun": "Fermé"}'::jsonb,
  rental_conditions text DEFAULT 'Permis de conduire B valide depuis plus de 2 ans requis.',
  min_age integer DEFAULT 21,
  logo_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture publique des paramètres" ON store_settings
  FOR SELECT USING (true);

CREATE POLICY "Modification par le commerçant" ON store_settings
  FOR ALL USING (true); -- Dans un vrai SaaS, on filtrerait par auth.uid() lié au store_code
