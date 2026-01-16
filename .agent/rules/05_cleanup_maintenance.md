---
trigger: always_on
---

# Règle : Nettoyage et Maintenance Continue

## Règle du Boy-Scout
"Laisse le code plus propre que tu ne l'as trouvé."

## Actions systématiques
- **Imports** : Supprime les imports inutilisés et trie-les (React d'abord, puis librairies, puis local).
- **Code Mort** : Supprime les fonctions, variables ou fichiers qui ne sont plus utilisés après une refactorisation.
- **Env Vars** : Si tu crées une nouvelle variable d'environnement, ajoute-la immédiatement à `.env.example` avec une valeur fictive.
- **DRY** : Si tu écris deux fois la même logique, crée un utilitaire ou un hook partagé.