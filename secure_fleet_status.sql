/*
      # Correction finale de la table bookings et RLS
      
      1. Tables
        - Assure que `bookings` a toutes les colonnes requises avec les bons types.
        - Gère les renommages si nécessaire (vehicle_id -> car_id, user_id -> customer_id).
      
      2. Sécurité
        - Active RLS.
        - Ajoute une politique d'insertion pour les utilisateurs connectés.
        - Ajoute une politique de lecture pour que l'utilisateur voie ses propres réservations.
    */

    -- 1. Vérification et mise à jour des colonnes
    DO $$ 
    BEGIN
      -- Création de la table si elle n'existe pas (sécurité)
      CREATE TABLE IF NOT EXISTS bookings (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at timestamptz DEFAULT now()
      );

      -- car_id (UUID)
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'car_id') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'vehicle_id') THEN
          ALTER TABLE bookings RENAME COLUMN vehicle_id TO car_id;
        ELSE
          ALTER TABLE bookings ADD COLUMN car_id uuid REFERENCES fleet(id);
        END IF;
      END IF;

      -- customer_id (UUID)
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'customer_id') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'user_id') THEN
          ALTER TABLE bookings RENAME COLUMN user_id TO customer_id;
        ELSE
          ALTER TABLE bookings ADD COLUMN customer_id uuid REFERENCES auth.users(id);
        END IF;
      END IF;

      -- customer_name (TEXT)
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'customer_name') THEN
        ALTER TABLE bookings ADD COLUMN customer_name text;
      END IF;

      -- store_code (TEXT)
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'store_code') THEN
        ALTER TABLE bookings ADD COLUMN store_code text;
      END IF;

      -- start_date (DATE)
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'start_date') THEN
        ALTER TABLE bookings ADD COLUMN start_date date;
      END IF;

      -- end_date (DATE)
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'end_date') THEN
        ALTER TABLE bookings ADD COLUMN end_date date;
      END IF;

      -- total_price (NUMERIC)
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'total_price') THEN
        ALTER TABLE bookings ADD COLUMN total_price numeric;
      END IF;

      -- status (TEXT)
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'status') THEN
        ALTER TABLE bookings ADD COLUMN status text DEFAULT 'confirmed';
      END IF;
    END $$;

    -- 2. Configuration RLS
    ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

    -- Supprimer les anciennes politiques pour éviter les doublons
    DROP POLICY IF EXISTS "Users can insert own bookings" ON bookings;
    DROP POLICY IF EXISTS "Users can view own bookings" ON bookings;
    DROP POLICY IF EXISTS "Admins can view all bookings" ON bookings;

    -- Politique d'insertion : Tout utilisateur connecté peut créer une réservation
    CREATE POLICY "Users can insert own bookings" 
      ON bookings FOR INSERT 
      TO authenticated 
      WITH CHECK (auth.uid() = customer_id);

    -- Politique de lecture : L'utilisateur voit ses réservations
    CREATE POLICY "Users can view own bookings" 
      ON bookings FOR SELECT 
      TO authenticated 
      USING (auth.uid() = customer_id);
