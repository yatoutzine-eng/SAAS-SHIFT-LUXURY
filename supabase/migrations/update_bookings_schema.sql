/*
      # Mise à jour du schéma des réservations
      
      1. Changements
        - Ajout des colonnes `start_date` (date de début)
        - Ajout des colonnes `end_date` (date de fin)
        - Ajout de `total_price` (prix total)
        - Ajout de `user_id` pour lier à l'utilisateur authentifié
      
      2. Sécurité
        - RLS pour permettre aux utilisateurs de voir leurs propres réservations
    */

    ALTER TABLE bookings 
    ADD COLUMN IF NOT EXISTS start_date date,
    ADD COLUMN IF NOT EXISTS end_date date,
    ADD COLUMN IF NOT EXISTS total_price numeric,
    ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

    -- Politique pour que les utilisateurs voient leurs propres réservations
    CREATE POLICY "Users can view own bookings" 
      ON bookings FOR SELECT 
      TO authenticated 
      USING (auth.uid() = user_id);
