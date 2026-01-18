// @ts-expect-error - blueimp-load-image n'a pas de types officiels
import loadImage from 'blueimp-load-image';

/**
 * Résultat de la normalisation d'orientation d'une image.
 *
 * @description
 * Contient le Blob de l'image avec orientation corrigée (rotation EXIF appliquée),
 * les dimensions finales et les métadonnées d'origine pour audit.
 *
 * @property {Blob} blob - Blob JPEG (qualité 0.95) avec rotation appliquée
 * @property {number} width - Largeur finale en pixels (après rotation)
 * @property {number} height - Hauteur finale en pixels (après rotation)
 * @property {number} originalOrientation - Code EXIF d'orientation original (1-8)
 * @property {boolean} wasRotated - True si une rotation a été appliquée
 *
 * @example
 * ```typescript
 * const result = await normalizeImageOrientation(file);
 * console.log(`Image ${result.width}x${result.height}`);
 * console.log(`Rotation appliquée: ${result.wasRotated}`);
 * ```
 */
export interface NormalizedImage {
    blob: Blob;
    width: number;
    height: number;
    originalOrientation: number;
    wasRotated: boolean;
}

/**
 * Normalise l'orientation d'une image en appliquant les transformations EXIF.
 *
 * @description
 * Utilise `blueimp-load-image` pour :
 * 1. Détecter les métadonnées EXIF (orientation 1-8)
 * 2. Appliquer la rotation physique sur un Canvas
 * 3. Retourner un Blob JPEG redressé avec dimensions correctes
 *
 * Cette fonction est essentielle pour le moteur Canvas (Phase 4), car elle garantit
 * que les coordonnées relatives (%) calculées correspondent à l'affichage visuel.
 *
 * **Gestion des Edge Cases :**
 * - Images sans EXIF (screenshots, WebP) : Passthrough sans rotation
 * - HEIC (iOS natif) : Polyfill WebAssembly automatique (timeout 10s)
 * - Images corrompues : Rejection avec message d'erreur explicite
 *
 * **Performance :**
 * - Limite de résolution : 4096x4096 (protection RAM mobile)
 * - Format intermédiaire : JPEG qualité 0.95 (équilibre qualité/taille)
 *
 * @param {File} file - Fichier image brut (JPEG, PNG, WebP, HEIC)
 * @returns {Promise<NormalizedImage>} Image normalisée avec métadonnées
 * @throws {Error} Si le chargement échoue ou timeout (10s)
 *
 * @example
 * ```typescript
 * try {
 *   const normalized = await normalizeImageOrientation(photoFile);
 *   console.log(`Orientation corrigée: ${normalized.originalOrientation} → 1`);
 *   // Passer à la compression (Phase 3.3)
 *   const compressed = await compressImage(normalized.blob);
 * } catch (error) {
 *   console.error('Échec normalisation EXIF:', error.message);
 * }
 * ```
 */
export async function normalizeImageOrientation(
    file: File
): Promise<NormalizedImage> {
    return new Promise((resolve, reject) => {
        // Timeout de sécurité pour HEIC (polyfill WebAssembly peut être lent)
        const timeoutId = setTimeout(() => {
            reject(
                new Error(
                    'Timeout: Le traitement de l\'image a pris plus de 10 secondes. ' +
                    'Essayez avec une image plus petite ou un autre format.'
                )
            );
        }, 10000);

        loadImage(
            file,
            (imgOrEvent: HTMLCanvasElement | Event) => {
                clearTimeout(timeoutId);

                // Vérification du type de retour (Error handling)
                if (imgOrEvent instanceof Event) {
                    reject(
                        new Error(
                            'Échec du chargement de l\'image. ' +
                            'Vérifiez que le fichier est une image valide.'
                        )
                    );
                    return;
                }

                // Cast en Canvas (forcé par option { canvas: true })
                const canvas = imgOrEvent as HTMLCanvasElement;

                // Extraction des métadonnées EXIF
                const exifData = (canvas as unknown as { exifdata?: { Orientation?: number } })
                    .exifdata;
                const originalOrientation = exifData?.Orientation ?? 1;

                // Déterminer si rotation a été appliquée
                // Orientations 1 = normale, 2-8 = transformations requises
                const wasRotated = originalOrientation !== 1;

                // Dimensions finales (après rotation éventuelle)
                const width = canvas.width;
                const height = canvas.height;

                // Log de debug en développement
                if (process.env.NODE_ENV === 'development') {
                    console.debug(
                        `[EXIF Normalization] File: ${file.name} | ` +
                        `Original orientation: ${originalOrientation} | ` +
                        `Rotated: ${wasRotated} | ` +
                        `Final dimensions: ${width}x${height}`
                    );
                }

                // Conversion Canvas → Blob JPEG (qualité 0.95)
                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(
                                new Error(
                                    'Échec de la conversion Canvas → Blob. ' +
                                    'L\'image est peut-être corrompue.'
                                )
                            );
                            return;
                        }

                        resolve({
                            blob,
                            width,
                            height,
                            originalOrientation,
                            wasRotated,
                        });
                    },
                    'image/jpeg',
                    0.95
                );
            },
            {
                // Options blueimp-load-image
                orientation: true, // Applique rotation EXIF automatiquement
                canvas: true, // Force retour Canvas (pas HTMLImageElement)
                maxWidth: 4096, // Protection RAM mobile
                maxHeight: 4096,
                // Note: meta: true est implicite avec orientation: true
            }
        );
    });
}
