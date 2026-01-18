import { useState, useCallback } from 'react';
import { processImageForUpload } from '@/lib/utils/image/process-image';
import { uploadBoulderImage } from '@/lib/supabase/storage';
import type { ProcessedImage } from '@/lib/schemas/image.schema';

/**
 * Valeur de retour du hook useImageUpload.
 *
 * @property {(file: File) => Promise<void>} upload - Fonction pour uploader une image
 * @property {boolean} isProcessing - True pendant le traitement local (CPU) de l'image
 * @property {boolean} isUploading - True pendant l'envoi réseau vers Supabase Storage
 * @property {string | null} error - Message d'erreur en français, null si pas d'erreur
 * @property {string | null} imageUrl - URL publique de l'image uploadée, null avant upload
 * @property {ProcessedImage | null} imageData - Métadonnées de l'image (dimensions, aspect ratio, etc.), null avant upload
 * @property {() => void} reset - Fonction pour réinitialiser l'état du hook
 */
export interface UseImageUploadReturn {
    upload: (file: File) => Promise<void>;
    isProcessing: boolean;
    isUploading: boolean;
    error: string | null;
    imageUrl: string | null;
    imageData: ProcessedImage | null;
    reset: () => void;
}

/**
 * Hook React pour gérer l'upload complet d'images de blocs d'escalade.
 *
 * @description
 * Orchestre le pipeline complet d'upload en 2 phases :
 * 1. **Traitement local (CPU)** : Validation, normalisation EXIF, compression WebP
 * 2. **Upload réseau** : Envoi vers Supabase Storage bucket 'boulders'
 *
 * **États différenciés** :
 * - `isProcessing` : Traitement image (peut prendre 1-6s selon format HEIC)
 * - `isUploading` : Envoi réseau (dépend de la bande passante)
 *
 * → Permet un feedback UI précis ("Optimisation..." vs "Envoi...")
 *
 * **Gestion d'erreur** :
 * - Messages toujours en français
 * - Contexte préservé (validation, traitement, upload)
 * - Reset automatique des erreurs sur nouvelle tentative
 *
 * **Performance** :
 * - `upload()` encapsulée dans `useCallback` (fonction stable)
 * - Pas de re-render inutile des composants enfants
 *
 * @returns {UseImageUploadReturn} État et fonctions de contrôle
 *
 * @example
 * ```tsx
 * function BoulderImageUploader() {
 *   const { upload, isProcessing, isUploading, error, imageUrl, imageData } =
 *     useImageUpload();
 *
 *   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 *     const file = e.target.files?.[0];
 *     if (file) {
 *       upload(file);
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       <input type="file" accept="image/*" onChange={handleFileChange} />
 *
 *       {isProcessing && <p>🔄 Optimisation de votre image...</p>}
 *       {isUploading && <p>🌐 Envoi vers le serveur...</p>}
 *       {error && <p className="error">❌ {error}</p>}
 *
 *       {imageUrl && imageData && (
 *         <div>
 *           <img src={imageUrl} alt="Boulder" />
 *           <p>Dimensions: {imageData.width}x{imageData.height}</p>
 *         </div>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useImageUpload(): UseImageUploadReturn {
    // États de chargement différenciés (CPU vs Réseau)
    const [isProcessing, setIsProcessing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // État d'erreur (message en français)
    const [error, setError] = useState<string | null>(null);

    // Résultat de l'upload
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [imageData, setImageData] = useState<ProcessedImage | null>(null);

    /**
     * Fonction d'upload principale.
     *
     * @description
     * Orchestre le pipeline complet :
     * 1. Reset des états précédents
     * 2. Traitement image (Phase 3.4)
     * 3. Upload Supabase (Phase 3.5)
     * 4. Mise à jour résultat ou erreur
     *
     * **Timeline** :
     * ```
     * upload(file)
     *   ↓ Reset (error, imageUrl, imageData = null)
     *   ↓ isProcessing = true      [Optimisation...]
     *   ↓ processImageForUpload()  (500ms-6s)
     *   ↓ isProcessing = false
     *   ↓ isUploading = true       [Envoi...]
     *   ↓ uploadBoulderImage()     (100ms-3s)
     *   ↓ isUploading = false
     *   ↓ imageUrl + imageData set ✅
     * ```
     *
     * @param {File} file - Fichier image brut (JPEG, PNG, WebP, HEIC)
     */
    const upload = useCallback(async (file: File) => {
        try {
            // ===== RESET ÉTAT PRÉCÉDENT =====
            // Efface erreur, URL et métadonnées d'une tentative précédente
            setError(null);
            setImageUrl(null);
            setImageData(null);

            // ===== PHASE 3.4 : TRAITEMENT LOCAL (CPU) =====
            setIsProcessing(true);

            const processed = await processImageForUpload(file);
            // → { blob, width, height, aspectRatio, format, sizeInBytes, orientation }

            // ===== TRANSITION : TRAITEMENT → UPLOAD =====
            setIsProcessing(false);
            setIsUploading(true);

            // ===== PHASE 3.5 : UPLOAD RÉSEAU (SUPABASE STORAGE) =====
            const url = await uploadBoulderImage(processed.blob, processed.format);
            // → "https://.../storage/v1/object/public/boulders/{userId}/{uuid}.{format}"

            // ===== SUCCÈS : MISE À JOUR RÉSULTAT =====
            setImageUrl(url);
            setImageData(processed);

            // Log de succès en développement
            if (process.env.NODE_ENV === 'development') {
                console.debug(
                    `[useImageUpload] Upload complet | ` +
                    `URL: ${url} | ` +
                    `Dimensions: ${processed.width}x${processed.height} | ` +
                    `Format: ${processed.format.toUpperCase()}`
                );
            }
        } catch (err) {
            // ===== GESTION D'ERREUR =====
            // Les messages sont déjà en français (Phases 3.4 + 3.5)
            const errorMessage =
                err instanceof Error
                    ? err.message
                    : "Une erreur inattendue s'est produite lors de l'upload. Veuillez réessayer.";

            setError(errorMessage);

            // Log d'erreur en développement
            if (process.env.NODE_ENV === 'development') {
                console.error('[useImageUpload] Erreur:', err);
            }
        } finally {
            // ===== NETTOYAGE : TOUJOURS RÉINITIALISER LES ÉTATS LOADING =====
            setIsProcessing(false);
            setIsUploading(false);
        }
    }, []); // Pas de dépendances → fonction stable entre renders

    /**
     * Réinitialise manuellement l'état du hook.
     *
     * @description
     * Utile pour :
     * - Effacer une image uploadée précédemment
     * - Réinitialiser après une erreur
     * - Permettre une nouvelle sélection d'image
     *
     * @example
     * ```tsx
     * <button onClick={reset}>Choisir une autre image</button>
     * ```
     */
    const reset = useCallback(() => {
        setIsProcessing(false);
        setIsUploading(false);
        setError(null);
        setImageUrl(null);
        setImageData(null);
    }, []);

    return {
        upload,
        isProcessing,
        isUploading,
        error,
        imageUrl,
        imageData,
        reset,
    };
}
