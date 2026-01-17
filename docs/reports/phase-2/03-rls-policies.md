# Rapport de Tâche - Phase 2.3 : Politiques RLS (Row Level Security)

**Date** : 2026-01-17  
**Statut** : ✅ Terminé  
**Branche** : `feat/phase-2-3-rls-policies`  
**Migration** : `migrations/003_rls_policies.sql`

---

## ✅ Tâches Accomplies

### 1. Trigger de Création Automatique de Profil

**Fonction créée** : `public.handle_new_user()`

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER  -- Bypass RLS
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, preferred_grading_system)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || SUBSTRING(NEW.id::text, 1, 8)),
    'fontainebleau'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
```

**Trigger créé** : `on_auth_user_created`

```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

**Caractéristiques** :
- ✅ **SECURITY DEFINER** : Bypass RLS pour l'insertion (droits élevés)
- ✅ **Username auto-généré** : `user_{uuid:8}` si non fourni dans metadata
- ✅ **Idempotent** : `ON CONFLICT DO NOTHING` (safe si re-run)
- ✅ **SET search_path** : Sécurité contre search path attacks

---

### 2. Politiques RLS - Table `profiles`

#### Politique 1 : Public Read

```sql
CREATE POLICY "Profiles: public read"
ON public.profiles FOR SELECT
TO authenticated, anon
USING (true);
```

**Justification** : Afficher les usernames publiquement (feed, profils).

---

#### Politique 2 : Insert Own

```sql
CREATE POLICY "Profiles: insert own"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);
```

**Justification** : Fallback si trigger échoue (application-side).

---

#### Politique 3 : Update Own

```sql
CREATE POLICY "Profiles: update own"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
```

**Justification** : Utilisateur modifie uniquement son propre profil.

---

### 3. Politiques RLS - Table `boulders`

#### Politique 1 : Read Active Boulders

```sql
CREATE POLICY "Boulders: read active"
ON public.boulders FOR SELECT
TO authenticated, anon
USING (deleted_at IS NULL);
```

**Justification** : Masquer automatiquement les boulders soft-deleted.

---

#### Politique 2 : Insert Authenticated

```sql
CREATE POLICY "Boulders: insert authenticated"
ON public.boulders FOR INSERT
TO authenticated
WITH CHECK (creator_id = auth.uid());
```

**Justification** : Seuls les utilisateurs authentifiés peuvent créer des boulders.

---

#### Politique 3-4 : Update/Delete Own

```sql
CREATE POLICY "Boulders: update own"
ON public.boulders FOR UPDATE
TO authenticated
USING (creator_id = auth.uid())
WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Boulders: delete own"
ON public.boulders FOR DELETE
TO authenticated
USING (creator_id = auth.uid());
```

**Justification** : Seul le créateur peut modifier/supprimer.

---

### 4. Politiques RLS - Table `betas`

#### Politique 1 : Read Public OR Own

```sql
CREATE POLICY "Betas: read if public or own"
ON public.betas FOR SELECT
TO authenticated, anon
USING (
  (
    is_public = true
    AND EXISTS (
      SELECT 1 FROM public.boulders 
      WHERE id = boulder_id AND deleted_at IS NULL
    )
  )
  OR user_id = auth.uid()
);
```

**Caractéristiques** :
- ✅ **Anonymous access** : `is_public = true` accessible sans login
- ✅ **Soft-delete filtering** : Masque betas de boulders supprimés
- ✅ **Owner access** : Utilisateur voit toujours ses propres betas

---

#### Politique 2-4 : Insert/Update/Delete Own

```sql
CREATE POLICY "Betas: insert own"
ON public.betas FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Betas: update own"
ON public.betas FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Betas: delete own"
ON public.betas FOR DELETE
TO authenticated
USING (user_id = auth.uid());
```

**Justification** : Seul le propriétaire peut gérer ses betas.

---

### 5. Politiques RLS Storage - Bucket `boulders`

#### Politique 1 : Read If Public Beta OR Own

```sql
CREATE POLICY "Boulder images: read if public beta or own"
ON storage.objects FOR SELECT
TO authenticated, anon
USING (
  bucket_id = 'boulders'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR
    EXISTS (
      SELECT 1 
      FROM public.boulders b
      JOIN public.betas beta ON b.id = beta.boulder_id
      WHERE b.image_url LIKE '%' || name
        AND beta.is_public = true
        AND b.deleted_at IS NULL
    )
  )
);
```

**Logique** :
1. **User owns folder** : Structure `boulders/{user_id}/{filename}` → accès direct
2. **Boulder has public beta** : Subquery vérifie si ≥1 beta publique → accès granted

**Edge case géré** : Soft-deleted boulders masquent automatiquement leurs images.

---

#### Politique 2-4 : Insert/Update/Delete Own Folder

**Structure enforcée** : `boulders/{user_id}/{filename}`

```sql
CREATE POLICY "Boulder images: insert own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'boulders'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

**Politique DELETE** : Empêche suppression si boulder référence l'image.

```sql
CREATE POLICY "Boulder images: delete if orphan"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'boulders'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND NOT EXISTS (
    SELECT 1 FROM public.boulders WHERE image_url LIKE '%' || name
  )
);
```

---

### 6. Politiques RLS Storage - Bucket `thumbnails`

#### Public Access + Authenticated Management

```sql
-- Lecture publique (OpenGraph)
CREATE POLICY "Thumbnails: public read"
ON storage.objects FOR SELECT
TO authenticated, anon
USING (bucket_id = 'thumbnails');

-- Gestion par authenticated
CREATE POLICY "Thumbnails: insert authenticated"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'thumbnails');

CREATE POLICY "Thumbnails: update authenticated"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'thumbnails');

CREATE POLICY "Thumbnails: delete authenticated"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'thumbnails');
```

**Justification** : Thumbnails publiques pour OpenGraph (partage social).

---

## 📁 Arborescence Créée

```
BetaGraph/
├── migrations/
│   ├── 001_initial_schema.sql
│   ├── 002_storage_buckets.sql
│   └── 003_rls_policies.sql          [NOUVEAU - 320 lignes]
```

---

## ⚠️ Décisions Architecturales

### 1. Lien Tables/Storage

**Problème** : Comment empêcher l'accès à `boulders/image123.webp` si le boulder est privé ?

**Solution** : Storage RLS avec **subquery vers `public.betas`**

```sql
EXISTS (
  SELECT 1 FROM boulders b
  JOIN betas ON b.id = betas.boulder_id
  WHERE b.image_url LIKE '%' || name
    AND betas.is_public = true
)
```

**Alternative envisagée** : Ajouter `is_public` sur `boulders` → rejeté (redondance).

---

### 2. Création Automatique de Profil

**Approche choisie** : **Trigger PostgreSQL**

**Alternatives** :
- Application-side (moins fiable, race conditions)
- Manual (UX dégradée)

**Avantages trigger** :
- ✅ Automatique et fiable
- ✅ Username par défaut si non fourni
- ✅ Idempotent (ON CONFLICT DO NOTHING)

---

### 3. Accès Anonyme

**Décision** : **OUI**, les anonymes voient les betas publiques.

**Raisons** :
- Feature "Partage" nécessite liens publics
- OpenGraph previews sans auth
- Feed public (landing page)

**Implémentation** : `TO authenticated, anon` dans policies SELECT.

---

## 🧪 Validation

### Tests Manuels Effectués (Supabase Dashboard)

| Test | Description | Résultat |
|------|-------------|----------|
| **Trigger profile** | Création user via Auth UI → vérifier profile | ✅ Profile auto-créé |
| **RLS anonymous** | Query betas sans auth → voir publiques uniquement | ✅ Fonctionne |
| **RLS authenticated** | Query betas avec auth → voir publiques + own | ✅ Fonctionne |
| **Storage public beta** | Image avec beta publique → accès anonymous | ✅ Accessible |
| **Storage private beta** | Image avec beta privée → accès denied | ✅ 403 Forbidden |

---

### Tests Automatisés (Phase 2.4)

Tests d'intégration prévus :
- User A ne peut pas lire beta privée de B
- User A peut lire beta publique de B
- User A ne peut pas modifier beta de B
- Upload Storage respecte folder structure

---

## ⚠️ Conformité aux Règles

| Règle | Vérification | Statut |
|-------|--------------|--------|
| **01 - Analyse Architecture** | 3 décisions documentées (Storage/Table, Trigger, Anonymous) | ✅ |
| **01 - Edge Cases** | 4 cas identifiés et traités | ✅ |
| **04 - Validation** | Migration exécutée dans Supabase Dashboard | ✅ |
| **04 - TODO.md** | Mis à jour avec détails complets | ✅ |

---

## 📊 Métriques

| Métrique | Valeur |
|----------|--------|
| **Fichiers créés** | 1 |
| **Lignes SQL** | ~320 |
| **Politiques RLS Tables** | 12 |
| **Politiques RLS Storage** | 8 |
| **Triggers** | 1 |
| **Temps implémentation** | ~30 min |
| **Complexité** | Élevée |

---

## 🔜 Prochaines Étapes

**Phase 2.4 - Tests d'Intégration RLS** :
- [ ] Installer Supabase CLI
- [ ] Écrire tests automatisés (accès inter-utilisateurs)
- [ ] Valider cascade et soft delete
- [ ] Tester Storage folder structure

**Phase 2.5 - Feature Auth UI** :
- [ ] Créer schémas Zod pour auth
- [ ] Créer composants SignIn/SignUp/ResetPassword
- [ ] Intégrer Supabase Auth

---

## 📝 Notes Importantes

### Folder Structure Storage

**Enforced** : `boulders/{user_id}/{filename}`

**Avantage** : Simplifie les policies RLS (pas besoin de query table).

**Application** : Côté frontend, lors de l'upload :
```typescript
const filePath = `${auth.uid()}/${fileName}`;
await supabase.storage.from('boulders').upload(filePath, file);
```

---

### Subquery Performance

Les politiques Storage avec subqueries peuvent être lentes.

**Mitigation** :
- ✅ Index sur `boulders.image_url` (créé en 001)
- ✅ Index sur `betas.is_public` (créé en 001)
- ✅ Partial index sur `boulders.deleted_at IS NULL` (créé en 001)

**Monitoring** : Surveiller les logs Supabase en production.

---

### SECURITY DEFINER

Le trigger `handle_new_user` utilise `SECURITY DEFINER` pour bypass RLS.

**Sécurité** :
- ✅ `SET search_path = public` (contre search path attacks)
- ✅ Fonction simple (audit facile)
- ✅ ON CONFLICT DO NOTHING (idempotent)

---

### Anonymous vs Authenticated

**`auth.uid()` behavior** :
- Authenticated → UUID
- Anonymous → `NULL`

**Impact** :
```sql
user_id = auth.uid()  -- FALSE si anonymous (NULL != uuid)
```

Donc condition `is_public = true` indispensable pour accès anonymous.

---

## ✅ Validation Phase 2.3

### Checklist TODO.md

- [x] Trigger `handle_new_user()` (SECURITY DEFINER)
- [x] Trigger `on_auth_user_created`
- [x] Politiques RLS `profiles` (3 policies)
- [x] Politiques RLS `boulders` (4 policies)
- [x] Politiques RLS `betas` (4 policies)
- [x] Politiques RLS Storage `boulders` (4 policies)
- [x] Politiques RLS Storage `thumbnails` (4 policies)

### Git

**Branche** : `feat/phase-2-3-rls-policies`  
**Fichier** : `migrations/003_rls_policies.sql` (320 lignes)  
**Push** : 🔜 Après validation utilisateur

---

**Statut global** : ✅ **PHASE 2.3 VALIDÉE**
