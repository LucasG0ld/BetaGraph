# TODO - BetaGraph

> **Statut :** Document de référence - Source de vérité pour le développement itératif  
> **Dernière mise à jour :** 2026-01-19  
> **Conventions :** `[ ]` Non commencé | `[/]` En cours | `[x]` Terminé

---

## Phase 1 : Infrastructure & Arborescence

### 1.1 - Initialisation du Projet

- [x] Créer le projet Next.js 15 (App Router) avec TypeScript strict
- [x] Configurer PNPM/NPM workspace
- [x] Initialiser Git avec `.gitignore` complet
- [x] Créer `.env.example` avec structure pour Supabase

### 1.2 - Configuration de l'Environnement

- [x] Configurer ESLint + Prettier
- [x] Ajouter Husky (pre-commit hook pour lint)
- [x] Configurer `tsconfig.json` (strict mode, path aliases `@/*`)
- [x] Créer `tailwind.config.ts` avec tokens de Design System

### 1.3 - Arborescence Feature-Based

- [x] Créer `src/features/auth/`
- [x] Créer `src/features/boulder/`
- [x] Créer `src/features/canvas/`
- [x] Créer `src/features/grading/`
- [x] Créer `src/features/share/`
- [x] Créer `src/components/ui/` (Shadcn/UI)
- [x] Créer `src/components/vendor/` (Copy-paste components)
- [x] Créer `src/lib/` (Utilities, Zod schemas, Supabase clients)
- [x] Créer `src/hooks/` (Hooks partagés)
- [x] Créer `src/constants/` (Grading tables, color presets)

### 1.4 - Installation des Dépendances Core

- [x] Installer Next.js, React, TypeScript
- [x] Installer Tailwind CSS + PostCSS
- [x] Installer Zustand + Middleware (persist, zundo)
- [x] Installer Zod
- [x] Installer React-Konva + Konva
- [x] Installer Framer Motion
- [x] Installer @supabase/ssr
- [x] Installer browser-image-compression
- [x] Installer blueimp-load-image (EXIF normalization)
- [x] Installer simplify-js (Path simplification)
- [x] Installer @use-gesture/react (Mobile gestures)
- [x] Installer clsx + tailwind-merge (cn utility)

### ✅ Validation Phase 1

- [x] `npm run lint` → Pas d'erreur
- [x] `npm run build` → Build réussi
- [x] Structure des dossiers conforme à `02_structural_rules.md`

---

## Phase 2 : Sécurité & Auth (RLS First)

### 2.1 - Configuration Supabase

- [x] Créer le projet Supabase
- [x] Ajouter les variables d'env dans `.env.local` et `.env.example`
- [x] Créer le client Supabase SSR (`src/lib/supabase/server.ts`)
- [x] Créer le client Supabase Client (`src/lib/supabase/client.ts`)
- [x] Créer middleware Next.js pour refresh des tokens
- [x] Créer validateur Zod pour ENV (`src/lib/env.ts`)

### 2.2 - Schema Database (Migrations SQL)

```sql
-- ✅ IMPLÉMENTÉ (Modèle 2 Tables: boulders + betas)

-- Table: profiles
- [x] id (uuid, ref auth.users)
- [x] username (text, unique)
- [x] preferred_grading_system (enum: 'fontainebleau' | 'v_scale')
- [x] created_at (timestamp)

-- Table: boulders (Images de blocs physiques)
- [x] id (uuid, pk)
- [x] creator_id (uuid, fk → profiles) -- Nullable (SET NULL on delete)
- [x] name (text)
- [x] location (text, nullable)
- [x] image_url (text) -- URL vers Storage
- [x] deleted_at (timestamp, nullable) -- Soft delete
- [x] created_at (timestamp)

-- Table: betas (Tracés utilisateur sur boulders)
- [x] id (uuid, pk)
- [x] boulder_id (uuid, fk → boulders) -- CASCADE on delete
- [x] user_id (uuid, fk → profiles) -- CASCADE on delete
- [x] grade_value (text) -- Cotation (ex: "7A")
- [x] grade_system (enum: 'fontainebleau' | 'v_scale')
- [x] drawing_data (jsonb) -- Schéma Konva
- [x] is_public (boolean, default false)
- [x] created_at (timestamp)
- [x] updated_at (timestamp) -- Auto-updated via trigger

-- Buckets Storage:
- [x] boulders (Privé par défaut, RLS)
- [x] thumbnails (Public pour OpenGraph)

-- Triggers:
- [x] update_betas_updated_at (auto-update updated_at)

-- Documentation:
- [x] docs/database/schema.md (ERD Mermaid + examples)
- [x] migrations/001_initial_schema.sql
- [x] migrations/002_storage_buckets.sql
```

### 2.3 - Politiques RLS (Row Level Security)

```sql
-- ✅ IMPLÉMENTÉ (migrations/003_rls_policies.sql)

-- Trigger automatique de création de profil
- [x] handle_new_user() : Créer profil lors inscription (SECURITY DEFINER)
- [x] on_auth_user_created : Trigger AFTER INSERT sur auth.users

-- Politiques RLS Tables
- [x] Politique `profiles` : SELECT → Public / INSERT, UPDATE → Own only
- [x] Politique `boulders` : SELECT → Actifs (deleted_at IS NULL)
- [x] Politique `boulders` : INSERT, UPDATE, DELETE → Own only
- [x] Politique `betas` : SELECT → Public (si boulder actif) OU Own
- [x] Politique `betas` : INSERT, UPDATE, DELETE → Own only

-- Politiques RLS Storage
- [x] Storage `boulders` : SELECT → Via subquery (si beta publique OU own)
- [x] Storage `boulders` : INSERT, UPDATE → Own folder ({user_id}/)
- [x] Storage `boulders` : DELETE → Si pas de boulder référençant
- [x] Storage `thumbnails` : SELECT → Public (anonymous OK)
- [x] Storage `thumbnails` : INSERT, UPDATE, DELETE → Authenticated
```

### 2.4 - Tests d'Intégration RLS

```bash
# ✅ IMPLÉMENTÉ (supabase/tests/rls_test.sql)

# Infrastructure
- [x] Installer Supabase CLI (guide: docs/testing/supabase-cli-setup.md)
- [x] Initialiser dossier `supabase/tests/`

# Tests pgTAP (10 tests total)
- [x] Test 1.1-1.2 : Boulder soft-deleted invisible (anonymous & authenticated)
- [x] Test 2.1 : User ne peut pas lire beta privée d'autrui
- [x] Test 2.2 : User ne peut pas modifier beta d'autrui
- [x] Test 2.3 : User peut modifier sa propre beta
- [x] Test 3.1 : Anonymous peut lire beta publique
- [x] Test 3.2 : Anonymous ne peut pas lire beta privée
- [x] Test 4.1-4.3 : Trigger profil fonctionne (auto-création)

# Exécution
# Commande: supabase test db
# Statut: Prêt à être exécuté après `supabase start`
```

### 2.5 - Feature Auth UI

```typescript
// ✅ IMPLÉMENTÉ  

// Composants UI de base (src/components/ui/)
- [x] Button (primary, secondary, ghost + loading)
- [x] Input (avec error state + focus cyan)
- [x] Label (sémantique HTML)
- [x] utils.ts (fonction cn pour merge Tailwind classes)

// Logique Auth (src/features/auth/)
- [x] Schémas Zod (authSchema: email + password + username optionnel)
- [x] Server Actions (signIn, signUp avec redirect)
- [x] Passage username dans options.data (trigger SQL profil)

// Composants Auth
- [x] AuthLayout (gradient bg + Framer Motion + glow border)
- [x] SignInForm (react-hook-form + Zod + loading)
- [x] SignUpForm (avec champ username optionnel)

// Pages Next.js (app/(auth)/)
- [x] login/page.tsx
- [x] register/page.tsx  
- [x] layout.tsx (route group)

// Validation
- [x] npm run typecheck (0 erreurs)
- [x] Dark mode forcé (brand.black)
- [x] Exports nommés uniquement
```

### ✅ Validation Phase 2

```bash
# Phase 2 - Security & Auth : 100% TERMINÉE

# 2.1 - Configuration Supabase
- [x] Variables ENV validées (Zod)
- [x] Clients Supabase (server, client, middleware)
- [x] SUPABASE_SERVICE_ROLE_KEY obligatoire

# 2.2 - Schema Database  
- [x] Tables : profiles, boulders, betas
- [x] Soft delete sur boulders
- [x] Storage buckets : boulders, thumbnails
- [x] Triggers updated_at
- [x] Documentation schema.md

# 2.3 - Politiques RLS
- [x] RLS tables (profiles, boulders, betas)
- [x] RLS Storage (boulders, thumbnails)
- [x] Trigger profil automatique
- [x] Structure folder {user_id}/

# 2.4 - Tests RLS
- [x] Tests pgTAP (10/10 passés)
- [x] Validation soft-delete
- [x] Validation ownership
- [x] Validation anonymous access
- [x] Documentation Supabase CLI

# 2.5 - Auth UI
- [x] Composants UI (Button, Input, Label)
- [x] Schémas Zod validation
- [x] Server Actions (signIn, signUp)
- [x] Pages /login et /register
- [x] Design high-tech lab validé
- [x] Flow complet testé (inscription → login)

# Validation Finale
- [x] Typecheck : 0 erreurs
- [x] Tests automatisés : 10/10
- [x] Tests manuels : Flow auth fonctionnel
- [x] Trigger SQL profil : Fonctionne ✅
- [x] RLS policies : Validées ✅
- [x] Design UI : Conforme ✅
```

---

## Phase 3 : Pipeline de Traitement d'Image (EXIF/WebP)

### 3.1 - Schéma Zod pour Validation Image

- [x] Créer `src/lib/schemas/image.schema.ts`
- [x] Définir `ImageUploadSchema` (type, size max 15MB, formats JPEG/PNG/WebP/HEIC)
- [x] Définir `ProcessedImageSchema` (blob, width, height, aspectRatio, format, size, orientation)

### 3.2 - Utilitaire de Normalisation EXIF

- [x] Créer `src/lib/utils/image/normalize-orientation.ts`
- [x] Utiliser `blueimp-load-image` pour lire EXIF
- [x] Retourner un Blob avec orientation corrigée (rotation appliquée)
- [x] Gérer les cas : Portrait (90°), Landscape inversé (180°), etc.

### 3.3 - Utilitaire de Compression WebP

- [x] Créer `src/lib/utils/image/compress-image.ts`
- [x] Utiliser `browser-image-compression` avec options :
  - `maxSizeMB: 2`
  - `maxWidthOrHeight: 1920`
  - `useWebWorker: true`
  - `fileType: 'image/webp'`
  - `initialQuality: 0.8`
- [x] Retourner Blob WebP optimisé

### 3.4 - Pipeline Complet (Orchestration)

- [x] Créer `src/lib/utils/image/process-image.ts`
- [x] Orchestrer : Validation (3.1) → Normalisation (3.2) → Compression (3.3)
- [x] Retourner `ProcessedImage` conforme au schéma Zod
- [x] Modifier `image.schema.ts` : format enum `['webp', 'jpeg']`

### 3.5 - Upload vers Supabase Storage

- [x] Créer `src/lib/supabase/storage.ts`
- [x] Générer un nom de fichier unique (UUID v4)
- [x] Upload vers bucket `boulders` avec path `userId/uuid.{format}`
- [x] Retourner l'URL publique

### 3.6 - Hook d'Upload Complet

- [x] Créer `src/features/boulder/hooks/useImageUpload.ts`
- [x] États : `isProcessing`, `isUploading`, `error`, `imageUrl`, `imageData`
- [x] Appeler pipeline complet : Process → Upload → Retourner URL
- [x] Gestion d'erreur avec messages utilisateur

### ✅ Validation Phase 3 - TERMINÉ

- [x] Test : Upload portrait (EXIF 1) → Aucune rotation (correct)
- [x] Test : Compression → 0.13 Mo (bien sous 2 Mo)
- [x] Test : Upload JPEG → Conversion WebP confirmée
- [x] Test : PDF invalide → Message erreur FR affiché
- [x] `npm run build` → Pas d'erreur
- [x] `npm run test` → 51 tests passent (7 skipped)

---

## Phase 4 : Moteur Canvas (Maths & Coordonnées Relatives)

### 4.1 - Schéma Zod pour Drawing Data ✅

```typescript
// ✅ IMPLÉMENTÉ (src/lib/schemas/drawing.schema.ts)

// Règle d'Or : Toutes les coordonnées en % (0-100), relatives à l'image
// width & radius normalisés par rapport à la LARGEUR de l'image

- [x] PointSchema : { x: 0-100, y: 0-100 }
- [x] LineToolSchema : 'brush' | 'eraser'
- [x] LineSchema : { id, tool, points, color (#RRGGBB), width (% largeur) }
- [x] CircleSchema : { id, type: 'circle', center, radius (% largeur), color }
- [x] ShapeSchema : Discriminated Union par 'type' (extensible)
- [x] DrawingDataSchema : { version, lines, shapes }
- [x] createEmptyDrawingData() : Factory function
- [x] Types inférés exportés : Point, Line, LineTool, Circle, Shape, DrawingData
```

### 4.2 - Zustand Store Canvas ✅

```typescript
// ✅ IMPLÉMENTÉ (src/features/canvas/store/canvasStore.ts)

// Architecture : État UI séparé des Données métier
// - UI (non persisté) : currentTool, currentColor, currentWidth, currentLine, isDrawing
// - Données (persisté + undo) : drawingData

// Middlewares configurés :
- [x] temporal (zundo) : Historique undo/redo (limit: 50 états)
- [x] persist : Sauvegarde localStorage (clé: 'betagraph-canvas-draft')
- [x] partialize : Seul drawingData est suivi/persisté

// Actions implémentées :
- [x] setTool() / setColor() / setWidth()
- [x] startLine() / updateCurrentLine() / finalizeLine() / cancelLine()
- [x] addShape() : Ajoute cercle avec ID auto (nanoid)
- [x] removeElement(id) : Suppression ciblée ligne ou forme
- [x] clearCanvas() : Réinitialise le dessin
- [x] resetStore() : Réinitialise tout le store
- [x] loadDrawingData() : Charge données externes (Supabase)

// Hooks exportés :
- [x] useCanvasStore : Hook principal
- [x] useCanvasHistory() : Accès undo/redo via zundo
- [x] generateElementId() : Génération ID (nanoid)
```

### 4.3 - Utilitaire de Calcul de Ratio (Responsive Canvas) ✅

```typescript
// ✅ IMPLÉMENTÉ (src/features/canvas/utils/canvas-math.ts)

// Comportement object-fit: contain
// scale = min(containerWidth/imageWidth, containerHeight/imageHeight)

- [x] Interface Dimensions : { width, height }
- [x] Interface CanvasLayout : scale, stageWidth, stageHeight, scaledWidth, scaledHeight, offsetX, offsetY
- [x] calculateCanvasLayout(container, image) : Calcul layout complet
- [x] isPointInsideImage(stageX, stageY, layout) : Détection clic hors image
- [x] calculateAspectRatio(width, height) : Ratio largeur/hauteur
```

### 4.4 - Utilitaire de Conversion Coordonnées ✅

```typescript
// ✅ IMPLÉMENTÉ (src/features/canvas/utils/coords-converter.ts)

// Précision : 3 décimales (±0.04px sur 4K)
// Clamping : 0-100 automatique

- [x] stageToRelative(stageX, stageY, layout, imageW, imageH) → Point (0-100)
- [x] relativeToStage(relX, relY, layout, imageW, imageH) → { x, y } (pixels)
- [x] flatPointsToRelative(flatPoints, ...) → Point[] (conversion array Konva)
- [x] relativePointsToFlat(points, ...) → number[] (pour <Line points={} />)
- [x] relativeWidthToStage() : Épaisseur % → pixels
- [x] relativeRadiusToStage() : Rayon % → pixels
```

### 4.5 - Utilitaire de Simplification de Tracés ✅

```typescript
// ✅ IMPLÉMENTÉ (src/features/canvas/utils/simplify-path.ts)

// Algorithme Douglas-Peucker via simplify-js
// Réduction typique : 60-80% des points

- [x] simplifyPath(points, tolerance?) → Point[] simplifié
- [x] simplifyFlatPath(flatPoints, tolerance?) → number[] simplifié
- [x] simplifyPathWithStats() → Points + ratio de réduction
- [x] calculateReductionRatio() → % de réduction
- [x] Constantes : TOLERANCE_PERCENT (0.15), TOLERANCE_PIXELS (1.5)
```

### 4.6 - Composant Canvas Principal ✅

```typescript
// ✅ IMPLÉMENTÉ (src/features/canvas/components/DrawingCanvas.tsx)

// 'use client' - Composant client React-Konva
// Responsive via ResizeObserver (debounced 100ms)

// Hooks créés :
- [x] useImage(url) : Chargement HTMLImageElement pour Konva
- [x] useContainerSize(ref) : Mesure conteneur avec debounce

// Composants mémoïsés :
- [x] LineRenderer : Rendu optimisé d'une ligne
- [x] CircleRenderer : Rendu optimisé d'un cercle

// Rendu :
- [x] <Stage> + 2 <Layer> (image / dessin)
- [x] Image de fond centrée (offset calculé)
- [x] Lignes finalisées (drawingData.lines)
- [x] Formes (drawingData.shapes)
- [x] Tracé en cours (currentLine temps réel)
- [x] Conversion relative → Stage via utilitaires 4.4
```

### 4.7 - Gestion des Events de Dessin ✅

```typescript
// ✅ IMPLÉMENTÉ (src/features/canvas/hooks/useCanvasDrawing.ts)

// Handlers intégrés sur <Stage> : onPointerDown/Move/Up/Leave
// Throttle via rAF (60fps max)
// Simplification automatique dans finalizeLine()

- [x] useCanvasDrawing hook créé (logique extraite du composant)
- [x] handlePointerDown : Vérifie isPointInsideImage, démarre tracé/cercle
- [x] handlePointerMove : Throttle + updateCurrentLine
- [x] handlePointerUp : finalizeLine() ou addShape() selon outil
- [x] Support brush, eraser (destination-out), circle
- [x] Conversion coords Stage → relative automatique
```

### 4.8 - Gestion du Zoom/Pan Mobile ✅

```typescript
// ✅ IMPLÉMENTÉ (src/features/canvas/hooks/useCanvasGestures.ts)

// @use-gesture/react : useGesture avec pinch, drag, wheel
// Limites : 0.5x - 5x, zoom centré sur pointeur

- [x] useCanvasGestures hook créé
- [x] Pinch-to-zoom (2 doigts) centré
- [x] Pan avec 2 doigts ou Ctrl+drag
- [x] Wheel zoom (molette souris)
- [x] isGesturing désactive le dessin pendant navigation
- [x] Multi-touch detection dans useCanvasDrawing
- [x] Transformations appliquées sur <Stage>
```

### 4.9 - Toolbar d'Outils ✅

```typescript
// ✅ IMPLÉMENTÉ (src/features/canvas/components/)

// Composants créés :
- [x] ToolButton.tsx : Bouton générique avec animations Framer Motion
- [x] CanvasToolbar.tsx : Toolbar flottante complète

// Fonctionnalités :
- [x] Boutons outils : Brush (✏️), Circle (⭕), Eraser (🧽)
- [x] Presets couleurs : Vert, Bleu, Rouge, Jaune, Blanc + picker custom
- [x] Sélecteur épaisseur : 1%, 2%, 3%, 5%, 8%
- [x] Undo/Redo avec état disabled si vide
- [x] Reset View (zoom 1x)
- [x] Clear Canvas (avec confirmation)
- [x] Animation apparition spring (Framer Motion)
- [x] Accessibilité : aria-label sur tous les boutons
```

### 4.10 - Tests Unitaires ✅

```typescript
// ✅ IMPLÉMENTÉ

// Tests canvasStore (30 tests)
- [x] canvasStore.test.ts : Actions UI (setTool, setColor, setWidth)
- [x] canvasStore.test.ts : Dessin lignes (start, update, finalize, cancel)
- [x] canvasStore.test.ts : Dessin formes (addShape avec ID unique)
- [x] canvasStore.test.ts : Actions globales (remove, clear, reset, load)
- [x] canvasStore.test.ts : Undo/Redo cycle complet via zundo

// Tests simplify-path (21 tests)
- [x] simplify-path.test.ts : Cas triviaux (0, 1, 2 points)
- [x] simplify-path.test.ts : Simplification points alignés
- [x] simplify-path.test.ts : Préservation des angles
- [x] simplify-path.test.ts : Format Konva (flatPath)
- [x] simplify-path.test.ts : Calcul ratio de réduction
```

### ✅ Validation Phase 4 - TERMINÉ

- [x] Test : Dessiner sur mobile → Tracé fluide sans lag
- [x] Test : Redimensionner fenêtre → Tracé reste aligné avec l'image
- [x] Test : Zoom pinch → Canvas zoome sans perte de qualité
- [x] Test : Undo/Redo → Historique fonctionne (fix equality function)
- [x] Tests unitaires → 101 tests passent
- [x] `npm run precommit` → Aucune erreur

---

## Phase 5 : Persistance & Synchro Cloud

### 5.1 - Schéma Zod pour Boulder Metadata

- [ ] Créer `src/features/boulder/schemas/boulder.schema.ts`
- [ ] Définir `BoulderMetadataSchema` :
  - `name: string`
  - `location: string`
  - `grade_value: string`
  - `grade_system: 'fontainebleau' | 'v_scale'`
  - `is_public: boolean`

### 5.2 - Server Action : Créer un Boulder

- [ ] Créer `src/features/boulder/actions/createBoulder.ts`
- [ ] Valider input avec `BoulderMetadataSchema`
- [ ] Insérer dans table `boulders` (sans drawing_data)
- [ ] Retourner `boulder_id`

### 5.3 - Server Action : Sauvegarder le Canvas

- [ ] Créer `src/features/boulder/actions/saveBoulderCanvas.ts`
- [ ] Input : `boulder_id`, `drawingData` (validé par `DrawingDataSchema`)
- [ ] Logique de résolution de conflit :
  - Récupérer `updated_at` depuis Supabase
  - Comparer avec timestamp local (stocké dans Zustand)
  - Si `local_ts < server_ts` → Proposer choix utilisateur
  - Sinon → UPDATE avec nouveau `updated_at`
- [ ] Retourner statut : `success | conflict`

### 5.4 - Logique de Sauvegarde Automatique

- [ ] Créer `src/features/canvas/hooks/useAutoSave.ts`
- [ ] Toutes les 5 secondes :
  - Sauvegarder dans `localStorage` (via Zustand Persist)
  - Si connecté + boulder_id existe → Appeler `saveBoulderCanvas`
- [ ] Afficher indicateur visuel (Icône checkmark verte) lors de la réussite

### 5.5 - Logique de Récupération au Démarrage

- [ ] Créer `src/features/boulder/hooks/useLoadBoulder.ts`
- [ ] Au montage du composant :
  - Récupérer `boulder_id` depuis URL
  - Charger depuis Supabase (`boulders` table)
  - Si `localStorage` contient une version plus récente (`local_ts > server_ts`) :
    - Afficher modal : "Version locale plus récente trouvée. Charger ?"
  - Sinon → Charger depuis serveur
- [ ] Initialiser le Zustand store avec les données

### 5.6 - UI de Résolution de Conflit

- [ ] Créer `src/features/boulder/components/ConflictResolutionModal.tsx`
- [ ] Afficher :
  - Timestamp local vs serveur
  - Aperçu visuel (miniature) des deux versions (si possible)
  - Boutons : "Garder Local" | "Garder Serveur" | "Annuler"
- [ ] Retourner le choix utilisateur à `saveBoulderCanvas`

### ✅ Validation Phase 5

- [ ] Test : Créer boulder → Sauvegarde réussie
- [ ] Test : Dessiner → Auto-save toutes les 5s
- [ ] Test : Simuler conflit (éditer depuis 2 devices) → Modal s'affiche
- [ ] Test : Mode hors ligne → Dessin continue + Synchro au retour réseau
- [ ] `npm run build` → Pas d'erreur

---

## Phase 6 : Système de Cotation (Fontainebleau ↔ V-Scale)

### 6.1 - Tables de Correspondance

- [ ] Créer `src/constants/gradingTables.ts`
- [ ] Définir `fontainebleauGrades: string[]` (3, 4, 5, 5+, 6A, 6A+, ..., 9A)
- [ ] Définir `vScaleGrades: string[]` (VB, V0, V1, ..., V17)
- [ ] Définir `conversionMap: Record<string, string>` (approximations)
  - Exemple : `{ '6A': 'V3', '6A+': 'V3', '6B': 'V4', ... }`

### 6.2 - Utilitaire de Conversion

- [ ] Créer `src/features/grading/utils/convertGrade.ts`
- [ ] `convertGrade(grade, fromSystem, toSystem)` → `{ converted: string, isApproximate: boolean }`
- [ ] Si conversion non bijective → Retourner `isApproximate: true`

### 6.3 - Composant Affichage de Cotation

- [ ] Créer `src/features/grading/components/GradeDisplay.tsx`
- [ ] Props : `originalGrade`, `originalSystem`, `userPreferredSystem`
- [ ] Afficher :
  - Si système identique → Afficher directement
  - Sinon → Afficher converti avec mention "(~V4 equivalent)"

### 6.4 - Composant Sélecteur de Cotation

- [ ] Créer `src/features/grading/components/GradeSelector.tsx`
- [ ] Dropdown avec liste des cotations du système actif
- [ ] Toggle pour changer de système (Fontainebleau ↔ V-Scale)
- [ ] Retourner `{ grade_value, grade_system }`

### 6.5 - Settings Utilisateur (Préférence de Cotation)

- [ ] Créer page `app/(app)/settings/page.tsx`
- [ ] Toggle pour changer `preferred_grading_system`
- [ ] Sauvegarder dans table `profiles` (UPDATE)

### ✅ Validation Phase 6

- [ ] Test : Afficher "6A" en mode V-Scale → Affiche "~V3 equivalent"
- [ ] Test : Changer de préférence → Toutes les cotations se convertissent
- [ ] `npm run typecheck` → Aucune erreur

---

## Phase 7 : UI "High-Tech Lab" & Design System

### 7.1 - Tokens Tailwind (Design System)

- [ ] Configurer `tailwind.config.ts` :
  - Colors : `primary`, `secondary`, `accent`, `background`, `surface`
  - Dark Mode : Classe `.dark` avec palette sombre par défaut
  - Typographie : Ajouter Google Fonts (ex: Inter, JetBrains Mono)
  - Animations custom : `animate-slide-in`, `animate-fade-in`

### 7.2 - Composants UI de Base (Shadcn/UI)

- [ ] Installer : Button, Input, Select, Modal, Toast
- [ ] Personnaliser les variants pour match l'identité "High-Tech Lab"
- [ ] Ajouter `src/components/ui/Icon.tsx` (wrapper Lucide Icons)

### 7.3 - Composants Vendor (Copy-Paste)

- [ ] Créer `src/components/vendor/eldora-ui/`
- [ ] (Identifier les composants spécifiques à intégrer selon tes besoins)
- [ ] Ajouter commentaires d'attribution en en-tête
- [ ] Créer wrappers dans `src/components/ui/*` pour respecter le Design System

### 7.4 - Layout Principal

- [ ] Créer `app/(app)/layout.tsx` :
  - Header avec logo + navigation
  - Footer minimal
  - Gestion du Dark Mode (Provider)
- [ ] Créer `app/(auth)/layout.tsx` (Centré, minimal)

### 7.5 - Page d'Accueil / Dashboard

- [ ] Créer `app/(app)/page.tsx`
- [ ] Afficher la liste des boulders de l'utilisateur (Grid)
- [ ] Bouton CTA : "+ Créer une Bêta"
- [ ] Filtres : Par cotation, par date

### 7.6 - Page Création de Boulder

- [ ] Créer `app/(app)/boulder/new/page.tsx`
- [ ] Flow :
  - Étape 1 : Upload image (Galerie ou Caméra)
  - Étape 2 : Saisie métadonnées (Nom, Lieu, Cotation)
  - Étape 3 : Redirection vers `/boulder/[id]/edit`

### 7.7 - Page Éditeur de Canvas

- [ ] Créer `app/(app)/boulder/[id]/edit/page.tsx`
- [ ] Charger le boulder depuis `useLoadBoulder`
- [ ] Afficher `<DrawingCanvas />` + `<Toolbar />`
- [ ] Mode Plein Écran (toggle via bouton)
- [ ] Bouton "Publier" → Passe `is_public` à `true`

### 7.8 - Page Visionneuse Publique

- [ ] Créer `app/(public)/boulder/[id]/page.tsx`
- [ ] Afficher l'image + dessin (lecture seule)
- [ ] Afficher métadonnées (Nom, Cotation, Auteur)
- [ ] Bouton "Partager" (Copy Link)
- [ ] Générer meta tags OpenGraph dynamiques

### 7.9 - Animations (Framer Motion)

- [ ] Toolbar rétractable avec transition `spring`
- [ ] Modal de conflit avec `fadeIn`
- [ ] Liste des boulders avec `stagger`

### ✅ Validation Phase 7

- [ ] Test : Navigation fluide entre les pages
- [ ] Test : Dark Mode fonctionne sur tous les composants
- [ ] Test : UI responsive (Mobile, Tablet, Desktop)
- [ ] Accessibility : Focus clavier, aria-labels
- [ ] `npm run lint` → Pas d'erreur

---

## Phase 8 : Partage & OpenGraph

### 8.1 - Génération de Thumbnail (Canvas Snapshot)

- [ ] Créer `src/features/share/utils/generateThumbnail.ts`
- [ ] Utiliser `.toDataURL()` de Konva pour capturer le canvas
- [ ] Convertir en Blob
- [ ] Upload vers bucket `thumbnails` (public)

### 8.2 - Server Action : Publier un Boulder

- [ ] Créer `src/features/boulder/actions/publishBoulder.ts`
- [ ] Générer le thumbnail
- [ ] UPDATE `boulders` : `is_public = true` + `thumbnail_url`

### 8.3 - Meta Tags OpenGraph Dynamiques

- [ ] Dans `app/(public)/boulder/[id]/page.tsx` :
- [ ] Utiliser `generateMetadata()` de Next.js
- [ ] Fetch boulder depuis Supabase
- [ ] Retourner :
  - `og:title` : Nom du boulder
  - `og:description` : Cotation + Lieu
  - `og:image` : URL du thumbnail

### 8.4 - Composant Partage

- [ ] Créer `src/features/share/components/ShareButton.tsx`
- [ ] Copier lien dans le presse-papier
- [ ] Toast de confirmation
- [ ] (Optionnel) Intégration Web Share API pour partage natif

### ✅ Validation Phase 8

- [ ] Test : Publier boulder → Thumbnail généré
- [ ] Test : Partager lien sur WhatsApp → Preview s'affiche correctement
- [ ] Test : Meta tags valides (via Open Graph Debugger)

---

## Phase 9 : Optimisations & Performance Mobile

### 9.1 - Throttling des Events Canvas

- [ ] Dans `DrawingCanvas.tsx` :
- [ ] Wrapper `onMouseMove` avec `requestAnimationFrame`
- [ ] Limiter à 30-40 FPS pendant le tracé actif

### 9.2 - Code Splitting & Lazy Loading

- [ ] Lazy load `<DrawingCanvas />` avec `next/dynamic` + `ssr: false`
- [ ] Lazy load Framer Motion animations
- [ ] Lazy load Color Picker (vendor component)

### 9.3 - Image Optimization

- [ ] Remplacer `<img>` par `<Image>` de Next.js partout
- [ ] Ajouter `placeholder="blur"` pour les images de boulder

### 9.4 - Tests de Performance Mobile

- [ ] Tester sur iPhone SE 2020 (Baseline iOS)
- [ ] Tester sur Android milieu de gamme (ex: Samsung A52)
- [ ] Objectif : Dessin à main levée fluide (< 50ms de latence)

### 9.5 - Fallback Canvas Natif (Si Besoin)

- [ ] Si React-Konva lag sur devices bas de gamme :
- [ ] Créer version alternative avec `<canvas>` 2D API natif
- [ ] Feature flag pour basculer entre les 2 implémentations

### ✅ Validation Phase 9

- [ ] Lighthouse Mobile Score : > 90 Performance
- [ ] Test utilisateur réel sur mobile → Feedback positif
- [ ] `npm run build` → Bundle size < 500KB (first load)

---

## Phase 10 : Tests, Documentation & Déploiement

### 10.1 - Tests Unitaires (Vitest)

- [ ] Installer Vitest + React Testing Library
- [ ] Tester `coordsConverter.ts`
- [ ] Tester `convertGrade.ts`
- [ ] Tester `normalizeImageOrientation.ts`
- [ ] Tester Zustand store (actions)

### 10.2 - Tests d'Intégration (Playwright)

- [ ] Installer Playwright
- [ ] Test E2E : Inscription → Upload → Dessiner → Publier → Visionner
- [ ] Test RLS : Utilisateur A ne peut pas modifier boulder de B

### 10.3 - Documentation

- [ ] Créer `README.md` complet :
  - Description du projet
  - Stack technique
  - Installation locale
  - Variables d'environnement
  - Commandes npm
- [ ] Créer `CONTRIBUTING.md` (Coding standards, Git workflow)
- [ ] Documenter les schémas Zod (JSDoc)

### 10.4 - Déploiement Vercel

- [ ] Connecter repo GitHub à Vercel
- [ ] Configurer les variables d'env (Supabase)
- [ ] Activer Preview Deployments
- [ ] Configurer domaine custom (si applicable)

### 10.5 - Monitoring & Analytics

- [ ] Installer Vercel Analytics
- [ ] (Optionnel) Sentry pour error tracking
- [ ] Logs Supabase : Surveiller usage Storage

### ✅ Validation Phase 10

- [ ] Tous les tests au vert
- [ ] Deploy production réussi
- [ ] Site accessible publiquement
- [ ] Meta tags OpenGraph fonctionnels

---

## Notes Importantes

### 🔴 Edge Cases Critiques (Intégrés dans le Plan)

1. **EXIF/Rotation** → Phase 3.2 (blueimp-load-image)
2. **Ratio Canvas** → Phase 4.3 (calculateCanvasRatio + listener resize)
3. **Synchro Conflict** → Phase 5.3 (Timestamp comparison + UI resolution)
4. **Conversion Grades** → Phase 6.2 (Table approximative + flag `isApproximate`)
5. **Performance Mobile** → Phase 9.1 (Throttling rAF + Lazy loading)

### 📐 Règles de Qualité (À Respecter à Chaque Phase)

- **TypeScript Strict** : `any` interdit, utiliser `unknown` si besoin
- **Zod Validation** : Toute donnée externe DOIT passer par un schéma
- **Feature-Based Structure** : Regrouper par fonctionnalité, pas par type de fichier
- **Max 150 lignes** : Découper les gros composants en sous-composants
- **Dark Mode** : Tester chaque composant en mode sombre
- **Accessibilité** : `aria-labels`, gestion focus clavier

### 🚀 Workflow de Développement

1. **Branche** : `feat/phase-X-Y-nom-tache`
2. **Commit** : Conventional Commits (`feat(canvas): add throttling to mouse events`)
3. **Validation** : Lint → TypeCheck → Build → Tests → Push
4. **Review** : Demander validation avant merge vers `main`

---

**Prochaine étape :** Attendre validation de ce plan avant de commencer **Phase 1.1 : Init Next.js**.
