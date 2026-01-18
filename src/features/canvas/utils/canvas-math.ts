/**
 * Utilitaires mathématiques pour le Canvas BetaGraph.
 *
 * @description
 * Ce module contient les fonctions de calcul nécessaires pour :
 * - Redimensionner l'image de fond (comportement "contain")
 * - Centrer l'image dans le Stage Konva
 * - Fournir les dimensions exactes pour le rendu
 *
 * @module canvas-math
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Dimensions d'une zone rectangulaire (conteneur ou image).
 */
export interface Dimensions {
    /** Largeur en pixels */
    width: number;
    /** Hauteur en pixels */
    height: number;
}

/**
 * Configuration complète du layout Canvas calculé.
 *
 * @description
 * Contient toutes les valeurs nécessaires pour configurer le Stage Konva
 * et positionner l'image de fond de manière responsive.
 *
 * Le comportement est identique à `object-fit: contain` en CSS :
 * - L'image est redimensionnée pour tenir entièrement dans le conteneur
 * - Le ratio d'aspect original est préservé
 * - L'image est centrée horizontalement et verticalement
 *
 * @example
 * ```typescript
 * const layout = calculateCanvasLayout(
 *   { width: 800, height: 600 },  // Conteneur
 *   { width: 1920, height: 1080 } // Image
 * );
 *
 * // Résultat :
 * // {
 * //   scale: 0.4167,
 * //   stageWidth: 800,
 * //   stageHeight: 600,
 * //   scaledWidth: 800,
 * //   scaledHeight: 450,
 * //   offsetX: 0,
 * //   offsetY: 75,  // Centrage vertical
 * // }
 * ```
 */
export interface CanvasLayout {
    /**
     * Facteur de mise à l'échelle appliqué à l'image.
     * Valeur < 1 = image réduite, > 1 = image agrandie.
     */
    scale: number;

    /**
     * Largeur du Stage Konva (= largeur du conteneur).
     */
    stageWidth: number;

    /**
     * Hauteur du Stage Konva (= hauteur du conteneur).
     */
    stageHeight: number;

    /**
     * Largeur de l'image après mise à l'échelle.
     * `scaledWidth = imageWidth × scale`
     */
    scaledWidth: number;

    /**
     * Hauteur de l'image après mise à l'échelle.
     * `scaledHeight = imageHeight × scale`
     */
    scaledHeight: number;

    /**
     * Décalage horizontal pour centrer l'image.
     * `offsetX = (stageWidth - scaledWidth) / 2`
     */
    offsetX: number;

    /**
     * Décalage vertical pour centrer l'image.
     * `offsetY = (stageHeight - scaledHeight) / 2`
     */
    offsetY: number;
}

// ============================================================================
// FONCTIONS
// ============================================================================

/**
 * Calcule le layout optimal pour afficher une image dans un conteneur.
 *
 * @description
 * Implémente un comportement `object-fit: contain` :
 * 1. Calcule le facteur de scale optimal (min des ratios largeur/hauteur)
 * 2. Calcule les dimensions finales de l'image
 * 3. Calcule les offsets de centrage
 *
 * **Formules** :
 * ```
 * scaleX = containerWidth / imageWidth
 * scaleY = containerHeight / imageHeight
 * scale  = min(scaleX, scaleY)
 *
 * scaledWidth  = imageWidth × scale
 * scaledHeight = imageHeight × scale
 *
 * offsetX = (containerWidth - scaledWidth) / 2
 * offsetY = (containerHeight - scaledHeight) / 2
 * ```
 *
 * @param container - Dimensions du conteneur (div parent du Stage)
 * @param image - Dimensions originales de l'image
 * @returns Layout complet avec scale, dimensions et offsets
 *
 * @throws {Error} Si les dimensions sont invalides (≤ 0)
 *
 * @example
 * ```typescript
 * // Cas 1 : Image plus large que haute (paysage)
 * const layout1 = calculateCanvasLayout(
 *   { width: 800, height: 600 },
 *   { width: 1920, height: 1080 }
 * );
 * // → Image 800×450 centrée verticalement (offsetY = 75)
 *
 * // Cas 2 : Image plus haute que large (portrait)
 * const layout2 = calculateCanvasLayout(
 *   { width: 800, height: 600 },
 *   { width: 1080, height: 1920 }
 * );
 * // → Image 338×600 centrée horizontalement (offsetX = 231)
 *
 * // Cas 3 : Image et conteneur même ratio
 * const layout3 = calculateCanvasLayout(
 *   { width: 800, height: 600 },
 *   { width: 1600, height: 1200 }
 * );
 * // → Image 800×600 sans offset (offsetX = 0, offsetY = 0)
 * ```
 */
export function calculateCanvasLayout(
    container: Dimensions,
    image: Dimensions
): CanvasLayout {
    // Validation des entrées
    if (
        container.width <= 0 ||
        container.height <= 0 ||
        image.width <= 0 ||
        image.height <= 0
    ) {
        throw new Error(
            'Les dimensions du conteneur et de l\'image doivent être strictement positives.'
        );
    }

    // Calcul des ratios de mise à l'échelle pour chaque dimension
    const scaleX = container.width / image.width;
    const scaleY = container.height / image.height;

    // Le facteur final est le MINIMUM des deux ratios
    // Cela garantit que l'image tient entièrement dans le conteneur
    const scale = Math.min(scaleX, scaleY);

    // Dimensions de l'image après mise à l'échelle
    const scaledWidth = image.width * scale;
    const scaledHeight = image.height * scale;

    // Calcul des offsets pour centrer l'image
    const offsetX = (container.width - scaledWidth) / 2;
    const offsetY = (container.height - scaledHeight) / 2;

    return {
        scale,
        stageWidth: container.width,
        stageHeight: container.height,
        scaledWidth,
        scaledHeight,
        offsetX,
        offsetY,
    };
}

/**
 * Vérifie si un point (en coordonnées Stage) est à l'intérieur de l'image.
 *
 * @description
 * Utile pour ignorer les événements de dessin en dehors de l'image.
 * Le point est en coordonnées du Stage Konva (pixels).
 *
 * @param stageX - Coordonnée X dans le Stage (pixels)
 * @param stageY - Coordonnée Y dans le Stage (pixels)
 * @param layout - Layout calculé par `calculateCanvasLayout`
 * @returns `true` si le point est à l'intérieur de l'image
 *
 * @example
 * ```typescript
 * const layout = calculateCanvasLayout(container, image);
 *
 * // Point au centre de l'image
 * isPointInsideImage(400, 300, layout); // true
 *
 * // Point dans la zone de padding (hors image)
 * isPointInsideImage(50, 50, layout); // false si offsetX > 50
 * ```
 */
export function isPointInsideImage(
    stageX: number,
    stageY: number,
    layout: CanvasLayout
): boolean {
    const { offsetX, offsetY, scaledWidth, scaledHeight } = layout;

    return (
        stageX >= offsetX &&
        stageX <= offsetX + scaledWidth &&
        stageY >= offsetY &&
        stageY <= offsetY + scaledHeight
    );
}

/**
 * Calcule le ratio d'aspect d'une image.
 *
 * @param width - Largeur en pixels
 * @param height - Hauteur en pixels
 * @returns Ratio largeur/hauteur (ex: 1.777 pour 16:9)
 *
 * @example
 * ```typescript
 * calculateAspectRatio(1920, 1080); // 1.777... (16:9)
 * calculateAspectRatio(1080, 1920); // 0.5625   (9:16)
 * calculateAspectRatio(1000, 1000); // 1        (carré)
 * ```
 */
export function calculateAspectRatio(width: number, height: number): number {
    if (height <= 0) {
        throw new Error('La hauteur doit être strictement positive.');
    }
    return width / height;
}
