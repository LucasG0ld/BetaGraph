# Workflow de Commit - BetaGraph

**Date** : 2026-01-17  
**Statut** : Workflow manuel actif (Husky hook désactivé temporairement)

---

## 🔴 IMPORTANT : Procédure Avant Chaque Commit

En raison de problèmes de compatibilité Windows avec Husky, le pre-commit hook automatique est désactivé. Vous devez **manuellement** valider votre code avant chaque commit.

---

## ✅ Commande à Exécuter Avant Chaque Commit

```bash
npm run precommit
```

Cette commande exécute dans l'ordre :
1. **TypeScript typecheck** (`npm run typecheck`)
2. **ESLint** (`npm run lint`)

---

## 📋 Workflow Complet

### 1. Faire vos modifications de code

```bash
# Développement normal
code src/features/...
```

### 2. Vérifier que tout passe ✅

```bash
npm run precommit
```

**Résultat attendu** :
```
> betagraph@0.1.0 precommit
> npm run typecheck && npm run lint

> betagraph@0.1.0 typecheck
> tsc --noEmit

> betagraph@0.1.0 lint
> next lint

✔ No ESLint warnings or errors
```

### 3. Si tout est OK → Commit

```bash
git add .
git commit -m "feat(feature): description"
```

### 4. Push vers main

```bash
git push origin main
```

---

## ⚠️ En Cas d'Erreur

### TypeScript Errors

```bash
# Affiche les erreurs
npm run typecheck

# Corrige les erreurs dans ton éditeur
# Puis relance
npm run precommit
```

### ESLint Errors

```bash
# Affiche les erreurs
npm run lint

# Corrige les erreurs
# Puis relance
npm run precommit
```

---

## 🚫 Ne JAMAIS Faire

❌ **NE PAS** commiter sans exécuter `npm run precommit`  
❌ **NE PAS** utiliser `git commit --no-verify` (sauf cas exceptionnel validé)  
❌ **NE PAS** pusher du code qui ne passe pas les validations

---

## 🎯 Alias Recommandés (Optionnel)

Pour gagner du temps, vous pouvez créer des alias dans PowerShell :

```powershell
# Ajouter dans votre $PROFILE PowerShell
function bgcommit {
    npm run precommit
    if ($LASTEXITCODE -eq 0) {
        git add .
        git commit -m $args[0]
    } else {
        Write-Host "❌ Validation échouée. Corrigez les erreurs avant de commiter." -ForegroundColor Red
    }
}

# Usage :
bgcommit "feat(auth): add validation"
```

---

## 📝 Pourquoi ce Workflow Manuel ?

Le pre-commit hook Husky a des problèmes de compatibilité sur Windows :
- Les sorties des commandes ne s'affichent pas en temps réel
- Git bloque sans feedback visuel
- Le script PowerShell fonctionne standalone mais pas via Git

**Solution temporaire** : Workflow manuel documenté  
**Solution future** : Investigation approfondie ou migration vers `lint-staged`

---

## 🔄 Réactivation du Hook (Plus Tard)

Si le problème est résolu :

```bash
# Renommer le fichier
Move-Item -Path .husky/pre-commit.disabled -Destination .husky/pre-commit

# Tester
git commit -m "test: hook validation"
```

---

## ✅ Checklist Avant Push

- [ ] `npm run precommit` → Exit code 0
- [ ] Commit message respecte [Conventional Commits](https://www.conventionalcommits.org/)
- [ ] Code testé localement (si applicable)
- [ ] TODO.md mis à jour (si tâche terminée)

---

**Dernière mise à jour** : 2026-01-17  
**Maintenu par** : Lucas (via Antigravity AI)
