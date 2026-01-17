# Rapport de Tâche - Phase 3.4 : Pipeline Complet (Orchestration)

**Date** : 2026-01-18  
**Statut** : ✅ Terminé  
**Commit** : (à venir)  

---

## ✅ Tâches Accomplies

### 1. Mise à Jour du Schéma Zod (Phase 3.1 Revisited)

#### [image.schema.ts](file:///f:/Portfolio/dev/BetaGraph/src/lib/schemas/image.schema.ts)

**Modification** : `ProcessedImageSchema.format`

**Avant** :
```typescript
format: z.literal('webp')
```

**Après** :
```typescript
format: z.enum(['webp', 'jpeg'], {
  message: 'Le format final doit être WebP ou JPEG.',
})
```

**Justification** :
- **Cohérence avec Phase 3.3** : Stratégie de fallback peut retourner JPEG
- **Type-safety maintenue** : Enum fermé (pas `string` générique)
- **Validation stricte** : Zod garantit format valide `'webp' | 'jpeg'`

**Impact TypeScript** :
```typescript
type ProcessedImage = {
  // ...
  format: 'webp' | 'jpeg'; // Précis, pas 'string'
}
```

---

### 2. Création de l'Orchestrateur

#### [process-image.ts](file:///f:/Portfolio/dev/BetaGraph/src/lib/utils/image/process-image.ts)

Fichier central qui orchestre le pipeline complet de traitement d'image.

**Organisation** :
- ✅ Fonction `processImageForUpload()` (149 lignes)
- ✅ Imports des 3 phases (validation, normalisation, compression)
- ✅ Gestion d'erreur globale
- ✅ Logging de métriques en développement

---

### 3. Fonction `processImageForUpload()`

**Signature** :

```typescript
export async function processImageForUpload(
  file: File
): Promise<ProcessedImage>
```

**Pipeline en 5 Étapes** :

#### Étape 1 : Validation Initiale (Phase 3.1)

```typescript
const validation = ImageUploadSchema.safeParse({ file });
if (!validation.success) {
  const firstError = validation.error.issues[0];
  throw new Error(
    `Fichier invalide : ${firstError?.message || 'Format ou taille non conforme'}`
  );
}
```

**Vérifications** :
- Format : JPEG, PNG, WebP, HEIC
- Taille : ≤ 15 Mo

**Si échec** : Rejection avec message Zod en français

---

#### Étape 2 : Normalisation EXIF (Phase 3.2)

```typescript
const normalized = await normalizeImageOrientation(file);
// → { blob: Blob (JPEG 0.95), width, height, wasRotated, originalOrientation }
```

**Actions** :
- Lecture métadonnées EXIF (orientation 1-8)
- Rotation physique sur Canvas
- Conversion → Blob JPEG qualité 0.95

**Temps typique** : 50-400ms (JPEG) | 3-8s (HEIC avec polyfill)

---

#### Étape 3 : Compression WebP (Phase 3.3)

```typescript
const compressed = await compressImage(normalized.blob);
// → Blob (WebP ou JPEG selon fallback)
```

**Actions** :
- Compression itérative jusqu'à ≤ 2 Mo
- Redimensionnement si > 1920px
- Fallback JPEG si WebP plus lourd (rare)

**Temps typique** : 100-500ms

---

#### Étape 4 : Calculs Finaux

**A. Détection du Format Final**

```typescript
const finalFormat = compressed.type === 'image/webp' 
  ? ('webp' as const) 
  : ('jpeg' as const);
```

**Stratégie** : Inspection du MIME type du Blob final
- `'image/webp'` → `format: 'webp'`
- `'image/jpeg'` → `format: 'jpeg'` (fallback Phase 3.3)

**Avantages** :
- ✅ Pas de supposition basée sur fichier d'origine
- ✅ Format réel détectable à chaque étape
- ✅ Compatible avec stratégie de fallback

**B. Calcul de l'Aspect Ratio**

```typescript
const aspectRatio = normalized.width / normalized.height;
```

**Utilité** : Canvas responsive (Phase 4)
- Portrait 1080×1920 → `aspectRatio = 0.5625`
- Paysage 1920×1080 → `aspectRatio = 1.777...`
- Carré 1000×1000 → `aspectRatio = 1.0`

**C. Taille Finale**

```typescript
const sizeInBytes = compressed.size;
```

**Contrainte** : Zod validera `sizeInBytes ≤ 2_097_152` (2 Mo)

---

#### Étape 5 : Validation Finale (Phase 3.1)

```typescript
const result: ProcessedImage = {
  blob: compressed,
  width: normalized.width,
  height: normalized.height,
  aspectRatio,
  format: finalFormat,
  sizeInBytes,
  orientation: normalized.originalOrientation,
};

const finalValidation = ProcessedImageSchema.safeParse(result);
if (!finalValidation.success) {
  const firstError = finalValidation.error.issues[0];
  throw new Error(
    `Validation finale échouée : ${firstError?.message}`
  );
}

return finalValidation.data;
```

**Garanties** :
- ✅ Type-safety absolue (`ProcessedImage` inféré de Zod)
- ✅ Pas de donnée invalide qui passe
- ✅ Dimensions 600-4096px validées
- ✅ AspectRatio 0.25-4 validé
- ✅ Taille ≤ 2 Mo validée

---

### 4. Gestion d'Erreur Globale

**Stratégie Try/Catch Englobant** :

```typescript
try {
  // Les 5 étapes du pipeline
} catch (error) {
  if (error instanceof Error) {
    throw new Error(
      `Échec du traitement de l'image : ${error.message}`
    );
  }
  throw new Error(
    "Échec du traitement de l'image : Erreur inconnue. " +
    'Vérifiez que le fichier est une image valide.'
  );
}
```

**Propagation d'Erreur** :

| Étape | Erreur Possible | Message Utilisateur |
|-------|----------------|---------------------|
| 1. Validation | Format/taille invalide | "Fichier invalide : La taille... 15 Mo" |
| 2. Normalisation | EXIF corrompu, timeout HEIC | "Échec... Timeout: Le traitement..." |
| 3. Compression | Out of memory | "Échec... suffisamment de mémoire" |
| 4. Calculs | N/A (pas d'erreur possible) | - |
| 5. Validation finale | Dimensions/poids hors limites | "Validation finale échouée : La largeur..." |

**Avantages** :
- Messages en cascade avec contexte
- Pas de perte d'information d'erreur
- Toujours en français (Règle 00)

---

### 5. Logging de Métriques (Développement)

**Implémentation** :

```typescript
if (process.env.NODE_ENV === 'development') {
  const endTime = performance.now();
  const processingTime = ((endTime - startTime) / 1000).toFixed(2);
  const originalSize = file.size;
  const compressionRatio = (
    ((originalSize - sizeInBytes) / originalSize) * 100
  ).toFixed(1);

  console.debug(
    `[Image Pipeline] Traitement terminé | ` +
    `Fichier: ${file.name} | ` +
    `Original: ${(originalSize / 1024 / 1024).toFixed(2)} Mo → ` +
    `Final: ${(sizeInBytes / 1024 / 1024).toFixed(2)} Mo (${finalFormat.toUpperCase()}) | ` +
    `Gain: ${compressionRatio}% | ` +
    `Dimensions: ${normalized.width}x${normalized.height} | ` +
    `Rotation: ${normalized.wasRotated ? 'Oui' : 'Non'} | ` +
    `Temps: ${processingTime}s`
  );
}
```

**Exemple de Log** :

```
[Image Pipeline] Traitement terminé | 
  Fichier: IMG_1234.HEIC | 
  Original: 3.42 Mo → Final: 1.28 Mo (WEBP) | 
  Gain: 62.6% | 
  Dimensions: 1920x1440 | 
  Rotation: Oui | 
  Temps: 5.84s
```

**Informations Tracées** :
1. **Fichier** : Nom original
2. **Poids** : Original → Final (+ format final)
3. **Gain** : % de réduction
4. **Dimensions** : Largeur × Hauteur finale
5. **Rotation** : Appliquée ou non (EXIF)
6. **Temps** : Durée totale du pipeline

**Utilité** :
- Débugger performance
- Vérifier gains de compression réels
- Tracer cas de fallback JPEG
- Optimiser paramètres si besoin

---

## 📁 Arborescence Créée/Modifiée

```
BetaGraph/
├── src/
│   ├── lib/
│   │   ├── schemas/
│   │   │   └── image.schema.ts          [MODIFIÉ - format enum]
│   │   └── utils/
│   │       └── image/
│   │           ├── normalize-orientation.ts  [Phase 3.2]
│   │           ├── compress-image.ts         [Phase 3.3]
│   │           └── process-image.ts          [NOUVEAU - 149 lignes]
└── docs/
    └── reports/
        └── phase-3/
            ├── 01-schema-validation.md
            ├── 02-exif-normalization.md
            ├── 03-webp-compression.md
            └── 04-pipeline-orchestration.md  [CE FICHIER]
```

---

## 🧪 Validation

### TypeScript

**Commande** : `npm run precommit`

**Résultat** : ✅ **0 erreurs**

**Vérifications** :
1. Imports des 3 phases correctement typés
2. `ProcessedImage` type inféré de Zod
3. Gestion d'erreur type-safe
4. Correction Zod API : `.issues` au lieu de `.errors`

---

### Conformité Règles

| Règle | Vérification | Statut |
|-------|--------------|--------|
| **02 - Exports nommés** | `export async function processImageForUpload` | ✅ |
| **02 - any interdit** | Aucun `any` dans le fichier | ✅ |
| **00 - Messages FR** | Tous les messages d'erreur en français | ✅ |
| **01 - Justification Type MIME** | Détection via `blob.type` documentée | ✅ |
| **04 - Workflow manuel** | `npm run precommit` exécuté avec succès | ✅ |

---

## ⚠️ Décisions Architecturales

### 1. Double Validation Zod (Entrée + Sortie)

**Choix** : Valider au début (étape 1) ET à la fin (étape 5)

**Raisons** :
- **Entrée** : Rejet rapide des fichiers invalides (fail-fast)
- **Sortie** : Garantie de conformité avant retour (type-safety)
- **Sécurité** : Pas de donnée corrompue qui passe à travers

**Alternative rejetée** : Validation uniquement en sortie
- Gaspillage de CPU/RAM sur fichiers invalides
- Pas de feedback immédiat à l'utilisateur

---

### 2. Détection Format via `blob.type` (Pas Fichier Original)

**Choix** : Inspecter le MIME type du Blob final

**Problématique Résolue** :

```
File HEIC → normalizeImage → Blob JPEG → compressImage → Blob WebP
(image/heic)                (image/jpeg)                (image/webp)

Format final = blob.type === 'image/webp' ? 'webp' : 'jpeg'
```

**Avantages** :
- ✅ Format réel détecté (pas de supposition)
- ✅ Compatible avec fallback Phase 3.3
- ✅ Pas de perte d'information MIME

**Alternative rejetée** : Déduire du fichier original
- Incohérent avec transformations du pipeline
- Impossible de détecter fallback JPEG

---

### 3. Gestion d'Erreur avec Messages en Cascade

**Choix** : Contexte ajouté à chaque niveau

```typescript
// Niveau Zod
"La taille du fichier ne peut pas dépasser 15 Mo."

// Niveau Pipeline
"Fichier invalide : La taille du fichier ne peut pas dépasser 15 Mo."

// Niveau Appelant (Phase 3.6)  
"Échec du traitement de l'image : Fichier invalide : La taille..."
```

**Avantages** :
- Traçabilité complète
- Contexte préservé
- Debugging facilité

---

### 4. Logging Conditionnel (Développement Uniquement)

**Choix** : `if (process.env.NODE_ENV === 'development')`

**Raisons** :
- **Dev** : Traçabilité métriques de performance
- **Prod** : Pas de pollution console client
- **Performance** : Pas d'overhead en production

**Métriques Essentielles** :
- Gain de compression (validation stratégie)
- Temps total (détection goulots d'étranglement)
- Cas de fallback JPEG (monitoring rare cas)

---

## 📊 Métriques

| Métrique | Valeur |
|----------|--------|
| **Fichiers créés** | 1 (`process-image.ts`) |
| **Fichiers modifiés** | 1 (`image.schema.ts`) |
| **Lignes de code** | 149 (orchestrateur) |
| **Fonctions exportées** | 1 (`processImageForUpload`) |
| **Phases intégrées** | 3 (3.1 + 3.2 + 3.3) |
| **Validations Zod** | 2 (entrée + sortie) |
| **Gestion d'erreur** | 7 cas (validation × 2, normalisation, compression, inconnue × 2, finale) |
| **Logs debug** | 1 récapitulatif complet |
| **Documentation JSDoc** | Complète + exemples |
| **Temps TypeScript** | 0 erreurs |
| **Complexité** | Élevée (orchestration multi-phases) |

---

## 🔜 Prochaines Étapes

**Phase 3.5 - Upload Supabase Storage** :
- [ ] Créer `src/lib/supabase/upload-boulder-image.ts`
- [ ] Générer nom unique (`uuid.webp` ou `uuid.jpg` selon format)
- [ ] Upload vers bucket `boulders` (path: `{user_id}/{boulder_id}.{ext}`)
- [ ] Retourner URL publique
- [ ] Gestion d'erreur Storage

**Phase 3.6 - Hook d'Upload Complet** :
- [ ] Créer `src/features/boulder/hooks/useImageUpload.ts`
- [ ] États : `isProcessing`, `progress`, `error`
- [ ] Appeler `processImageForUpload` + upload Storage
- [ ] Gestion d'erreur avec messages utilisateur FR

---

## 📝 Notes Importantes

### Flux Complet End-to-End

```typescript
// Composant UI (Phase 3.6)
const handleUpload = async (file: File) => {
  try {
    // Phase 3.4 : Pipeline complet
    const processed = await processImageForUpload(file);
    // → { blob, width, height, aspectRatio, format, sizeInBytes, orientation }
    
    // Phase 3.5 : Upload Supabase
    const url = await uploadBoulderImage(processed.blob, processed.format);
    // → "https://...supabase.co/storage/v1/object/public/boulders/..."
    
    // Phase 4 : Canvas (utilise width, height, aspectRatio)
    initializeCanvas(processed.width, processed.height, processed.aspectRatio);
    
  } catch (error) {
    showErrorToUser(error.message); // Messages déjà en français
  }
};
```

---

### Performance Attendue du Pipeline Complet

**Benchmarks Typiques** :

| Scénario | Validation | Normalisation | Compression | Total |
|----------|-----------|---------------|-------------|-------|
| JPEG 3MP sans EXIF | 5ms | 50ms | 100ms | **155ms** |
| JPEG 12MP EXIF=6 | 5ms | 400ms | 450ms | **855ms** |
| HEIC 12MP | 5ms | 5000ms | 500ms | **5.5s** |
| PNG 8MP | 5ms | 200ms | 300ms | **505ms** |

**Moyenne attendue** : **500ms - 1s** (JPEG/PNG) | **5-6s** (HEIC)

---

### Type Flow Complet

```typescript
// Entrée
File (HEIC, JPEG, PNG, WebP)

// Phase 3.1
ImageUploadSchema.parse({ file })
↓ (validé)

// Phase 3.2
normalizeImageOrientation(file)
↓ NormalizedImage { blob: Blob (JPEG 0.95), width, height, ... }

// Phase 3.3
compressImage(blob)
↓ Blob (WebP ou JPEG)

// Phase 3.4 (CE RAPPORT)
processImageForUpload(file)
↓ ProcessedImage { blob, width, height, aspectRatio, format, sizeInBytes, orientation }

// Phase 3.5
uploadBoulderImage(blob, format)
↓ URL string

// Phase 4
Canvas avec dimensions et aspectRatio
```

---

### Exemple d'Utilisation Complet

```typescript
import { processImageForUpload } from '@/lib/utils/image/process-image';

async function handleBoulderPhotoUpload(file: File) {
  try {
    console.log('Traitement de l\'image...');
    
    const processed = await processImageForUpload(file);
    
    console.log('Image traitée avec succès :');
    console.log(`- Dimensions: ${processed.width}x${processed.height}`);
    console.log(`- Format: ${processed.format.toUpperCase()}`);
    console.log(`- Poids: ${(processed.sizeInBytes / 1024 / 1024).toFixed(2)} Mo`);
    console.log(`- Aspect ratio: ${processed.aspectRatio.toFixed(3)}`);
    
    // Upload vers Supabase (Phase 3.5)
    const url = await uploadToStorage(processed.blob, processed.format);
    console.log(`URL: ${url}`);
    
    return { processed, url };
    
  } catch (error) {
    if (error instanceof Error) {
      // Message déjà en français et contextualisé
      alert(`Erreur : ${error.message}`);
      console.error(error);
    }
  }
}
```

---

## ✅ Validation Phase 3.4

### Checklist Complète

**Schéma Mis à Jour** :
- [x] `ProcessedImageSchema.format` changé en enum `['webp', 'jpeg']`
- [x] JSDoc mise à jour (format webp|jpeg)
- [x] Type TypeScript inféré : `'webp' | 'jpeg'`

**Orchestrateur Créé** :
- [x] Fichier `process-image.ts` créé
- [x] Fonction async `processImageForUpload(file: File): Promise<ProcessedImage>`
- [x] Étape 1 : Validation initiale (Zod)
- [x] Étape 2 : Normalisation EXIF
- [x] Étape 3 : Compression WebP
- [x] Étape 4 : Calculs (aspectRatio, format, sizeInBytes)
- [x] Étape 5 : Validation finale (Zod)

**Qualité** :
- [x] TypeScript 0 erreurs (correction `.issues` au lieu de `.errors`)
- [x] Exports nommés uniquement
- [x] Messages d'erreur en français
- [x] Gestion d'erreur globale avec contexte
- [x] Logs debug métriques (dev only)
- [x] JSDoc exhaustive
- [x] TODO.md mis à jour

**Documentation** :
- [x] Rapport complet (`04-pipeline-orchestration.md`)
- [x] Décisions architecturales justifiées
- [x] Benchmarks et flux de données
- [x] Exemples d'utilisation

---

**Statut global** : ✅ **PHASE 3.4 VALIDÉE**  
**Pipeline Complet** : Prêt pour Phase 3.5 (Upload Supabase Storage)
