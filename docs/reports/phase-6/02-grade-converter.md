# Rapport - Phase 6.2 : Utilitaires de Conversion

**Date** : 2026-01-20  
**Statut** : ✅ TERMINÉE  

---

## 🎯 Objectif

Implémenter les fonctions de conversion, comparaison et tri entre les systèmes Fontainebleau et V-Scale, avec gestion des cas approximatifs.

---

## 📦 Fichiers Créés

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `grade-converter.ts` | 240 | Utilitaires de conversion |
| `grade-converter.test.ts` | 290 | Tests unitaires (99 tests) |

---

## 🏗️ API Implémentée

### 1. `convertGrade(value, from, to)`

```typescript
interface ConversionResult {
    readonly value: string;
    readonly isApproximate: boolean;
}

// Conversion exacte
convertGrade('7A', 'fontainebleau', 'v_scale')
// → { value: 'V6', isApproximate: false }

// Conversion approximative (plusieurs correspondances)
convertGrade('6A+', 'fontainebleau', 'v_scale')
// → { value: 'V2', isApproximate: true }

// Normalisation de casse automatique
convertGrade('6a+', 'fontainebleau', 'v_scale')
// → { value: 'V2', isApproximate: true }
```

### 2. `compareGrades(g1, g2, system?)`

```typescript
// Tri Fontainebleau
compareGrades('6A', '7A', 'fontainebleau')  // → -1

// Tri V-Scale
compareGrades('V10', 'V5', 'v_scale')       // → 1

// Tri MIXTE (FB vs V-Scale)
compareGrades('7A', 'V6')                   // → 0 (équivalents)
compareGrades('6B', 'V6')                   // → -1 (6B < V6)
```

### 3. `createGradeComparator(ascending)`

```typescript
// Factory pour Array.sort()
const grades = ['7A', 'V3', '6B', 'V10', 'VB'];
grades.sort(createGradeComparator(true));
// → ['VB', 'V3', '6B', '7A', 'V10']
```

### 4. Autres Fonctions

| Fonction | Retour | Description |
|----------|--------|-------------|
| `getGradeValues(system)` | `readonly string[]` | Liste pour dropdown UI |
| `getAllConversions(value, from, to)` | `readonly string[]` | Toutes correspondances |
| `normalizeGradeCase(grade, system)` | `string` | "6a+" → "6A+" |
| `findClosestGrade(normalized, system)` | `string` | Grade le plus proche |

---

## 🧪 Tests Unitaires : 99 Tests

### Répartition

| Catégorie | Tests |
|-----------|-------|
| Conversion FB → V-Scale | 6 |
| Conversion V-Scale → FB | 5 |
| Même système | 2 |
| Normalisation casse | 4 |
| Grades inconnus (erreurs) | 4 |
| Comparaison FB | 4 |
| Comparaison V-Scale | 3 |
| Comparaison mixte | 4 |
| `createGradeComparator` | 4 |
| `getGradeValues` | 2 |
| `getAllConversions` | 4 |
| Utilitaires validation | 9 |
| Couverture complète FB | 27 |
| Couverture complète V-Scale | 19 |
| **TOTAL** | **99** |

### Cas Testés

- ✅ Bijections exactes (7A ↔ V6)
- ✅ Conversions approximatives (6A+ → V2, flag `isApproximate`)
- ✅ Tri de tableaux mixtes FB + V-Scale
- ✅ Normalisation casse ("vb" → "VB", "6a+" → "6A+")
- ✅ Gestion erreurs (`InvalidGradeError` pour grades inconnus)
- ✅ 100% des 46 grades couverts (27 FB + 19 V-Scale)

---

## 📊 Exemple de Tri Mixte

```typescript
// Entrée : grades de différents systèmes
const grades = ['7A', 'V3', '6B', 'V10', 'VB'];

// Tri par difficulté croissante
grades.sort(createGradeComparator(true));

// Résultat avec valeurs normalisées :
// VB (3) < V3 (28) < 6B (30) < 7A (50) < V10 (73)
// → ['VB', 'V3', '6B', '7A', 'V10']
```

---

## ✅ Validation

- [x] `npm run test -- src/features/grading` → 99/99 passés
- [x] TypeScript strict (pas de `any`)
- [x] Exports nommés uniquement
- [x] Couverture ≥ 80% (règle 07)

---

## 🚀 Utilisation Future

```typescript
// Dans un composant UI (Phase 6.3)
import { convertGrade, getGradeValues } from '@/features/grading/utils/grade-converter';

// Afficher grade converti
const { value, isApproximate } = convertGrade(beta.grade_value, beta.grade_system, userPreference);
// Affiche: "~V3" si isApproximate, sinon "V6"

// Peupler un dropdown
const options = getGradeValues('fontainebleau');
// → ['3', '4', '5', '5+', '6A', ...]
```
