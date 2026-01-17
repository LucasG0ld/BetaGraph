# BetaGraph

> Visualiseur de bêta pour grimpeurs de bloc

Application SaaS Next.js permettant aux grimpeurs de tracer et partager leurs bêtas (solutions) sur des photos de blocs d'escalade.

---

## 🚀 Quick Start

### Prérequis

- Node.js 18+ et npm/pnpm
- Compte Supabase (BaaS)

### Installation

```bash
# Cloner le repo
git clone https://github.com/LucasG0ld/BetaGraph.git
cd BetaGraph

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env.local
# Éditer .env.local avec vos clés Supabase

# Lancer le serveur de dev
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000)

---

## 🔴 IMPORTANT : Workflow de Commit

**AVANT CHAQUE COMMIT**, exécuter :

```bash
npm run precommit
```

Cette commande valide :
- ✅ TypeScript (typecheck)
- ✅ ESLint (lint)

**Documentation complète** : [docs/workflows/commit-workflow.md](./docs/workflows/commit-workflow.md)

> ⚠️ Le pre-commit hook Husky est temporairement désactivé en raison de problèmes de compatibilité Windows. La validation manuelle est **obligatoire**.

---

## 📦 Scripts Disponibles

| Commande | Description |
|----------|-------------|
| `npm run dev` | Serveur de développement Next.js |
| `npm run build` | Build de production |
| `npm run start` | Serveur de production |
| `npm run lint` | Vérification ESLint |
| `npm run typecheck` | Vérification TypeScript |
| **`npm run precommit`** | **Validation avant commit (typecheck + lint)** |
| `npm run format` | Formater le code avec Prettier |

---

## 🏗️ Stack Technique

### Frontend & Core
- **Framework** : Next.js 15 (App Router)
- **Langage** : TypeScript (Strict Mode)
- **UI** : Tailwind CSS, Shadcn/UI, Radix UI
- **State** : Zustand (avec persist & undo/redo)
- **Animations** : Framer Motion
- **Validation** : Zod

### Moteur Canvas
- **Bibliothèque** : React-Konva
- **Gestion** : Coordonnées relatives (0-100%), responsive

### Backend (BaaS)
- **Fournisseur** : Supabase
- **Database** : PostgreSQL avec RLS (Row Level Security)
- **Auth** : Supabase Auth (Email/MDP + Google)
- **Storage** : Buckets `boulders` et `thumbnails`

### Traitement d'Images
- **Compression** : browser-image-compression
- **EXIF** : blueimp-load-image
- **Format** : Conversion forcée en WebP

---

## 📁 Structure du Projet

```
BetaGraph/
├── .agent/              # Règles de développement AI
│   └── rules/           # Standards de code, qualité, tests
├── .husky/              # Git hooks (désactivés temporairement)
├── docs/                # Documentation technique
│   ├── reports/         # Rapports de tâches (phase 1, 2, 3...)
│   ├── workflows/       # Guides de workflow
│   └── database/        # Schémas DB, migrations
├── src/
│   ├── app/             # Pages Next.js (App Router)
│   ├── features/        # Features (auth, boulder, canvas, etc.)
│   ├── components/      # Composants UI partagés
│   ├── lib/             # Utilitaires, clients Supabase, schémas Zod
│   ├── hooks/           # Hooks React personnalisés
│   └── constants/       # Constantes (cotations, couleurs)
├── supabase/
│   ├── migrations/      # Migrations SQL
│   └── tests/           # Tests pgTAP (RLS, triggers)
└── TODO.md              # Checklist des tâches
```

---

## 🧪 Tests

### Tests Database (pgTAP)

```bash
# Lancer Supabase local
supabase start

# Exécuter les tests RLS
supabase test db

# Résultat attendu : 10/10 tests passés
```

**Documentation** : [docs/testing/supabase-cli-setup.md](./docs/testing/supabase-cli-setup.md)

---

## 📋 Workflow de Développement

### 1. Règles de Qualité

Le projet suit des **règles strictes** dans `.agent/rules/` :
- `01_architect_spirit.md` : Analyse avant implémentation
- `02_structural_rules.md` : Organisation feature-based, Zod first
- `03_ui_ux_standards.md` : Dark mode, accessibilité, performance
- `04_quality_workflow.md` : Validation, tests, git workflow
- `05_cleanup_maintenance.md` : Boy-scout rule, DRY
- `06_tech_stack_details.md` : Détails techniques
- `07_testing_standards.md` : Stratégie de test

### 2. Convention de Nommage

- **Commits** : [Conventional Commits](https://www.conventionalcommits.org/)
  ```
  feat(auth): add email validation
  fix(canvas): correct aspect ratio calculation
  docs(readme): update installation steps
  ```

- **Branches** : `feat/phase-X-Y-description`

### 3. Processus de Commit

1. Développer la fonctionnalité
2. **Vérifier** avec `npm run precommit`
3. **Commiter** si validation OK
4. **Pusher** vers `main`

**Détails** : [docs/workflows/commit-workflow.md](./docs/workflows/commit-workflow.md)

---

## 🎯 Roadmap

- [x] **Phase 1** : Infrastructure & Arborescence
- [x] **Phase 2** : Sécurité & Auth (RLS)
- [/] **Phase 3** : Pipeline de Traitement d'Image
  - [x] 3.1 : Schémas Zod validation
  - [ ] 3.2 : Normalisation EXIF
  - [ ] 3.3 : Compression WebP
  - [ ] 3.4 : Pipeline complet
- [ ] **Phase 4** : Moteur Canvas (React-Konva)
- [ ] **Phase 5** : Persistance & Synchro Cloud
- [ ] **Phase 6** : Système de Cotation
- [ ] **Phase 7** : UI "High-Tech Lab"
- [ ] **Phase 8** : Partage & OpenGraph
- [ ] **Phase 9** : Optimisations Mobile
- [ ] **Phase 10** : Tests, Docs & Déploiement

**Détails** : [TODO.md](./TODO.md)

---

## 🤝 Contribution

Ce projet suit une méthodologie rigoureuse avec des règles strictes. Consulter [.agent/rules/](. agent/rules/) avant toute contribution.

---

## 📄 Licence

MIT

---

**Maintenu par** : [Lucas Golder](https://github.com/LucasG0ld)  
**Assisté par** : Antigravity AI (Google DeepMind)
