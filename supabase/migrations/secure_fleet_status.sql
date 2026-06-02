/*
      # Sécurisation des mises à jour de statut
      
      1. Sécurité
        - Ajout d'une politique RLS pour permettre aux commerçants de modifier uniquement LEUR flotte.
        - Vérification basée sur le `store_code` dans les métadonnées de l'utilisateur.
    */

    -- Politique pour permettre la mise à jour du statut par le propriétaire
    CREATE POLICY "Les commerçants peuvent modifier leur propre flotte"
      ON fleet
      FOR UPDATE
      TO authenticated
      USING (store_code = (auth.jwt() -> 'user_metadata' ->> 'store_code'))
      WITH CHECK (store_code = (auth.jwt() -> 'user_metadata' ->> 'store_code'));
