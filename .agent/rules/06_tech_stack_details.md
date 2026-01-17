# Détails de la Stack Technique - BetaGraph

## 1. Frontend & Core

- **Framework :** Next.js 14 (App Router).
- **Langage :** TypeScript (Strict Mode).
- **Gestion d'état global :** Zustand.
  - **Middleware Persist :** Sauvegarde automatique du store Canvas dans `localStorage`.
  - **Middleware Zundo :** Gestion de l'historique (Undo/Redo).
- **Styling :** Tailwind CSS.
- **Animations :** Framer Motion.
- **Composants UI :** Shadcn/UI, Radix UI.
- **Librairies Créatives :** FancyComponents, EldoraUI (intégration sélective de composants premium).

## 2. Moteur Canvas

- **Bibliothèque :** React-Konva.
- **Logique de rendu :**
  - Stockage des coordonnées en pourcentage (`0-100`).
  - Mapping dynamique basé sur le ratio de l'image source.
  - Lissage des traits via l'attribut `tension` (Courbes de Bézier).

## 3. Backend (BaaS)

- **Fournisseur :** Supabase.
- **Base de données :** PostgreSQL.
- **Authentification :** Supabase Auth (Email/Password + Google).
- **Stockage (Storage) :**
  - Bucket `boulders` : Images originales compressées.
  - Bucket `thumbnails` : Captures du canvas pour les previews OpenGraph.
- **Sécurité :** Politiques RLS (un utilisateur ne peut modifier que ses propres bêtas).

## 4. Pipeline de données

- **Validation :** Zod (Schémas pour `drawing_data` et formulaires).
- **Traitement Image :** `browser-image-compression`.
  - Redimensionnement : Max 1920px (côté long).
  - Format : Conversion forcée en WebP.
  - Qualité : 0.8 (équilibre poids/clarté).

## 5. Environnement de Développement

- **Package Manager :** PNPM ou NPM.
- **Linter/Formatter :** ESLint + Prettier.
- **CI/CD :** Vercel (Déploiement continu).
