/**
 * Utilitaires de conversion de coordonnées pour le Canvas BetaGraph.
 *
 * @description
 * Ce module gère la conversion entre :
 * - **Coordonnées Stage** : Pixels dans le Stage Konva
 * - **Coordonnées Relatives** : Pourcentages (0-100) de l'image originale
 *
 * Toutes les coordonnées stockées dans `DrawingData` sont en pourcentage,
 * garantissant un rendu parfaitement responsive quelle que soit la taille d'affichage.
 *
 * @module coords-converter
 */

import type { Point } from '@/lib/schemas/drawing.schema';
import type { CanvasLayout } from './canvas-math';

// ============================================================================
// CONSTANTES
// ============================================================================

/**
 * Nombre de décimales pour les pourcentages stockés.
 * 3 décimales = précision de ±0.04px sur une image 4K.
 */
const PRECISION_DECIMALS = 3;

/**
 * Facteur de multiplication pour l'arrondi.
 */
const PRECISION_FACTOR = Math.pow(10, PRECISION_DECIMALS);

// ============================================================================
// FONCTIONS UTILITAIRES INTERNES
// ============================================================================

/**
 * Borne une valeur entre un minimum et un maximum.
 *
 * @param value - Valeur à borner
 * @param min - Borne inférieure
 * @param max - Borne supérieure
 * @returns Valeur bornée
 */
function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

/**
 * Arrondit une valeur au nombre de décimales défini par PRECISION_DECIMALS.
 *
 * @param value - Valeur à arrondir
 * @returns Valeur arrondie à 3 décimales
 */
function roundToPrecision(value: number): number {
    return Math.round(value * PRECISION_FACTOR) / PRECISION_FACTOR;
}

// ============================================================================
// FONCTIONS DE CONVERSION
// ============================================================================

/**
 * Convertit des coordonnées Stage (pixels) en coordonnées relatives (pourcentage).
 *
 * @description
 * Prend en compte les offsets de centrage (`offsetX`, `offsetY`) et le scale
 * pour calculer la position relative dans l'image originale.
 *
 * **Formule** :
 * ```
 * imageX = (stageX - offsetX) / scale
 * imageY = (stageY - offsetY) / scale
 *
 * relativeX = (imageX / imageWidth) × 100
 * relativeY = (imageY / imageHeight) × 100
 * ```
 *
 * @param stageX - Coordonnée X dans le Stage Konva (pixels)
 * @param stageY - Coordonnée Y dans le Stage Konva (pixels)
 * @param layout - Layout calculé par `calculateCanvasLayout`
 * @param imageWidth - Largeur originale de l'image (pixels)
 * @param imageHeight - Hauteur originale de l'image (pixels)
 * @returns Point en coordonnées relatives (0-100), bornées et arrondies
 *
 * @example
 * ```typescript
 * const layout = calculateCanvasLayout(container, image);
 * const point = stageToRelative(400, 300, layout, 1920, 1080);
 * // → { x: 50.000, y: 50.000 } si le point est au centre de l'image
 * ```
 */
export function stageToRelative(
    stageX: number,
    stageY: number,
    layout: CanvasLayout,
    imageWidth: number,
    imageHeight: number
): Point {
    const { offsetX, offsetY, scale } = layout;

    // 1. Convertir les coordonnées Stage en coordonnées image (pixels originaux)
    const imageX = (stageX - offsetX) / scale;
    const imageY = (stageY - offsetY) / scale;

    // 2. Convertir en pourcentage de l'image originale
    const relativeX = (imageX / imageWidth) * 100;
    const relativeY = (imageY / imageHeight) * 100;

    // 3. Borner entre 0 et 100, puis arrondir
    return {
        x: roundToPrecision(clamp(relativeX, 0, 100)),
        y: roundToPrecision(clamp(relativeY, 0, 100)),
    };
}

/**
 * Convertit des coordonnées relatives (pourcentage) en coordonnées Stage (pixels).
 *
 * @description
 * Opération inverse de `stageToRelative`. Utilisée pour le rendu des tracés
 * stockés en pourcentage vers des pixels affichables.
 *
 * **Formule** :
 * ```
 * imageX = (relX / 100) × imageWidth
 * imageY = (relY / 100) × imageHeight
 *
 * stageX = imageX × scale + offsetX
 * stageY = imageY × scale + offsetY
 * ```
 *
 * @param relX - Coordonnée X relative (0-100)
 * @param relY - Coordonnée Y relative (0-100)
 * @param layout - Layout calculé par `calculateCanvasLayout`
 * @param imageWidth - Largeur originale de l'image (pixels)
 * @param imageHeight - Hauteur originale de l'image (pixels)
 * @returns Position en pixels dans le Stage Konva
 *
 * @example
 * ```typescript
 * const layout = calculateCanvasLayout(container, image);
 * const pos = relativeToStage(50, 50, layout, 1920, 1080);
 * // → { x: 400, y: 300 } position du centre de l'image dans le Stage
 * ```
 */
export function relativeToStage(
    relX: number,
    relY: number,
    layout: CanvasLayout,
    imageWidth: number,
    imageHeight: number
): { x: number; y: number } {
    const { offsetX, offsetY, scale } = layout;

    // 1. Convertir le pourcentage en pixels de l'image originale
    const imageX = (relX / 100) * imageWidth;
    const imageY = (relY / 100) * imageHeight;

    // 2. Appliquer le scale et les offsets pour obtenir les coordonnées Stage
    const stageX = imageX * scale + offsetX;
    const stageY = imageY * scale + offsetY;

    return { x: stageX, y: stageY };
}

/**
 * Convertit un tableau de points plats Konva en tableau de Points relatifs.
 *
 * @description
 * Konva stocke les points d'une ligne dans un format plat : `[x1, y1, x2, y2, ...]`.
 * Cette fonction convertit ce format en tableau de `Point` avec coordonnées relatives.
 *
 * @param flatPoints - Tableau plat de coordonnées `[x1, y1, x2, y2, ...]`
 * @param layout - Layout calculé par `calculateCanvasLayout`
 * @param imageWidth - Largeur originale de l'image (pixels)
 * @param imageHeight - Hauteur originale de l'image (pixels)
 * @returns Tableau de Points en coordonnées relatives (0-100)
 *
 * @throws {Error} Si le tableau n'a pas un nombre pair d'éléments
 *
 * @example
 * ```typescript
 * const konvaPoints = [100, 150, 200, 250, 300, 350];
 * const relativePoints = flatPointsToRelative(konvaPoints, layout, 1920, 1080);
 * // → [{ x: 5.208, y: 13.889 }, { x: 10.417, y: 23.148 }, { x: 15.625, y: 32.407 }]
 * ```
 */
export function flatPointsToRelative(
    flatPoints: number[],
    layout: CanvasLayout,
    imageWidth: number,
    imageHeight: number
): Point[] {
    if (flatPoints.length % 2 !== 0) {
        throw new Error(
            'Le tableau de points doit contenir un nombre pair d\'éléments (x, y alternés).'
        );
    }

    const points: Point[] = [];

    for (let i = 0; i < flatPoints.length; i += 2) {
        const stageX = flatPoints[i];
        const stageY = flatPoints[i + 1];
        points.push(stageToRelative(stageX, stageY, layout, imageWidth, imageHeight));
    }

    return points;
}

/**
 * Convertit un tableau de Points relatifs en tableau plat pour Konva.
 *
 * @description
 * Opération inverse de `flatPointsToRelative`. Utilisée pour passer les
 * points stockés à un composant `<Line>` de React-Konva.
 *
 * @param points - Tableau de Points en coordonnées relatives (0-100)
 * @param layout - Layout calculé par `calculateCanvasLayout`
 * @param imageWidth - Largeur originale de l'image (pixels)
 * @param imageHeight - Hauteur originale de l'image (pixels)
 * @returns Tableau plat de coordonnées Stage `[x1, y1, x2, y2, ...]`
 *
 * @example
 * ```typescript
 * const relativePoints = [{ x: 50, y: 50 }, { x: 75, y: 75 }];
 * const konvaPoints = relativePointsToFlat(relativePoints, layout, 1920, 1080);
 * // → [400, 300, 600, 450] (selon le layout)
 * ```
 */
export function relativePointsToFlat(
    points: Point[],
    layout: CanvasLayout,
    imageWidth: number,
    imageHeight: number
): number[] {
    const flatPoints: number[] = [];

    for (const point of points) {
        const { x, y } = relativeToStage(point.x, point.y, layout, imageWidth, imageHeight);
        flatPoints.push(x, y);
    }

    return flatPoints;
}

/**
 * Convertit une épaisseur relative (% largeur image) en pixels Stage.
 *
 * @param relativeWidth - Épaisseur en % de la largeur image (0-100)
 * @param layout - Layout calculé par `calculateCanvasLayout`
 * @param imageWidth - Largeur originale de l'image (pixels)
 * @returns Épaisseur en pixels pour le rendu Stage
 *
 * @example
 * ```typescript
 * const strokeWidth = relativeWidthToStage(2, layout, 1920);
 * // → 16 pixels (si scale = ~0.42 et image 1920px)
 * ```
 */
export function relativeWidthToStage(
    relativeWidth: number,
    layout: CanvasLayout,
    imageWidth: number
): number {
    const { scale } = layout;

    // Convertir le % en pixels de l'image originale, puis appliquer le scale
    const pixelsOnImage = (relativeWidth / 100) * imageWidth;
    return pixelsOnImage * scale;
}

/**
 * Convertit un rayon relatif (% largeur image) en pixels Stage.
 *
 * @param relativeRadius - Rayon en % de la largeur image (0-100)
 * @param layout - Layout calculé par `calculateCanvasLayout`
 * @param imageWidth - Largeur originale de l'image (pixels)
 * @returns Rayon en pixels pour le rendu Stage
 *
 * @example
 * ```typescript
 * const circleRadius = relativeRadiusToStage(5, layout, 1920);
 * // → 40 pixels (si scale = ~0.42 et image 1920px)
 * ```
 */
export function relativeRadiusToStage(
    relativeRadius: number,
    layout: CanvasLayout,
    imageWidth: number
): number {
    // Même logique que relativeWidthToStage (normalisé par largeur)
    return relativeWidthToStage(relativeRadius, layout, imageWidth);
}
