# Rapport de Tâche - Phase 4.3 : Utilitaire de Calcul de Ratio

**Date** : 2026-01-18  
**Statut** : ✅ Terminé  
**Branche** : `main`  

---

## ✅ Tâches Accomplies

### 1. Création de l'Utilitaire Mathématique

#### [canvas-math.ts](file:///f:/Portfolio/dev/BetaGraph/src/features/canvas/utils/canvas-math.ts)

Module contenant les fonctions de calcul pour le rendu responsive du Canvas.

---

### 2. Formule Mathématique Implémentée

**Objectif** : Comportement `object-fit: contain`

```
scaleX = containerWidth / imageWidth
scaleY = containerHeight / imageHeight

scale = min(scaleX, scaleY)  ← MINIMUM pour garantir que l'image tient

scaledWidth  = imageWidth × scale
scaledHeight = imageHeight × scale

offsetX = (containerWidth - scaledWidth) / 2
offsetY = (containerHeight - scaledHeight) / 2
```

---

### 3. Types Exportés

#### `Dimensions`

```typescript
interface Dimensions {
  width: number;
  height: number;
}
```

#### `CanvasLayout`

```typescript
interface CanvasLayout {
  scale: number;        // Facteur de mise à l'échelle
  stageWidth: number;   // Largeur Stage Konva
  stageHeight: number;  // Hauteur Stage Konva
  scaledWidth: number;  // Largeur image scalée
  scaledHeight: number; // Hauteur image scalée
  offsetX: number;      // Décalage horizontal centrage
  offsetY: number;      // Décalage vertical centrage
}
```

---

### 4. Fonctions Implémentées

| Fonction | Description |
|----------|-------------|
| `calculateCanvasLayout(container, image)` | Calcule le layout complet pour le Stage Konva |
| `isPointInsideImage(stageX, stageY, layout)` | Vérifie si un point est dans la zone image |
| `calculateAspectRatio(width, height)` | Calcule le ratio d'aspect |

---

### 5. Exemples d'Utilisation

```typescript
// Image paysage dans conteneur carré
const layout = calculateCanvasLayout(
  { width: 800, height: 600 },
  { width: 1920, height: 1080 }
);
// → scale: 0.4167
// → scaledWidth: 800, scaledHeight: 450
// → offsetX: 0, offsetY: 75 (centrage vertical)

// Image portrait dans conteneur paysage
const layout2 = calculateCanvasLayout(
  { width: 800, height: 600 },
  { width: 1080, height: 1920 }
);
// → scale: 0.3125
// → scaledWidth: 338, scaledHeight: 600
// → offsetX: 231, offsetY: 0 (centrage horizontal)
```

---

## 📁 Arborescence Modifiée

```
BetaGraph/
├── src/
│   └── features/
│       └── canvas/
│           └── utils/
│               └── canvas-math.ts   [NOUVEAU]
└── docs/
    └── reports/
        └── phase-4/
            └── 03-canvas-math.md    [CE FICHIER]
```

---

## 🧪 Validation

| Commande | Résultat |
|----------|----------|
| `npm run typecheck` | ✅ 0 erreurs |
| `npm run lint` | ✅ 0 warnings/errors |
| `npm run precommit` | ✅ Passé |

---

## ⚠️ Décisions Architecturales

### 1. Pourquoi `min(scaleX, scaleY)` ?

**Choix** : Utiliser le minimum des deux ratios.

**Rationale** :
- Garantit que l'image **tient entièrement** dans le conteneur
- Préserve le ratio d'aspect original
- Comportement identique à `object-fit: contain` CSS

---

### 2. Fonction `isPointInsideImage`

**Choix** : Fonction utilitaire séparée pour détecter les clics hors image.

**Usage** : Ignorer les événements de dessin dans la zone de padding (offsets).

---

## 📊 Métriques

| Métrique | Valeur |
|----------|--------|
| **Fichiers créés** | 1 |
| **Lignes de code** | 218 |
| **Types exportés** | 2 |
| **Fonctions exportées** | 3 |

---

## 🔜 Prochaines Étapes

**Phase 4.4 - Utilitaire de Conversion Coordonnées** :
- [ ] `stageToRelative()` : Pixels Stage → % (0-100)
- [ ] `relativeToStage()` : % → Pixels Stage
- [ ] Gérer les offsets dans la conversion

---

**Statut global** : ✅ **PHASE 4.3 VALIDÉE**  
**Calcul de ratio** : Prêt pour utilisation dans le composant Canvas
