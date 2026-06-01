/* 
      1. Ajout de la colonne end_date si elle n'existe pas
      2. S'assure que les types sont corrects pour les dates
    */
    DO $$ 
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'end_date'
      ) THEN
        ALTER TABLE bookings ADD COLUMN end_date date;
      END IF;
    END $$;
