---
trigger: always_on
---

# Règle : Standards UI, UX et Performance

## Design System (Tailwind)
- **Tokens** : Utilise exclusivement les classes utilitaires standards de Tailwind. Interdiction d'utiliser des valeurs arbitraires comme `h-[13px]` sauf si justifié par un design spécifique.
- **Dark Mode** : Assure-toi que chaque composant est compatible avec le mode sombre.

## Accessibilité (A11y)
- **Sémantique** : Utilise les balises HTML5 correctes (`main`, `section`, `article`, `nav`).
- **Interactivité** : Ajoute des `aria-labels` sur les boutons iconographiques, gère le focus clavier et les rôles ARIA.

## Performance Next.js
- **Server Components** : Par défaut, tout est un Server Component. N'utilise `'use client'` qu'au plus bas niveau possible de l'arbre des composants.
- **Optimisation** : Utilise `next/image` pour les images et `dynamic()` pour les composants lourds (ex: Canvas, Charts) avec `ssr: false`.