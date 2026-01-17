---
trigger: always_on
---

# Règle : Workflow de Production et Git

## Gestion de Tâches

1. **TODO.md** : Maintiens un fichier `TODO.md` à la racine. Mets-le à jour avant et après chaque tâche.
2. **Rapport de Tâche** : À la fin de chaque tâche, fournis un résumé de ce qui a été fait et comment le tester.

## Cycle de Validation

Avant de considérer une tâche comme terminée, tu dois :

1. **Validation Statique** : Vérifier l'absence d'erreurs TypeScript et de linting.
2. **Tests Automatisés** : Exécuter les tests unitaires et de composants. TOUS les tests doivent être au vert.
3. **Pre-build** : Lancer un `npm run build` pour s'assurer qu'il n'y a pas d'erreur de rendu serveur (SSR).
4. **Validation Visuelle** : Confirmer que l'UI correspond au Userflow et est accessible (A11y).

## Protocole Git

1. **Branche** : Crée une branche par tâche (`feat/nom-tache`).
2. **Commit** : Utilise les "Conventional Commits" (ex: `feat(auth): add zod validation to login`).
3. **Push** : Si la tâche est fonctionnelle et validée par l'utilisateur, effectue le `git push`.
