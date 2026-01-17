import imageCompression from 'browser-image-compression';

/**
 * Compresse une image et la convertit en format WebP optimisé.
 *
 * @description
 * Utilise `browser-image-compression` pour :
 * 1. Redimensionner l'image (max 1920px côté le plus long)
 * 2. Convertir en format WebP
 * 3. Compresser jusqu'à atteindre ≤ 2 Mo (itérations automatiques de qualité)
 *
 * **Processus de compression** :
 * - Qualité initiale : 0.8 (80%)
 * - Si poids > 2 Mo → Réduit qualité progressivement (0.75, 0.7, 0.65...)
 * - Si poids < 2 Mo → Retourne le résultat
 * - Itère jusqu'à : poids acceptable OU qualité minimale (0.5)
 *
 * **Stratégie de fallback intelligent** :
 * Si la compression WebP produit un fichier plus lourd que l'original (rare),
 * la fonction retourne automatiquement le Blob original pour optimiser le poids.
 *
 * **Performance** :
 * - Utilise Web Worker (thread séparé, UI non bloquante)
 * - Temps moyen : 200-500ms pour une image 12MP
 * - Fallback automatique si Worker non disponible
 *
 * @param {Blob} blob - Blob image source (typiquement JPEG 0.95 de Phase 3.2)
 * @returns {Promise<Blob>} Blob WebP compressé (ou original si plus léger)
 * @throws {Error} Si la compression échoue (blob corrompu, out of memory)
 *
 * @example
 * ```typescript
 * // Après normalisation EXIF (Phase 3.2)
 * const normalized = await normalizeImageOrientation(file);
 *
 * // Compression WebP
 * try {
 *   const compressed = await compressImage(normalized.blob);
 *   console.log(`Taille finale: ${(compressed.size / 1024 / 1024).toFixed(2)} Mo`);
 * } catch (error) {
 *   console.error('Compression échouée:', error.message);
 * }
 * ```
 */
export async function compressImage(blob: Blob): Promise<Blob> {
    try {
        // Configuration de compression optimale pour photos d'escalade
        const options = {
            maxSizeMB: 2, // Cible de poids maximal
            maxWidthOrHeight: 1920, // Dimension max (côté le plus long)
            useWebWorker: true, // Performance non-bloquante (thread séparé)
            fileType: 'image/webp' as const, // Format de sortie WebP
            initialQuality: 0.8, // Qualité de départ (80%)
        };

        // Conversion Blob → File (requis par browser-image-compression)
        const file = new File([blob], 'image.jpg', { type: blob.type });

        // Compression avec itérations automatiques de qualité
        const compressed = await imageCompression(file, options);

        // Stratégie de fallback : Retourner le plus léger
        if (compressed.size >= blob.size) {
            // Cas rare : WebP plus lourd que l'original
            if (process.env.NODE_ENV === 'development') {
                console.warn(
                    `[Image Compression] WebP plus lourd que l'original. ` +
                    `Original: ${(blob.size / 1024).toFixed(1)} Ko | ` +
                    `WebP: ${(compressed.size / 1024).toFixed(1)} Ko → ` +
                    `Retour au format original.`
                );
            }
            return blob;
        }

        // Log de succès en développement
        if (process.env.NODE_ENV === 'development') {
            const compressionRatio = (
                ((blob.size - compressed.size) / blob.size) *
                100
            ).toFixed(1);
            console.debug(
                `[Image Compression] Succès | ` +
                `Original: ${(blob.size / 1024 / 1024).toFixed(2)} Mo → ` +
                `WebP: ${(compressed.size / 1024 / 1024).toFixed(2)} Mo | ` +
                `Gain: ${compressionRatio}%`
            );
        }

        return compressed;
    } catch (error) {
        // Gestion d'erreur avec message en français
        const errorMessage =
            error instanceof Error ? error.message : 'Erreur inconnue';

        throw new Error(
            `Échec de la compression de l'image : ${errorMessage}. ` +
            `Vérifiez que le fichier n'est pas corrompu et que votre navigateur ` +
            `dispose de suffisamment de mémoire.`
        );
    }
}
