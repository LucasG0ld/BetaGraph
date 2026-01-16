# Règle : Standards de Tests et Qualité

## Stratégie de Test
- **Tests Unitaires (Vitest)** : Obligatoires pour toute fonction utilitaire, logique métier isolée ou hook personnalisé.
- **Tests de Composants (React Testing Library)** : Obligatoires pour les composants de la couche "Features". On teste le comportement (ex: "Le formulaire affiche une erreur si le champ est vide") et non l'implémentation.
- **Tests d'Intégration** : Vérifier le bon fonctionnement d'un Userflow complet (ex: "L'utilisateur peut remplir le formulaire et voir le message de succès").

## Règle d'Or : "No Test, No Done"
Une tâche est considérée comme "terminée" (Done) UNIQUEMENT si :
1. Les fichiers de tests correspondants ont été créés (ex: `my-function.test.ts`).
2. Tous les tests passent (`npm run test`).
3. La couverture de code pour la nouvelle logique est d'au moins 80%.

## Structure des Tests
- Emplacement : Les fichiers de test doivent être à côté du fichier testé (ex: `UserCard.tsx` -> `UserCard.test.tsx`).
- Pattern : Utiliser le pattern "Arrange-Act-Assert" (Préparer - Agir - Vérifier).
- Mocks : Utiliser des mocks pour les appels API (MSW recommandé ou mock de fetch) afin d'éviter des tests dépendants du réseau.