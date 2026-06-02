/*
      # Alignement final de la table bookings
      
      1. Changements
        - Renommage de `vehicle_id` en `car_id` pour correspondre à la demande
        - Renommage de `user_id` en `customer_id` pour correspondre à la demande
        - Ajout des colonnes de dates et prix si manquantes
    */

    DO $$ 
    BEGIN
      -- Renommage vehicle_id -> car_id
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'vehicle_id') THEN
        ALTER TABLE bookings RENAME COLUMN vehicle_id TO car_id;
      END IF;

      -- Renommage user_id -> customer_id
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'user_id') THEN
        ALTER TABLE bookings RENAME COLUMN user_id TO customer_id;
      END IF;

      -- Vérification des autres colonnes
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'start_date') THEN
        ALTER TABLE bookings ADD COLUMN start_date date;
      END IF;

      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'end_date') THEN
        ALTER TABLE bookings ADD COLUMN end_date date;
      END IF;

      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'total_price') THEN
        ALTER TABLE bookings ADD COLUMN total_price numeric;
      END IF;

      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'store_code') THEN
        ALTER TABLE bookings ADD COLUMN store_code text;
      END IF;
    END $$;
