# Supabase CLI Setup Guide

**Version**: 1.0.0  
**Date**: 2026-01-17  
**Status**: Production Ready

---

## Overview

Ce guide explique comment installer et configurer la Supabase CLI pour exécuter les tests d'intégration RLS localement.

---

## Prerequisites

### Required

- **Docker Desktop** : Obligatoire pour la CLI Supabase (base de données locale)
  - Windows : [Docker Desktop for Windows](https://docs.docker.com/desktop/install/windows-install/)
  - Mac : [Docker Desktop for Mac](https://docs.docker.com/desktop/install/mac-install/)
  - Linux : [Docker Engine](https://docs.docker.com/engine/install/)

---

## Installation

### Windows (via Scoop)

**Recommandé** : Utiliser Scoop (gestionnaire de paquets)

```powershell
# 1. Installer Scoop (si non installé)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression

# 2. Ajouter le bucket Supabase
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git

# 3. Installer Supabase CLI
scoop install supabase

# 4. Vérifier l'installation
supabase --version
```

**Alternative** : [Télécharger l'installer](https://github.com/supabase/cli/releases)

---

### macOS (via Homebrew)

```bash
# Installer via Homebrew
brew install supabase/tap/supabase

# Vérifier l'installation
supabase --version
```

---

### Linux (via NPM ou Binary)

**Option 1 : NPM** (si Node.js installé)

```bash
npm install -g supabase
supabase --version
```

**Option 2 : Binary Direct**

```bash
# Télécharger le binaire
curl -OL https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64.tar.gz

# Extraire
tar -xzf supabase_linux_amd64.tar.gz

# Déplacer vers /usr/local/bin
sudo mv supabase /usr/local/bin/

# Vérifier
supabase --version
```

---

## Configuration du Projet

### 1. Lier le Projet Supabase

**Si projet existant** (cas de BetaGraph) :

```bash
# Se positionner à la racine du projet
cd f:\Portfolio\dev\BetaGraph

# Lier au projet Supabase Cloud
supabase link --project-ref YOUR_PROJECT_REF
```

**Trouver le Project Ref** :
1. Aller sur [Supabase Dashboard](https://app.supabase.com)
2. Sélectionner votre projet
3. Settings → General → Reference ID

**Entrer les credentials** :
- Database Password : Votre mot de passe Supabase

---

### 2. Initialiser Supabase Localement (Alternative)

**Si vous voulez travailler 100% local** :

```bash
supabase init
```

Crée la structure :
```
supabase/
├── config.toml
├── seed.sql
└── migrations/
```

---

## Exécution des Tests

### 1. Démarrer Docker

**Windows/Mac** : Lancer Docker Desktop

**Linux** :
```bash
sudo systemctl start docker
```

**Vérifier Docker** :
```bash
docker ps
```

---

### 2. Démarrer Base de Données Locale

```bash
# Démarrer tous les services Supabase locaux
supabase start

# Attendu: 
# - API URL: http://localhost:54321
# - DB URL: postgresql://postgres:postgres@localhost:54322/postgres
# - Studio URL: http://localhost:54323
```

**Première fois** : Téléchargement des images Docker (~500MB, 2-5 min).

---

### 3. Exécuter les Tests RLS

```bash
# Tous les tests
supabase test db

# Test spécifique
supabase test db supabase/tests/rls_test.sql
```

**Output attendu** :
```
1..10

ok 1 - Test 1.1: Anonymous users cannot read soft-deleted boulders
ok 2 - Test 1.2: Authenticated users cannot read soft-deleted boulders
ok 3 - Test 2.1: User Charlie cannot read Bob's private beta
ok 4 - Test 2.2: User Charlie cannot modify Bob's beta
ok 5 - Test 2.3: User Bob (owner) can update his own beta
ok 6 - Test 3.1: Anonymous users can read public betas
ok 7 - Test 3.2: Anonymous users cannot read private betas
ok 8 - Test 4.1: Profile is auto-created when auth.users is inserted
ok 9 - Test 4.2: Profile username matches raw_user_meta_data
ok 10 - Test 4.3: Profile username is auto-generated when metadata is empty
```

✅ **Tous les tests au vert** = RLS fonctionne correctement.

---

### 4. Arrêter les Services

```bash
# Arrêter tous les services
supabase stop

# Arrêter ET supprimer les données
supabase stop --no-backup
```

---

## Workflow de Développement

### Workflow Standard

```bash
# 1. Démarrer Supabase local
supabase start

# 2. Appliquer les migrations (si modifiées)
supabase db reset

# 3. Exécuter les tests
supabase test db

# 4. Développer...

# 5. Arrêter
supabase stop
```

---

### CI/CD Integration

**GitHub Actions** :

```yaml
name: Test Supabase RLS

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
      
      - name: Start Supabase
        run: supabase start
      
      - name: Run RLS tests
        run: supabase test db
      
      - name: Stop Supabase
        run: supabase stop
```

---

## Troubleshooting

### Problème : Docker non démarré

**Symptôme** :
```
Error: Cannot connect to the Docker daemon
```

**Solution** :
- Windows/Mac : Lancer Docker Desktop
- Linux : `sudo systemctl start docker`

---

### Problème : Port 54321 déjà utilisé

**Symptôme** :
```
Error: Bind for 0.0.0.0:54321 failed: port is already allocated
```

**Solution** :
```bash
# Vérifier quel processus utilise le port
netstat -ano | findstr :54321  # Windows
lsof -i :54321                  # Mac/Linux

# Arrêter le service existant
supabase stop

# Ou tuer le processus manuellement
```

---

### Problème : pgTAP non trouvé

**Symptôme** :
```
Error: extension "pgtap" is not available
```

**Solution** :
pgTAP est inclus par défaut dans Supabase CLI. Si erreur :

```bash
# Réinitialiser la base locale
supabase db reset

# Recréer les services
supabase stop --no-backup
supabase start
```

---

### Problème : Tests échouent avec "permission denied"

**Symptôme** :
```
Error: permission denied for table betas
```

**Cause** : RLS activé mais pas de politique correspondante.

**Solution** :
1. Vérifier que `migrations/003_rls_policies.sql` est appliqué
2. Exécuter `supabase db reset` pour réappliquer les migrations

---

### Problème : Windows WSL2 requis

**Symptôme** :
```
Docker Desktop requires WSL 2
```

**Solution** :
1. Installer WSL 2 : [Guide Microsoft](https://learn.microsoft.com/en-us/windows/wsl/install)
2. Relancer Docker Desktop

---

## Commandes Utiles

| Commande | Description |
|----------|-------------|
| `supabase start` | Démarrer services locaux |
| `supabase stop` | Arrêter services |
| `supabase status` | État des services |
| `supabase db reset` | Réappliquer migrations |
| `supabase db push` | Push migrations vers cloud |
| `supabase db pull` | Pull schema depuis cloud |
| `supabase test db` | Exécuter tests pgTAP |
| `supabase functions serve` | Démarrer Edge Functions |

---

## Structure de Projet

```
BetaGraph/
├── supabase/
│   ├── config.toml          # Config Supabase CLI
│   ├── seed.sql             # Données de test (optionnel)
│   ├── migrations/          # Migrations SQL
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_storage_buckets.sql
│   │   └── 003_rls_policies.sql
│   └── tests/               # Tests pgTAP
│       └── rls_test.sql
└── docs/
    └── testing/
        └── supabase-cli-setup.md  # Ce fichier
```

---

## Ressources

- [Supabase CLI Docs](https://supabase.com/docs/guides/cli)
- [pgTAP Documentation](https://pgtap.org/documentation.html)
- [Supabase Local Development](https://supabase.com/docs/guides/cli/local-development)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

---

## Notes Importantes

### Performance

Les tests pgTAP s'exécutent dans des transactions (`BEGIN...ROLLBACK`), donc :
- ✅ Aucune donnée ne persiste après les tests
- ✅ Tests isolés les uns des autres
- ✅ Rapides (pas de cleanup manuel)

---

### Production vs Local

**Local** : Base de données temporaire (Docker)  
**Cloud** : Projet Supabase lié via `supabase link`

**Recommandation** : Tester localement avant de push vers Cloud.

---

### UUID Test Consistency

Les tests utilisent des UUIDs prévisibles :
- `00000000-0000-0000-0000-00000000000X` : Profiles
- `10000000-0000-0000-0000-00000000000X` : Boulders
- `20000000-0000-0000-0000-00000000000X` : Betas

**Avantage** : Facilite le debug (UUIDs reconnaissables).

---

**Last Updated**: 2026-01-17  
**Next Steps**: Exécuter `supabase test db` et vérifier que tous les tests passent.
