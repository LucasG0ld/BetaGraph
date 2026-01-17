# Parcours Utilisateurs (Userflows)

## Flow 1 : Création d'une Bêta complète

1. **Entrée :** L'utilisateur clique sur le bouton "+" (Créer).
2. **Source :** Choix d'une image (Galerie ou Caméra).
3. **Optimisation :** L'app compresse l'image, l'affiche dans le Canvas.
4. **Réglages Initiaux :** L'utilisateur définit le nom et la cotation (ex: 7A).
5. **Dessin :**
   - Sélection de l'outil "Main" (Couleur Verte par défaut).
   - Tracé du mouvement entre les prises.
   - Sélection de l'outil "Cercle" pour marquer la prise de départ.
6. **Sauvegarde :** Clic sur "Publier".
   - _Back-end :_ Upload de l'image + Enregistrement du JSON `drawing_data`.
7. **Partage :** L'utilisateur reçoit un lien court et une option "Partager sur Instagram".

## Flow 2 : Modification d'une Bêta existante (Persistance)

1. **Action :** L'utilisateur ouvre une bêta qu'il a commencée hier mais n'a pas fini de tracer.
2. **Récupération :** Zustand charge les données depuis le `localStorage`.
3. **Édition :** Ajout de nouveaux traits.
4. **Mise à jour :** Les modifications sont écrasées sur Supabase.

## Flow 3 : Consultation et Changement de Cotation

1. **Réception :** Un ami reçoit un lien de bêta.
2. **Affichage :** La bêta s'affiche. L'ami voit la cotation en "V-Scale" car c'est sa préférence enregistrée.
3. **Interaction :** L'ami peut masquer/afficher certains calques de dessin (ex: masquer les pieds) pour mieux voir l'image.

## Flow 4 : Gestion des paramètres

1. **Accès :** Menu "Réglages".
2. **Action :** Bascule du système de cotation de "Fontainebleau" vers "V-Scale".
3. **Résultat :** Toutes les cotations affichées dans l'application sont converties ou mises à jour selon le nouveau référentiel.
