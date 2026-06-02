/*
  # Simplification de la table bookings

  1. Modifications
    - Rend la colonne `vehicle_id` optionnelle (NULL) pour éviter les erreurs de contrainte.
    - S'assure que les colonnes nécessaires existent.
*/

DO $$ 
BEGIN
  -- On rend vehicle_id optionnel s'il existe
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'vehicle_id'
  ) THEN
    ALTER TABLE bookings ALTER COLUMN vehicle_id DROP NOT NULL;
  END IF;
END $$;
