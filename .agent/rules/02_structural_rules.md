# Règle : Standards de Structure et Typage

## Organisation des Dossiers

- **Feature-Based** : Regroupe tout ce qui est lié à une fonctionnalité dans `src/features/[feature-name]`. (Composants, hooks, services, types).
- **Shared UI** : Utilise `src/components/ui` pour les composants de base (style Shadcn/ui).
- **Hooks** : Extraire systématiquement la logique métier des composants vers des hooks personnalisés.

## Règles TypeScript & Validation

- **Strictness** : `any` est strictement interdit. Utilise `unknown` si nécessaire et affine le type.
- **Zod First** : Toute donnée entrant dans le système (API, Formulaires, LocalStorage) DOIT passer par un schéma Zod.
- **Inférence** : Dérive tes types TypeScript de tes schémas Zod : `type MyType = z.infer<typeof MySchema>`.

## Contraintes de Fichiers

- **Modularité** : Un composant par fichier. Max 150 lignes par fichier.
- **Exports** : Utilise des exports nommés, pas d'exports par défaut (sauf pour les pages Next.js).
