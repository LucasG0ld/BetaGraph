---
trigger: always_on
---

# Règle : Workflow de Production et Git

## Gestion de Tâches

1. **TODO.md** : Maintiens un fichier `TODO.md` à la racine. Mets-le à jour avant et après chaque tâche.
2. **Rapport de Tâche** : À la fin de chaque tâche, fournis un résumé de ce qui a été fait et comment le tester.

## Cycle de Validation (Workflow Manuel)
Le hook Husky automatique est désactivé pour compatibilité Windows. La validation repose sur la rigueur du développeur. Avant tout commit :

1. **Validation Statique (CRITIQUE)** : Exécuter manuellement `npm run precommit` (lance `typecheck` et `lint`). Vérifier que la sortie terminal est 100% verte.
2. **Tests Automatisés** : Exécuter les tests unitaires/intégration.
3. **Pre-build** : Lancer un `npm run build` pour s'assurer de l'absence d'erreurs SSR.
4. **Validation Visuelle** : Confirmer l'UI et l'accessibilité (A11y).

## Protocole Git

1. **Branche** : Crée une branche par tâche (`feat/nom-tache`).
2. **Commit** : Utilise les "Conventional Commits" (ex: `feat(auth): add zod validation to login`).
3. **Push** : Si la tâche est fonctionnelle et validée par l'utilisateur, effectue le `git push`.