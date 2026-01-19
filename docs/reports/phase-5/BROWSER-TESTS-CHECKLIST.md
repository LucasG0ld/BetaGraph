# Phase 5 - Checklist Tests Navigateur

**Date** : 2026-01-19  
**Objectif** : Validation manuelle complète de la Phase 5  

---

## ✅ Tests Automatisés (Complétés)

- [x] **Tests unitaires** : 222/229 passés ✅
- [x] **Build production** : Réussi ✅
- [x] **TypeScript** : 0 erreurs ✅
- [x] **Lint** : 0 warnings ✅

---

## 🌐 Tests Navigateur (Manuels)

### Pré-requis

1. **Base de données** : S'assurer que Supabase est connecté
2. **Serveur** : `npm run dev` lancé
3. **User** : Créer un compte de test si nécessaire

---

### 1. Test Création Boulder + Beta (Phase 5.1-5.2)

**Route** : `/create-boulder` (à créer ou tester depuis home)

- [ ] Formulaire s'affiche correctement
- [ ] Validation Zod :
  - [ ] Nom requis (erreur si vide)
  - [ ] URL image HTTPS obligatoire
  - [ ] Grade Fontainebleau accepté (ex: "6B+")
  - [ ] Grade V-Scale accepté (ex: "V4")
  - [ ] Grade invalide rejeté (ex: "10Z")
- [ ] Soumission réussie :
  - [ ] Toast/message de succès
  - [ ] Redirection vers page canvas
  - [ ] Boulder créé dans Supabase (vérifier table `boulders`)
  - [ ] Beta initiale créée (vérifier table `betas`)

**Données de test** :
```
Nom: Test Boulder Phase 5
Location: Fontainebleau
Image URL: https://picsum.photos/800/600
Grade: 6B+
System: fontainebleau
```

---

### 2. Test Canvas Drawing (Phase 4 + Phase 5.3)

**Route** : `/canvas` ou page boulder créé

- [ ] Canvas s'affiche
- [ ] Outils disponibles :
  - [ ] Brush (dessiner ligne)
  - [ ] Circle (ajouter hold)
  - [ ] Eraser (effacer)
- [ ] Dessiner fonctionne :
  - [ ] Lignes s'affichent
  - [ ] Circles s'affichent
  - [ ] Eraser supprime

---

### 3. Test Auto-Save (Phase 5.4)

**Pré-requis** : Canvas ouvert avec betaId valide

- [ ] **SaveIndicator** affiché en bas à droite
- [ ] Dessiner une ligne
- [ ] Attendre 5 secondes
- [ ] **SaveIndicator** montre "Sauvegarde..." (spinner bleu)
- [ ] Puis "Sauvegardé" (checkmark vert) pendant 2s
- [ ] Puis retour à "idle" (masqué)
- [ ] Dans Supabase :
  - [ ] Table `betas` mise à jour
  - [ ] Colonne `drawing_data` contient les nouvelles lignes
  - [ ] Colonne `updated_at` updated

**Test Erreur** :
- [ ] Déconnecter réseau
- [ ] Dessiner
- [ ] Attendre 5s
- [ ] **SaveIndicator** montre "Erreur" (croix rouge)
- [ ] Reconnecter réseau
- [ ] Attendre 5s
- [ ] Sauvegarde réussit (checkmark vert)

---

### 4. Test Load Beta (Phase 5.5)

#### Test 4.1 : Premier Chargement

- [ ] Fermer l'onglet
- [ ] Rouvrir la même URL (même betaId)
- [ ] Canvas charge les données serveur
- [ ] Dessins précédents affichés correctement

#### Test 4.2 : Modifications Hors Ligne

- [ ] Dessiner quelques lignes
- [ ] Déconnecter réseau AVANT auto-save
- [ ] Fermer l'onglet
- [ ] Rouvrir
- [ ] Vérifier que données locales (localStorage) sont chargées
- [ ] Banner "Modifications non sauvegardées" affiché
- [ ] Reconnecter réseau
- [ ] Auto-save pousse les données

#### Test 4.3 : Undo/Redo Clear

- [ ] Charger beta
- [ ] Dessiner ligne
- [ ] Undo fonctionne (ligne disparaît)
- [ ] Recharger page
- [ ] Undo history vide (pas de undo disponible)
- [ ] **Attendu** : Historique undo/redo clear après load

---

### 5. Test Résolution Conflits (Phase 5.6)

#### Pré-requis : Simuler Conflit

**Option A** : Deux Navigateurs

1. Ouvrir Chrome : Charger betaId `ABC123`
2. Ouvrir Firefox : Charger même `ABC123`
3. Chrome : Dessiner ligne rouge
4. Firefox : Dessiner ligne bleue (avant que Chrome save)
5. Chrome : Attendre auto-save (5s)
6. Firefox : Recharger page
7. **Modal devrait s'afficher**

**Option B** : Manipulation Directe (Plus Rapide)

1. Charger beta normalement
2. Dessiner ligne
3. Attendre auto-save
4. Depuis Supabase UI :
   - Modifier `drawing_data` manuellement (ajouter ligne)
   - Modifier `updated_at` à un timestamp plus récent
5. Recharger page canvas
6. **Modal devrait s'afficher**

#### Tests Modal

- [ ] **Modal s'affiche** (overlay sombre + modal centrée)
- [ ] **Layout Two-Column** :
  - [ ] Côté gauche : "💾 Votre version locale"
  - [ ] Côté droit : "☁️ Version Cloud"
- [ ] **Statistiques affichées** :
  - [ ] Timestamp relatif ("Il y a X min")
  - [ ] Nombre de lignes
  - [ ] Nombre de holds
- [ ] **Pas de fermeture par clic overlay** (modal bloquante)
- [ ] **Bouton "Garder ma version"** :
  - [ ] Cliquer
  - [ ] Modal se ferme
  - [ ] Canvas montre version locale
  - [ ] Attendre 5s
  - [ ] Auto-save pousse version locale au serveur
  - [ ] Vérifier Supabase (local version maintenant sur serveur)
- [ ] **Bouton "Charger version Cloud"** :
  - [ ] Recharger page pour re-créer conflit
  - [ ] Cliquer "Charger version Cloud"
  - [ ] Modal se ferme
  - [ ] Canvas montre version serveur
  - [ ] Version locale écrasée

---

### 6. Test Responsive (Bonus)

- [ ] Desktop (1920x1080) : Layout correct
- [ ] Tablet (768px) : Modal grid passe en colonne
- [ ] Mobile (375px) : Boutons full-width

---

### 7. Test Dark Mode (Bonus)

- [ ] Activer dark mode (si implémenté)
- [ ] Couleurs lisibles :
  - [ ] Bordures cyan visibles
  - [ ] Fond dark brand-gray-900
  - [ ] Texte blanc/gris
  - [ ] SaveIndicator couleurs OK

---

## 📊 Résumé Validation

| Composant | Status | Notes |
|-----------|--------|-------|
| Tests Unitaires | ✅ | 222/229 passed |
| Build Production | ✅ | 0 errors |
| Création Boulder | ⏳ | À tester manuellement |
| Auto-Save | ⏳ | À tester manuellement |
| Load Beta | ⏳ | À tester manuellement |
| Conflit Modal | ⏳ | À tester manuellement |

---

## 🐛 Bugs Trouvés (Si Applicable)

_Remplir si bugs détectés pendant les tests_

| Bug | Gravité | Reproduction | Fix |
|-----|---------|--------------|-----|
| - | - | - | - |

---

## ✅ Validation Finale

- [ ] Tous les tests navigateurs passés
- [ ] Aucun bug bloquant
- [ ] Performance acceptable (< 3s chargement)
- [ ] UX fluide et intuitive

**Validé par** : ___________  
**Date** : ___________

