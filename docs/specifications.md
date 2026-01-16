# Cahier des Charges Fonctionnel - BetaGraph

## 1. Gestion des Utilisateurs et Préférences
- **Auth :** Inscription, connexion et réinitialisation de mot de passe.
- **Profil :** 
    - Choix du système de cotation par défaut (Fontainebleau vs V-Scale).
    - Historique des bêtas créées.
- **Persistance :** Le système doit sauvegarder l'état du canvas toutes les 5 secondes localement.

## 2. Gestion des Blocs (Boulders)
- **Importation :** Upload d'une photo ou capture directe.
- **Métadonnées :**
    - Nom du bloc.
    - Lieu / Salle d'escalade.
    - Cotation (basée sur le système choisi dans les réglages).
- **Stockage :** Seules les images optimisées (WebP) sont stockées pour économiser la bande passante.

## 3. L'Éditeur de Bêta (The Drawing Engine)
- **Outils de dessin :**
    - **Pinceau (Main levée) :** Pour tracer les trajectoires de mouvement.
    - **Formes (Holds) :** Cercles ou polygones pour entourer les prises.
    - **Couleurs :** Palette prédéfinie (Mains, Pieds, Prise d'arrivée) + Sélecteur de couleur libre.
- **Interface Mobile :**
    - Mode "Plein Écran" activable pour verrouiller le scroll de la page.
    - Toolbar rétractable pour maximiser l'espace de dessin.
- **Édition :**
    - Possibilité de supprimer un trait spécifique (Calques).
    - Boutons Undo (Annuler) et Redo (Rétablir).

## 4. Partage et Social
- **Visionneuse Publique :** Page optimisée pour la consultation sans compte nécessaire.
- **Génération de Preview :** Création d'une image "snapshot" fusionnant la photo et le dessin pour le partage sur les réseaux sociaux.
- **OpenGraph :** Tags dynamiques pour que l'image de la bêta s'affiche correctement lors du partage du lien.

## 5. Spécifications Techniques & Performance
- **Temps de chargement :** Image de fond chargée en priorité via `next/image` ou optimisation Konva.
- **Accessibilité :** Interface contrastée, support du clavier pour les raccourcis d'édition (Undo/Redo).
- **Offline-ish :** Permettre le dessin même sans connexion, avec synchronisation lors du retour du réseau.