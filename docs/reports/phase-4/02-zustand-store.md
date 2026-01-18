# Rapport de Tâche - Phase 4.2 : Zustand Store Canvas

**Date** : 2026-01-18  
**Statut** : ✅ Terminé  
**Branche** : `main`  

---

## ✅ Tâches Accomplies

### 1. Création du Store Zustand

#### [canvasStore.ts](file:///f:/Portfolio/dev/BetaGraph/src/features/canvas/store/canvasStore.ts)

Store central gérant l'état complet du moteur Canvas avec middlewares pour l'historique (undo/redo) et la persistance localStorage.

---

### 2. Architecture du Store

#### Séparation État UI / Données

| Catégorie | Données | Persisté | Undo/Redo |
|-----------|---------|----------|-----------|
| **État UI** | `currentTool`, `currentColor`, `currentWidth`, `currentLine`, `isDrawing` | ❌ | ❌ |
| **Données métier** | `drawingData` | ✅ | ✅ |

**Rationale** : L'état UI est transitoire et ne doit pas polluer l'historique ni le localStorage.

---

### 3. État Implémenté

```typescript
interface CanvasState {
  // UI (non persisté)
  currentTool: 'brush' | 'circle' | 'eraser';
  currentColor: string;      // #RRGGBB
  currentWidth: number;      // % largeur image
  currentLine: Point[];      // Tracé temporaire
  isDrawing: boolean;

  // Données (persisté + undo)
  drawingData: DrawingData;
}
```

---

### 4. Actions Implémentées

| Action | Description |
|--------|-------------|
| `setTool(tool)` | Change l'outil actif |
| `setColor(color)` | Change la couleur de dessin |
| `setWidth(width)` | Change l'épaisseur du trait |
| `startLine(point)` | Démarre un nouveau tracé |
| `updateCurrentLine(point)` | Ajoute un point au tracé en cours |
| `finalizeLine()` | Finalise le tracé → ajoute à `drawingData.lines` |
| `cancelLine()` | Annule le tracé en cours |
| `addShape(shape)` | Ajoute une forme (cercle) avec ID auto |
| `removeElement(id)` | Supprime une ligne ou forme par ID |
| `clearCanvas()` | Efface tout le dessin |
| `resetStore()` | Réinitialise le store complet |
| `loadDrawingData(data)` | Charge des données externes |

---

### 5. Configuration des Middlewares

#### temporal (zundo) - Historique Undo/Redo

```typescript
temporal(store, {
  partialize: (state) => ({ drawingData: state.drawingData }),
  limit: 50, // Max 50 états en mémoire
})
```

**Accès** :
```typescript
const { undo, redo, pastStates, futureStates } = useCanvasStore.temporal.getState();
```

#### persist - Sauvegarde localStorage

```typescript
persist(store, {
  name: 'betagraph-canvas-draft',
  partialize: (state) => ({ drawingData: state.drawingData }),
})
```

---

### 6. Flow de Dessin (Undo-Friendly)

```
1. onPointerDown → startLine(point)
   └─ Initialise currentLine = [point], isDrawing = true
   └─ ❌ Pas de capture undo

2. onPointerMove → updateCurrentLine(point)
   └─ Ajoute point à currentLine
   └─ ❌ Pas de capture undo (60+ appels/seconde)

3. onPointerUp → finalizeLine()
   └─ Crée Line avec nanoid + currentLine
   └─ ✅ Ajoute à drawingData.lines (capturé par zundo)
```

---

### 7. Hooks Exportés

| Hook | Usage |
|------|-------|
| `useCanvasStore` | Accès principal au store |
| `useCanvasHistory()` | Accès `undo()`, `redo()`, `pastStates`, `futureStates` |
| `generateElementId()` | Génération ID unique (nanoid) |

---

## 📁 Arborescence Modifiée

```
BetaGraph/
├── src/
│   └── features/
│       └── canvas/
│           └── store/
│               └── canvasStore.ts   [NOUVEAU]
└── docs/
    └── reports/
        └── phase-4/
            ├── 01-drawing-schema.md [EXISTANT]
            └── 02-zustand-store.md  [CE FICHIER]
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

### 1. Tracé Temporaire Hors `drawingData`

**Choix** : `currentLine` stocké séparément, ajouté à `drawingData` uniquement à la finalisation.

**Avantage** : Évite 60+ captures undo/seconde pendant le dessin.

---

### 2. Limite Historique à 50 États

**Choix** : `limit: 50` dans la config zundo.

**Rationale** :
- Un dessin typique = 20-30 tracés
- 50 états = marge confortable pour undo
- Évite consommation mémoire excessive

---

### 3. Clé LocalStorage Unique

**Choix** : `betagraph-canvas-draft` (pas de `boulderId` pour l'instant).

**Évolution future** : Quand le système de boulders sera en place, la clé deviendra `betagraph-canvas-${boulderId}`.

---

## 📊 Métriques

| Métrique | Valeur |
|----------|--------|
| **Fichiers créés** | 1 |
| **Lignes de code** | 276 |
| **Types exportés** | 4 (`CanvasTool`, `CanvasState`, `CanvasActions`, `CanvasStore`) |
| **Actions** | 11 |
| **Hooks** | 2 |

---

## 🔜 Prochaines Étapes

**Phase 4.3 - Utilitaire de Calcul de Ratio** :
- [ ] Créer `src/features/canvas/utils/calculateCanvasRatio.ts`
- [ ] Input : dimensions conteneur + dimensions image
- [ ] Output : `{ scale, offsetX, offsetY }` pour centrage

**Phase 4.4 - Utilitaire de Conversion Coordonnées** :
- [ ] `absoluteToRelative()` : pixels → % (0-100)
- [ ] `relativeToAbsolute()` : % → pixels

---

## ✅ Validation Phase 4.2

### Checklist Complète

**Implémentation** :
- [x] Store Zustand créé
- [x] État UI séparé des données métier
- [x] Actions de dessin (ligne, forme)
- [x] Middleware temporal (zundo) configuré
- [x] Middleware persist configuré
- [x] Partialize pour exclure état UI
- [x] Flow de dessin undo-friendly
- [x] Hooks dérivés exportés

**Qualité** :
- [x] TypeScript strict (0 erreurs)
- [x] Lint (0 warnings)
- [x] Exports nommés uniquement
- [x] JSDoc complet
- [x] TODO.md mis à jour

---

**Statut global** : ✅ **PHASE 4.2 VALIDÉE**  
**Store Canvas** : Prêt pour intégration avec les composants UI (Phase 4.6+)
