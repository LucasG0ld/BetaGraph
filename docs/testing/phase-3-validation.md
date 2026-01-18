# Plan de Validation - Phase 3 : Pipeline d'Image Complet

**Date** : 2026-01-18  
**Objectif** : Valider l'intégralité du pipeline d'image avant Phase 4  

---

## 📋 Vue d'Ensemble

**Pipeline à valider** :
```
File (user) → [3.1 Validation] → [3.2 EXIF] → [3.3 Compression] 
            → [3.4 Orchestration] → [3.5 Upload] → [3.6 Hook React] 
            → URL Cloud + Métadonnées ✅
```

**Stratégie de test** :
1. ✅ **Tests Unitaires** : Chaque phase individuellement
2. ✅ **Tests d'Intégration** : Pipeline complet end-to-end
3. ✅ **Tests Manuels** : Validation visuelle et UX

---

## 🧪 Tests Automatisés (Vitest)

### Test 1 : Validation Zod (Phase 3.1)

**Fichier** : `src/lib/schemas/__tests__/image.schema.test.ts`

**Scénarios** :
```typescript
describe('ImageUploadSchema', () => {
  it('accepte fichier JPEG valide < 15Mo', () => {
    const file = new File([new ArrayBuffer(1024 * 1024)], 'test.jpg', {
      type: 'image/jpeg'
    });
    expect(() => ImageUploadSchema.parse({ file })).not.toThrow();
  });

  it('rejette fichier > 15Mo', () => {
    const file = new File([new ArrayBuffer(16 * 1024 * 1024)], 'big.jpg', {
      type: 'image/jpeg'
    });
    expect(() => ImageUploadSchema.parse({ file })).toThrow(/15 Mo/);
  });

  it('rejette format PDF', () => {
    const file = new File([new ArrayBuffer(1024)], 'doc.pdf', {
      type: 'application/pdf'
    });
    expect(() => ImageUploadSchema.parse({ file })).toThrow(/Format non supporté/);
  });
});

describe('ProcessedImageSchema', () => {
  it('accepte format webp ET jpeg', () => {
    const validWebP = {
      blob: new Blob(),
      width: 1920,
      height: 1080,
      aspectRatio: 1920 / 1080,
      format: 'webp' as const,
      sizeInBytes: 1_000_000,
    };
    expect(() => ProcessedImageSchema.parse(validWebP)).not.toThrow();

    const validJPEG = { ...validWebP, format: 'jpeg' as const };
    expect(() => ProcessedImageSchema.parse(validJPEG)).not.toThrow();
  });

  it('rejette dimensions < 600px', () => {
    const tooSmall = {
      blob: new Blob(),
      width: 500,
      height: 400,
      aspectRatio: 500 / 400,
      format: 'webp' as const,
      sizeInBytes: 100_000,
    };
    expect(() => ProcessedImageSchema.parse(tooSmall)).toThrow(/600px/);
  });
});
```

---

### Test 2 : Normalisation EXIF (Phase 3.2)

**Fichier** : `src/lib/utils/image/__tests__/normalize-orientation.test.ts`

**Scénarios** :
```typescript
describe('normalizeImageOrientation', () => {
  it('retourne blob JPEG qualité 0.95', async () => {
    const file = await loadTestImage('portrait.jpg');
    const result = await normalizeImageOrientation(file);
    
    expect(result.blob.type).toBe('image/jpeg');
    expect(result.wasRotated).toBeDefined();
  });

  it('détecte et corrige EXIF orientation=6 (90° rotation)', async () => {
    const portraitFile = await loadTestImage('portrait-exif6.jpg');
    const result = await normalizeImageOrientation(portraitFile);
    
    expect(result.originalOrientation).toBe(6);
    expect(result.wasRotated).toBe(true);
    // Dimensions inversées après rotation
    expect(result.width).toBeGreaterThan(result.height);
  });

  it('gère images sans EXIF (passthrough)', async () => {
    const screenshot = await loadTestImage('screenshot.png');
    const result = await normalizeImageOrientation(screenshot);
    
    expect(result.originalOrientation).toBe(1);
    expect(result.wasRotated).toBe(false);
  });
});
```

---

### Test 3 : Compression WebP (Phase 3.3)

**Fichier** : `src/lib/utils/image/__tests__/compress-image.test.ts`

**Scénarios** :
```typescript
describe('compressImage', () => {
  it('compresse JPEG 3MB → WebP < 2MB', async () => {
    const largeBlob = await createTestBlob(3 * 1024 * 1024, 'image/jpeg');
    const result = await compressImage(largeBlob);
    
    expect(result.type).toBe('image/webp');
    expect(result.size).toBeLessThan(2 * 1024 * 1024);
  });

  it('redimensionne 4000x3000 → max 1920px', async () => {
    // Note: Test difficile car besoin de vrai Canvas
    // Alternative: Mock browser-image-compression
  });

  it('retourne JPEG si WebP plus lourd (fallback)', async () => {
    // Cas rare, difficile à reproduire en test
    // Mock nécessaire
  });
});
```

---

### Test 4 : Pipeline Complet (Phase 3.4)

**Fichier** : `src/lib/utils/image/__tests__/process-image.test.ts`

**Scénarios** :
```typescript
describe('processImageForUpload', () => {
  it('rejette fichier invalide (Phase 3.1)', async () => {
    const pdfFile = new File([new ArrayBuffer(1024)], 'doc.pdf', {
      type: 'application/pdf'
    });
    
    await expect(processImageForUpload(pdfFile))
      .rejects.toThrow(/Format non supporté/);
  });

  it('pipeline complet JPEG → ProcessedImage', async () => {
    const jpegFile = await loadTestImage('photo.jpg');
    const result = await processImageForUpload(jpegFile);
    
    expect(result).toMatchObject({
      blob: expect.any(Blob),
      width: expect.any(Number),
      height: expect.any(Number),
      aspectRatio: expect.any(Number),
      format: expect.stringMatching(/^(webp|jpeg)$/),
      sizeInBytes: expect.any(Number),
    });
    
    expect(result.sizeInBytes).toBeLessThanOrEqual(2 * 1024 * 1024);
  });
});
```

---

### Test 5 : Upload Supabase (Phase 3.5)

**Fichier** : `src/lib/supabase/__tests__/storage.test.ts`

**Scénarios** :
```typescript
describe('uploadBoulderImage', () => {
  it('rejette si pas de session', async () => {
    // Mock getSession() → null
    mockSupabaseSession(null);
    
    const blob = new Blob(['test'], { type: 'image/webp' });
    await expect(uploadBoulderImage(blob, 'webp'))
      .rejects.toThrow(/connecté/);
  });

  it('upload avec session valide → URL publique', async () => {
    mockSupabaseSession({ user: { id: 'user-123' } });
    mockSupabaseUpload({ success: true, path: 'user-123/uuid.webp' });
    
    const blob = new Blob(['test'], { type: 'image/webp' });
    const url = await uploadBoulderImage(blob, 'webp');
    
    expect(url).toContain('supabase.co/storage/v1/object/public/boulders');
    expect(url).toContain('user-123');
    expect(url).toMatch(/\.webp$/);
  });
});
```

---

### Test 6 : Hook React (Phase 3.6)

**Fichier** : `src/features/boulder/hooks/__tests__/useImageUpload.test.ts`

**Scénarios** :
```typescript
import { renderHook, act } from '@testing-library/react';

describe('useImageUpload', () => {
  it('états initiaux corrects', () => {
    const { result } = renderHook(() => useImageUpload());
    
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.isUploading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.imageUrl).toBeNull();
  });

  it('reset efface tous les états', () => {
    const { result } = renderHook(() => useImageUpload());
    
    // Simuler upload réussi (mock)
    act(() => {
      // Set states manually for test
    });
    
    act(() => {
      result.current.reset();
    });
    
    expect(result.current.error).toBeNull();
    expect(result.current.imageUrl).toBeNull();
  });

  it('upload déclenche isProcessing puis isUploading', async () => {
    const { result } = renderHook(() => useImageUpload());
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    await act(async () => {
      await result.current.upload(file);
    });
    
    // Vérifier que états ont été mis à jour correctement
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.isUploading).toBe(false);
    // Vérifier URL ou erreur selon mock
  });
});
```

---

## 🖐️ Tests Manuels (Interface Navigateur)

### Test Manuel 1 : Upload Portrait avec EXIF

**Objectif** : Vérifier correction rotation EXIF

**Étapes** :
1. Prendre photo portrait avec iPhone/Android (EXIF orientation=6)
2. Upload via interface
3. **Vérification** : Image affichée en orientation correcte (pas couchée)

**Résultat attendu** :
- ✅ `imageData.wasRotated = true`
- ✅ `imageData.originalOrientation = 6`
- ✅ Dimensions inversées (width > height après rotation)

---

### Test Manuel 2 : Upload Image > 5MB

**Objectif** : Vérifier compression efficace

**Étapes** :
1. Uploader photo 8MP (≈ 5-8 Mo JPEG)
2. Observer logs dev console
3. Vérifier taille finale

**Résultat attendu** :
- ✅ Traitement réussi (pas d'erreur)
- ✅ Taille finale < 2 Mo
- ✅ Gain compression affiché (ex: "Gain: 65%")

---

### Test Manuel 3 : Upload JPEG → Conversion WebP

**Objectif** : Vérifier conversion format

**Étapes** :
1. Uploader JPEG 3MP
2. Vérifier URL finale
3. Inspecter `imageData.format`

**Résultat attendu** :
- ✅ URL se termine par `.webp`
- ✅ `imageData.format = 'webp'`
- ✅ Pas de fallback JPEG (sauf cas rare)

---

### Test Manuel 4 : Feedback UI États Différenciés

**Objectif** : Vérifier UX states (isProcessing vs isUploading)

**Étapes** :
1. Uploader HEIC 12MP (traitement long)
2. Observer messages UI
3. Tester connexion lente (DevTools Network throttling)

**Résultat attendu** :
- ✅ Message "Optimisation..." affiché pendant 3-6s
- ✅ Puis "Envoi..." affiché pendant 1-3s
- ✅ États ne se chevauchent pas

---

### Test Manuel 5 : Gestion d'Erreur

**Objectif** : Vérifier messages d'erreur

**Scénarios** :
1. **Upload PDF** : "Format non supporté..."
2. **Upload 20MB** : "Taille... 15 Mo"
3. **Pas de session** : "Vous devez être connecté..."
4. **Déconnexion pendant upload** : "Session expirée..."

**Résultat attendu** :
- ✅ Messages en français
- ✅ Erreur affichée clairement
- ✅ Reset fonctionne après erreur

---

## 📝 Checklist de Validation

### Phase 3.1 - Validation Zod
- [ ] Test : Fichier JPEG < 15Mo → Accepté
- [ ] Test : Fichier > 15Mo → Rejeté avec message FR
- [ ] Test : Format PDF → Rejeté
- [ ] Test : ProcessedImage valide → Accepté
- [ ] Test : Dimensions < 600px → Rejeté

### Phase 3.2 - Normalisation EXIF
- [ ] Test : Photo portrait EXIF=6 → Rotation appliquée
- [ ] Test : Screenshot sans EXIF → Passthrough
- [ ] Test : HEIC iPhone → Décodage correct
- [ ] Test : Blob retourné = JPEG qualité 0.95

### Phase 3.3 - Compression WebP
- [ ] Test : Image 5MB → Compressée < 2MB
- [ ] Test : Image 4000px → Redimensionnée ≤ 1920px
- [ ] Test : Format final = WebP (sauf fallback rare)
- [ ] Test : Qualité visuelle acceptable

### Phase 3.4 - Pipeline Orchestration
- [ ] Test : Validation → Normalisation → Compression → Succès
- [ ] Test : Erreur validation → Pipeline arrêté immédiatement
- [ ] Test : AspectRatio calculé correctement
- [ ] Test : Format détecté via blob.type

### Phase 3.5 - Upload Supabase
- [ ] Test : Session valide → Upload réussi
- [ ] Test : Pas de session → Erreur "connecté"
- [ ] Test : URL retournée = publique, correcte
- [ ] Test : Fichier stocké dans `{userId}/{uuid}.{format}`

### Phase 3.6 - Hook React
- [ ] Test : États initiaux corrects
- [ ] Test : upload() déclenche isProcessing → isUploading
- [ ] Test : reset() efface tous les états
- [ ] Test : Erreur capturée et affichée
- [ ] Test : imageUrl + imageData set après succès

---

## 🚀 Actions Requises

### 1. Créer Tests Automatisés

**Commande** :
```bash
# Créer les fichiers de test
mkdir -p src/lib/schemas/__tests__
mkdir -p src/lib/utils/image/__tests__
mkdir -p src/lib/supabase/__tests__
mkdir -p src/features/boulder/hooks/__tests__

# Exécuter les tests
npm run test
```

### 2. Tests Manuels dans le Navigateur

**Création d'une Page de Test** :
```bash
# Créer page de test temporaire
touch src/app/test-upload/page.tsx
```

**Contenu minimal** :
```tsx
'use client';
import { useImageUpload } from '@/features/boulder/hooks/useImageUpload';

export default function TestUploadPage() {
  const { upload, isProcessing, isUploading, error, imageUrl, imageData, reset } = 
    useImageUpload();

  return (
    <div className="p-8">
      <h1>Test Upload Phase 3</h1>
      
      <input 
        type="file" 
        accept="image/*"
        onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
      />

      {isProcessing && <p>🔄 Optimisation...</p>}
      {isUploading && <p>🌐 Envoi...</p>}
      {error && <p className="text-red-500">❌ {error}</p>}
      
      {imageUrl && imageData && (
        <div>
          <p>✅ Succès !</p>
          <img src={imageUrl} alt="Test" className="max-w-md" />
          <pre>{JSON.stringify(imageData, null, 2)}</pre>
          <button onClick={reset}>Reset</button>
        </div>
      )}
    </div>
  );
}
```

### 3. Exécution

```bash
# Lancer dev server
npm run dev

# Ouvrir navigateur
# http://localhost:3000/test-upload
```

---

## ✅ Critères de Succès

**Phase 3 validée si** :
- ✅ Tous les tests automatisés passent (0 erreurs)
- ✅ Tests manuels confirmés (ckecklists cochées)
- ✅ Aucun bug critique détecté
- ✅ Performance acceptable (< 6s pour HEIC)
- ✅ Messages d'erreur clairs en français

**Alors** : Phase 4 (Canvas) peut démarrer ! 🎨
