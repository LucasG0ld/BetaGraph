# Rapport de Tâche - Phase 4.1 : Schéma Zod pour Drawing Data

**Date** : 2026-01-18  
**Statut** : ✅ Terminé  
**Branche** : `main` (Direct commit - Tâche atomique)  

---

## ✅ Tâches Accomplies

### 1. Création du Fichier de Schémas

#### [drawing.schema.ts](file:///f:/Portfolio/dev/BetaGraph/src/lib/schemas/drawing.schema.ts)

Fichier central contenant les schémas Zod pour la validation des données de dessin du moteur Canvas.

**Règle d'Or** : Toutes les coordonnées sont stockées en **pourcentage (0-100)** par rapport aux dimensions de l'image originale, garantissant un rendu parfaitement responsive.

---

### 2. Schémas Implémentés

#### `PointSchema`

Représente une position sur le canvas en coordonnées relatives.

```typescript
export const PointSchema = z.object({
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
});
```

| Champ | Type | Contraintes | Rôle |
|-------|------|-------------|------|
| `x` | `number` | 0-100 | Position horizontale (% de la largeur) |
| `y` | `number` | 0-100 | Position verticale (% de la hauteur) |

---

#### `LineSchema`

Représente un tracé continu (pinceau ou gomme).

```typescript
export const LineSchema = z.object({
  id: z.string().min(1),
  tool: z.enum(['brush', 'eraser']),
  points: z.array(PointSchema).min(1),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  width: z.number().positive().max(100),
});
```

| Champ | Type | Contraintes | Rôle |
|-------|------|-------------|------|
| `id` | `string` | Non vide | Identifiant unique (nanoid) |
| `tool` | `enum` | `'brush'` \| `'eraser'` | Type d'outil |
| `points` | `Point[]` | Min 1 | Suite de points formant le tracé |
| `color` | `string` | `#RRGGBB` | Couleur hexadécimale stricte |
| `width` | `number` | 0-100 | Épaisseur en % de la **largeur image** |

---

#### `CircleSchema`

Représente un cercle (marqueur de prise).

```typescript
export const CircleSchema = z.object({
  id: z.string().min(1),
  type: z.literal('circle'),
  center: PointSchema,
  radius: z.number().positive().max(100),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});
```

| Champ | Type | Contraintes | Rôle |
|-------|------|-------------|------|
| `id` | `string` | Non vide | Identifiant unique |
| `type` | `literal` | `'circle'` | Discriminant pour union |
| `center` | `Point` | - | Centre du cercle |
| `radius` | `number` | 0-100 | Rayon en % de la **largeur image** |
| `color` | `string` | `#RRGGBB` | Couleur de bordure |

---

#### `ShapeSchema` (Discriminated Union)

Union extensible pour supporter de futurs outils (rectangle, polygon, text...).

```typescript
export const ShapeSchema = z.discriminatedUnion('type', [CircleSchema]);
```

---

#### `DrawingDataSchema` (Structure Racine)

Structure complète stockée dans le champ JSONB `drawing_data`.

```typescript
export const DrawingDataSchema = z.object({
  version: z.number().int().positive(),
  lines: z.array(LineSchema),
  shapes: z.array(ShapeSchema),
});
```

| Champ | Type | Rôle |
|-------|------|------|
| `version` | `number` | Versionnage pour migrations futures |
| `lines` | `Line[]` | Tracés de pinceau et gomme |
| `shapes` | `Shape[]` | Formes géométriques |

---

### 3. Types Exportés

```typescript
export type Point = z.infer<typeof PointSchema>;
export type LineTool = z.infer<typeof LineToolSchema>;
export type Line = z.infer<typeof LineSchema>;
export type Circle = z.infer<typeof CircleSchema>;
export type Shape = z.infer<typeof ShapeSchema>;
export type DrawingData = z.infer<typeof DrawingDataSchema>;
```

---

### 4. Bonus : Factory Function

```typescript
export const DRAWING_DATA_SCHEMA_VERSION = 1;

export function createEmptyDrawingData(): DrawingData {
  return {
    version: DRAWING_DATA_SCHEMA_VERSION,
    lines: [],
    shapes: [],
  };
}
```

---

## 📁 Arborescence Modifiée

```
BetaGraph/
├── src/
│   └── lib/
│       └── schemas/
│           ├── image.schema.ts     [EXISTANT]
│           └── drawing.schema.ts   [NOUVEAU]
└── docs/
    └── reports/
        └── phase-4/
            └── 01-drawing-schema.md [CE FICHIER]
```

---

## 🧪 Validation

### Commandes Exécutées

| Commande | Résultat |
|----------|----------|
| `npm run typecheck` | ✅ 0 erreurs |
| `npm run lint` | ✅ 0 warnings/errors |
| `npm run precommit` | ✅ Passé |

---

### Conformité Règles

| Règle | Vérification | Statut |
|-------|--------------|--------|
| **02 - Exports nommés** | Tous les schémas et types | ✅ |
| **02 - Zod First** | Toute validation via schéma | ✅ |
| **02 - Inférence types** | `z.infer<typeof Schema>` | ✅ |
| **00 - Messages FR** | Messages d'erreur en français | ✅ |
| **02 - any interdit** | Aucun type `any` | ✅ |
| **05 - Documentation** | JSDoc complet | ✅ |

---

## ⚠️ Décisions Architecturales

### 1. Normalisation par Largeur Image

**Choix** : `width` (épaisseur ligne) et `radius` (cercle) normalisés par rapport à la **largeur** de l'image.

**Rationale** :
- Standard intuitif et cohérent
- Évite l'ambiguïté sur images non carrées
- Un cercle reste un cercle parfait (pas d'ellipse)

---

### 2. Gomme comme Trait Masquant

**Choix** : `tool: 'eraser'` dessine un trait avec `globalCompositeOperation: 'destination-out'`.

**Avantages** :
- Implémentation simple (même logique que brush)
- Données cohérentes (même structure `Line`)
- UX naturelle (gomme = dessiner pour effacer)

---

### 3. Discriminated Union pour Shapes

**Choix** : `z.discriminatedUnion('type', [...])` au lieu de `z.union`.

**Avantages** :
- Typage précis selon la valeur de `type`
- Extensible : ajouter `RectangleSchema`, `PolygonSchema` facilement
- Parsing optimisé par Zod

---

### 4. Versionnage du Schéma

**Choix** : Champ `version` obligatoire dans `DrawingDataSchema`.

**Rationale** :
- Permet les migrations de données futures
- Rétrocompatibilité garantie
- Facilite le débogage (identifier anciens formats)

---

## 📊 Métriques

| Métrique | Valeur |
|----------|--------|
| **Fichiers créés** | 1 |
| **Lignes de code** | 234 |
| **Schémas Zod** | 6 |
| **Types exportés** | 6 |
| **Contraintes de validation** | 18 |
| **Messages d'erreur FR** | 12 |

---

## 🔜 Prochaines Étapes

**Phase 4.2 - Zustand Store Canvas** :
- [ ] Créer `src/features/canvas/store/canvasStore.ts`
- [ ] États : `backgroundImage`, `drawingData`, `currentTool`, `currentColor`
- [ ] Actions : `addLine`, `addShape`, `removeLine`, `undo`, `redo`
- [ ] Middleware Persist (localStorage)
- [ ] Middleware Zundo (historique)

---

## ✅ Validation Phase 4.1

### Checklist Complète

**Implémentation** :
- [x] `PointSchema` avec contraintes 0-100
- [x] `LineSchema` avec id, tool, points, color, width
- [x] `CircleSchema` avec discriminant `type`
- [x] `ShapeSchema` en Discriminated Union
- [x] `DrawingDataSchema` avec version
- [x] Types TypeScript inférés exportés
- [x] Factory function `createEmptyDrawingData()`

**Qualité** :
- [x] TypeScript 0 erreurs
- [x] Lint 0 warnings/errors
- [x] Exports nommés uniquement
- [x] JSDoc complète en français
- [x] TODO.md mis à jour

---

**Statut global** : ✅ **PHASE 4.1 VALIDÉE**  
**Contrat de données Canvas** : Prêt pour intégration dans le store Zustand (Phase 4.2)
