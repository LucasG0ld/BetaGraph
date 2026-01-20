# Rapport - Phase 6.1 : Tables de Correspondance

**Date** : 2026-01-20  
**Statut** : ✅ TERMINÉE  

---

## 🎯 Objectif

Créer les constantes de cotation avec une échelle normalisée (0-100) pour permettre le tri et la comparaison universels entre Fontainebleau et V-Scale.

---

## 📦 Fichier Créé

### `src/features/grading/constants/grades.ts` (180 lignes)

---

## 🏗️ Contenu Implémenté

### 1. Listes Ordonnées

```typescript
export const FONTAINEBLEAU_GRADES = [
    '3', '4', '5', '5+',
    '6A', '6A+', '6B', '6B+', '6C', '6C+',
    '7A', '7A+', '7B', '7B+', '7C', '7C+',
    '8A', '8A+', '8B', '8B+', '8C', '8C+',
    '9A', '9A+', '9B', '9B+', '9C'
] as const; // 27 grades

export const V_SCALE_GRADES = [
    'VB', 'V0', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6',
    'V7', 'V8', 'V9', 'V10', 'V11', 'V12', 'V13',
    'V14', 'V15', 'V16', 'V17'
] as const; // 19 grades
```

### 2. Table de Mapping Normalisée

```typescript
interface GradeMapping {
    readonly normalized: number;         // 0-100
    readonly vScale?: readonly VScaleGrade[];
    readonly fontainebleau?: readonly FontainebleauGrade[];
}

export const GRADE_MAPPING: Record<string, GradeMapping> = {
    // Fontainebleau
    '3':   { normalized: 0,  vScale: ['VB'] },
    '6A+': { normalized: 25, vScale: ['V2', 'V3'] },  // Approximatif
    '7A':  { normalized: 50, vScale: ['V6'] },        // Exact
    '9C':  { normalized: 100, vScale: ['V17'] },
    
    // V-Scale
    'VB':  { normalized: 3,  fontainebleau: ['3', '4'] },
    'V6':  { normalized: 50, fontainebleau: ['7A'] },   // Exact
    'V17': { normalized: 97, fontainebleau: ['9A+', '9B', '9B+', '9C'] },
    // ...
};
```

### 3. Schémas Zod

```typescript
export const GradeSystemSchema = z.enum(['fontainebleau', 'v_scale']);
export const FontainebleauGradeSchema = z.enum(FONTAINEBLEAU_GRADES);
export const VScaleGradeSchema = z.enum(V_SCALE_GRADES);
```

### 4. Utilitaires de Base

| Fonction | Description |
|----------|-------------|
| `getNormalizedValue(grade)` | Retourne valeur 0-100, -1 si inconnu |
| `isValidGrade(grade)` | Vérifie existence dans GRADE_MAPPING |
| `detectGradeSystem(grade)` | Détecte FB ou V-Scale automatiquement |

---

## 📊 Correspondances Notables

| Fontainebleau | Normalized | V-Scale | Type |
|---------------|------------|---------|------|
| 3 | 0 | VB | Exact |
| 6A+ | 25 | V2, V3 | **Approximatif** |
| 6B | 30 | V3, V4 | **Approximatif** |
| 7A | 50 | V6 | Exact |
| 8A | 76 | V11 | Exact |
| 9C | 100 | V17 | Exact |

---

## ✅ Validation

- [x] TypeScript strict (pas de `any`)
- [x] Exports nommés uniquement
- [x] Schémas Zod intégrés

---

## 📚 Sources

- https://8a.nu/grading
- https://www.moonboard.com/grade-conversion
- https://en.wikipedia.org/wiki/Grade_(bouldering)
