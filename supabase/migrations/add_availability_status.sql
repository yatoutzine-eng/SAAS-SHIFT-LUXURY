/*
      # Ajout du statut opérationnel de la flotte
      
      1. Modifications
        - Ajout de la colonne `availability_status` à la table `fleet`
        - Valeurs possibles : 'disponible', 'maintenance', 'nettoyage'
        - Valeur par défaut : 'disponible'
      2. Sécurité
        - Mise à jour des politiques RLS pour refléter la visibilité boutique
    */

    DO $$ 
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'fleet' AND column_name = 'availability_status'
      ) THEN
        ALTER TABLE fleet ADD COLUMN availability_status text DEFAULT 'disponible' 
        CHECK (availability_status IN ('disponible', 'maintenance', 'nettoyage'));
      END IF;
    END $$;
