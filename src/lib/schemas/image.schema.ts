import { z } from 'zod';

/**
 * Schéma de validation pour un fichier image BRUT uploadé par l'utilisateur.
 *
 * @description
 * Valide un objet `File` avant toute transformation. Ce schéma s'applique
 * immédiatement après la sélection du fichier (input file ou drag & drop).
 *
 * Contraintes :
 * - Taille maximale : 15 Mo (pour supporter les photos modernes iOS/Android)
 * - Formats acceptés : JPEG, PNG, WebP, HEIC/HEIF
 *
 * @example
 * ```typescript
 * const result = ImageUploadSchema.safeParse({ file: myFile });
 * if (!result.success) {
 *   console.error(result.error.errors[0].message); // Message FR
 * }
 * ```
 */
export const ImageUploadSchema = z.object({
    file: z
        .instanceof(File, {
            message: 'Le fichier fourni est invalide.',
        })
        .refine((file) => file.size <= 15 * 1024 * 1024, {
            message: 'La taille du fichier ne peut pas dépasser 15 Mo.',
        })
        .refine(
            (file) =>
                [
                    'image/jpeg',
                    'image/png',
                    'image/webp',
                    'image/heic',
                    'image/heif',
                ].includes(file.type),
            {
                message:
                    'Format non supporté. Formats acceptés : JPEG, PNG, WebP, HEIC.',
            }
        ),
});

/**
 * Type TypeScript inféré pour un fichier image brut validé.
 */
export type ImageUpload = z.infer<typeof ImageUploadSchema>;

/**
 * Schéma de validation pour une image TRAITÉE (après normalisation EXIF + compression).
 *
 * @description
 * Valide les métadonnées et le contenu d'une image après le pipeline de traitement
 * (orientation corrigée, conversion WebP, compression).
 *
 * Contraintes :
 * - Format : WebP uniquement (résultat de la conversion)
 * - Taille maximale : 2 Mo (après compression)
 * - Dimensions minimales : 600px (largeur OU hauteur)
 * - Dimensions maximales : 4096px (sécurité mémoire mobile)
 *
 * @property {Blob} blob - Blob WebP optimisé prêt pour l'upload
 * @property {number} width - Largeur en pixels de l'image finale
 * @property {number} height - Hauteur en pixels de l'image finale
 * @property {number} aspectRatio - Ratio largeur/hauteur (crucial pour Canvas responsive)
 * @property {'webp'} format - Format forcé à WebP
 * @property {number} sizeInBytes - Taille finale en octets (doit être ≤ 2Mo)
 * @property {number} [orientation] - Code orientation EXIF original (1-8), optionnel
 *
 * @example
 * ```typescript
 * const processedImage: ProcessedImage = {
 *   blob: webpBlob,
 *   width: 1920,
 *   height: 1080,
 *   aspectRatio: 1920 / 1080, // 1.777...
 *   format: 'webp',
 *   sizeInBytes: 1_500_000, // 1.5 Mo
 * };
 * ```
 */
export const ProcessedImageSchema = z.object({
    blob: z.instanceof(Blob, {
        message: "Le fichier traité n'est pas un Blob valide.",
    }),
    width: z
        .number()
        .int()
        .min(600, {
            message: 'La largeur de l\'image doit être d\'au moins 600px.',
        })
        .max(4096, {
            message: 'La largeur de l\'image ne peut pas dépasser 4096px.',
        }),
    height: z
        .number()
        .int()
        .min(600, {
            message: 'La hauteur de l\'image doit être d\'au moins 600px.',
        })
        .max(4096, {
            message: 'La hauteur de l\'image ne peut pas dépasser 4096px.',
        }),
    aspectRatio: z
        .number()
        .positive({
            message: "Le ratio d'aspect doit être un nombre positif.",
        })
        .refine((ratio) => ratio >= 0.25 && ratio <= 4, {
            message:
                "Le ratio d'aspect doit être entre 0.25 (très vertical) et 4 (très horizontal).",
        }),
    format: z.literal('webp'),
    sizeInBytes: z
        .number()
        .int()
        .positive()
        .max(2 * 1024 * 1024, {
            message:
                "La taille de l'image compressée ne peut pas dépasser 2 Mo.",
        }),
    orientation: z
        .number()
        .int()
        .min(1)
        .max(8)
        .optional()
        .describe('Code orientation EXIF original (1-8) avant normalisation'),
});

/**
 * Type TypeScript inféré pour une image traitée et validée.
 */
export type ProcessedImage = z.infer<typeof ProcessedImageSchema>;
