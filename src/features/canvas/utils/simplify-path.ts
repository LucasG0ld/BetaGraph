/**
 * Utilitaire de simplification de tracés pour le Canvas BetaGraph.
 *
 * @description
 * Ce module utilise l'algorithme Ramer-Douglas-Peucker (via `simplify-js`)
 * pour réduire le nombre de points d'une ligne tout en préservant sa forme.
 *
 * **Avantages** :
 * - Réduction de 60-80% du nombre de points
 * - Tracés plus légers en stockage (JSONB)
 * - Rendu plus performant (moins de calculs)
 *
 * @module simplify-path
 */

import simplify from 'simplify-js';
import type { Point } from '@/lib/schemas/drawing.schema';

// ============================================================================
// CONSTANTES
// ============================================================================

/**
 * Tolérance par défaut pour la simplification (en unités de coordonnées).
 *
 * Pour des coordonnées en % (0-100) :
 * - 0.15 ≈ 1.5px sur une image 1000px affichée à 100%
 * - Compromis entre réduction et préservation des détails
 */
const DEFAULT_TOLERANCE = 0.15;

/**
 * Active la simplification de haute qualité (plus lente mais meilleure).
 * Utilise l'algorithme Ramer-Douglas-Peucker complet au lieu de la version rapide.
 */
const HIGH_QUALITY = true;

// ============================================================================
// FONCTIONS PRINCIPALES
// ============================================================================

/**
 * Simplifie un tableau de points en réduisant le nombre de points.
 *
 * @description
 * Utilise l'algorithme Douglas-Peucker pour supprimer les points
 * qui n'ajoutent pas de détails significatifs au tracé.
 *
 * **Note sur la tolérance** :
 * - Pour des points en % (0-100) : utiliser 0.1-0.3
 * - Pour des points en pixels : utiliser 1-3
 *
 * @param points - Tableau de points à simplifier
 * @param tolerance - Distance maximale entre le point original et la ligne simplifiée
 * @returns Tableau de points simplifiés
 *
 * @example
 * ```typescript
 * // Simplification de points en coordonnées relatives (%)
 * const rawPoints: Point[] = [
 *   { x: 10, y: 20 },
 *   { x: 10.05, y: 20.02 },  // Sera supprimé (trop proche)
 *   { x: 10.1, y: 20.05 },   // Sera supprimé
 *   { x: 15, y: 25 },        // Conservé (changement significatif)
 * ];
 *
 * const simplified = simplifyPath(rawPoints);
 * // → [{ x: 10, y: 20 }, { x: 15, y: 25 }]
 * ```
 */
export function simplifyPath(
    points: Point[],
    tolerance: number = DEFAULT_TOLERANCE
): Point[] {
    // Cas trivial : pas assez de points pour simplifier
    if (points.length <= 2) {
        return points;
    }

    // simplify-js attend { x, y } — compatible avec notre Point
    const simplified = simplify(points, tolerance, HIGH_QUALITY);

    return simplified as Point[];
}

/**
 * Simplifie un tableau plat de coordonnées (format Konva).
 *
 * @description
 * Konva stocke les points dans un format plat : `[x1, y1, x2, y2, ...]`.
 * Cette fonction convertit, simplifie, puis reconvertit au format plat.
 *
 * @param flatPoints - Tableau plat de coordonnées Konva
 * @param tolerance - Distance maximale de simplification
 * @returns Tableau plat de coordonnées simplifiées
 *
 * @throws {Error} Si le tableau n'a pas un nombre pair d'éléments
 *
 * @example
 * ```typescript
 * const konvaPoints = [10, 20, 10.05, 20.02, 10.1, 20.05, 15, 25];
 * const simplified = simplifyFlatPath(konvaPoints);
 * // → [10, 20, 15, 25]
 * ```
 */
export function simplifyFlatPath(
    flatPoints: number[],
    tolerance: number = DEFAULT_TOLERANCE
): number[] {
    if (flatPoints.length % 2 !== 0) {
        throw new Error(
            'Le tableau de points doit contenir un nombre pair d\'éléments (x, y alternés).'
        );
    }

    // Convertir en tableau de points
    const points: Point[] = [];
    for (let i = 0; i < flatPoints.length; i += 2) {
        points.push({
            x: flatPoints[i],
            y: flatPoints[i + 1],
        });
    }

    // Simplifier
    const simplified = simplifyPath(points, tolerance);

    // Reconvertir en format plat
    const result: number[] = [];
    for (const point of simplified) {
        result.push(point.x, point.y);
    }

    return result;
}

/**
 * Calcule le ratio de réduction après simplification.
 *
 * @description
 * Utile pour le debugging et l'optimisation de la tolérance.
 *
 * @param originalCount - Nombre de points avant simplification
 * @param simplifiedCount - Nombre de points après simplification
 * @returns Pourcentage de réduction (ex: 75 = 75% de points supprimés)
 *
 * @example
 * ```typescript
 * const reduction = calculateReductionRatio(100, 25);
 * // → 75 (75% des points ont été supprimés)
 * ```
 */
export function calculateReductionRatio(
    originalCount: number,
    simplifiedCount: number
): number {
    if (originalCount === 0) return 0;
    return Math.round((1 - simplifiedCount / originalCount) * 100);
}

/**
 * Simplifie un tracé avec mesure du ratio de réduction.
 *
 * @description
 * Wrapper qui retourne à la fois les points simplifiés et le ratio de réduction.
 * Utile pour le monitoring et l'ajustement de la tolérance.
 *
 * @param points - Tableau de points à simplifier
 * @param tolerance - Distance maximale de simplification
 * @returns Objet contenant les points simplifiés et les statistiques
 *
 * @example
 * ```typescript
 * const result = simplifyPathWithStats(rawPoints);
 * console.log(`Réduction: ${result.reductionPercent}%`);
 * // → "Réduction: 72%"
 * ```
 */
export function simplifyPathWithStats(
    points: Point[],
    tolerance: number = DEFAULT_TOLERANCE
): {
    points: Point[];
    originalCount: number;
    simplifiedCount: number;
    reductionPercent: number;
} {
    const simplified = simplifyPath(points, tolerance);

    return {
        points: simplified,
        originalCount: points.length,
        simplifiedCount: simplified.length,
        reductionPercent: calculateReductionRatio(points.length, simplified.length),
    };
}

// ============================================================================
// CONSTANTES EXPORTÉES
// ============================================================================

/**
 * Tolérance recommandée pour les coordonnées en pourcentage (0-100).
 */
export const TOLERANCE_PERCENT = 0.15;

/**
 * Tolérance recommandée pour les coordonnées en pixels Stage.
 */
export const TOLERANCE_PIXELS = 1.5;
