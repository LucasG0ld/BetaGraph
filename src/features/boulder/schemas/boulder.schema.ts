import { z } from 'zod';

/**
 * Schéma de validation pour les métadonnées d'un bloc physique (Boulder).
 *
 * @description
 * Valide les données nécessaires pour créer un boulder dans la base de données.
 * Le boulder représente une image de bloc d'escalade physique, sans cotation
 * (la cotation est stockée dans la table `betas`).
 *
 * @property {string} name - Nom du bloc (obligatoire, 1-100 caractères)
 * @property {string} location - Localisation géographique (optionnel, max 200 caractères)
 * @property {string} image_url - URL Supabase Storage de l'image (validée après upload)
 *
 * @example
 * ```typescript
 * const boulderMetadata: BoulderMetadata = {
 *   name: "Karma",
 *   location: "Fontainebleau, France",
 *   image_url: "https://supabase.co/storage/v1/object/public/boulders/user123/abc.webp"
 * };
 * ```
 */
export const BoulderMetadataSchema = z.object({
    name: z
        .string()
        .min(1, 'Le nom du bloc est requis')
        .max(100, 'Le nom ne peut pas dépasser 100 caractères')
        .trim(),
    location: z
        .string()
        .max(200, 'La localisation ne peut pas dépasser 200 caractères')
        .trim()
        .optional(),
    image_url: z
        .string()
        .min(1, "L'URL de l'image est requise")
        .url('URL invalide')
        .startsWith(
            'https://',
            "L'URL de l'image doit utiliser le protocole HTTPS"
        ),
});

/**
 * Type TypeScript inféré pour les métadonnées d'un boulder.
 */
export type BoulderMetadata = z.infer<typeof BoulderMetadataSchema>;
