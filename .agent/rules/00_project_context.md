# Contexte du Projet : BetaGraph

## 1. Vision

- **Description courte :** BetaGraph est un outil SaaS de type "Visualizer" pour les grimpeurs de bloc. Il permet de transformer une simple photo de mur d'escalade en un guide technique ("Bêta") précis, annoté et partageable.
- **Cible :** Grimpeurs (indoor/outdoor), ouvreurs de voies (routesetters) pour archiver leurs créations, et coachs pour l'analyse technique.
- **Identité Visuelle :** Esthétique "High-Tech Lab". Interface sombre (Dark Mode par défaut), composants UI premium, animations fluides (Framer Motion).

## 2. Langue

- **Code & Commentaires :** Anglais (Standard professionnel, nommage sémantique).
- **Interface Utilisateur (UI) :** Français.
- **Communication / Documentation :** Français.

## 3. État Actuel & Priorités

- **Projet :** Greenfield (Départ de zéro).
- **Priorité 1 :** Architecture solide par "Features" pour l'évolutivité.
- **Priorité 2 :** Moteur de dessin responsive (Canvas) gérant les coordonnées relatives.
- **Priorité 3 :** UX Mobile-First (utilisation à une main au pied du mur).

## 4. Règles Métier Clés

- **Systèmes de Cotation :** Double support obligatoire (Fontainebleau & V-Scale) avec toggle de préférence utilisateur.
- **Dessin :** Tracé à main levée fluide (Bézier) et placement de marqueurs (holds). Couleurs distinctives par défaut (Vert/Mains, Bleu/Pieds) mais entièrement personnalisables.
- **Fiabilité :** Persistance automatique du travail en cours dans le stockage local du navigateur (anti-crash/perte de connexion).
- **Sécurité :** Données protégées via Supabase RLS (Row Level Security).
