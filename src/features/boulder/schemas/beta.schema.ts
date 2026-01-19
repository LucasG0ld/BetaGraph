import { z } from 'zod';
import { DrawingDataSchema } from '@/lib/schemas/drawing.schema';
import { BoulderMetadataSchema } from './boulder.schema';

/**
 * Système de cotation supporté.
 */
export const GradeSystemSchema = z.enum(['fontainebleau', 'v_scale']);

/**
 * Type TypeScript pour le système de cotation.
 */
export type GradeSystem = z.infer<typeof GradeSystemSchema>;

/**
 * Regex de validation pour le système Fontainebleau.
 *
 * @description
 * Valide les cotations: 3, 4, 5, 5+, 6A, 6A+, 6B, 6B+, 6C, 6C+, 7A, 7A+, ..., 9C
 *
 * @example
 * Valide: "7A", "7A+", "6B", "5+"
 * Invalide: "7D", "10A", "V5"
 */
export const FONTAINEBLEAU_GRADE_REGEX =
    /^(3|4|5|5\+|6[ABC][\+]?|7[ABC][\+]?|8[ABC][\+]?|9[ABC][\+]?)$/;

/**
 * Regex de validation pour le système V-Scale.
 *
 * @description
 * Valide les cotations: VB (V-Beginner), V0, V1, ..., V17
 *
 * @example
 * Valide: "VB", "V0", "V5", "V17"
 * Invalide: "V18", "7A", "VBB"
 */
export const V_SCALE_GRADE_REGEX = /^(VB|V([0-9]|1[0-7]))$/;

/**
 * Schéma de validation pour une cotation Fontainebleau.
 */
export const FontainebleauGradeSchema = z
    .string()
    .regex(FONTAINEBLEAU_GRADE_REGEX, {
        message:
            'Cotation Fontainebleau invalide (exemples valides: 6A, 7A+, 8B)',
    });

/**
 * Schéma de validation pour une cotation V-Scale.
 */
export const VScaleGradeSchema = z.string().regex(V_SCALE_GRADE_REGEX, {
    message: 'Cotation V-Scale invalide (exemples valides: VB, V0, V5, V17)',
});

/**
 * Schéma de validation pour la création d'une beta (tracé utilisateur).
 *
 * @description
 * Valide les données nécessaires pour créer une beta dans la base de données.
 * La beta contient les tracés de l'utilisateur, la cotation, et les paramètres
 * de visibilité.
 *
 * La validation du `grade_value` est conditionnelle selon le `grade_system` :
 * - Si `fontainebleau` → Vérifie le format Fontainebleau (6A, 7A+, etc.)
 * - Si `v_scale` → Vérifie le format V-Scale (VB, V0, V5, etc.)
 *
 * @property {string} boulder_id - UUID du boulder associé
 * @property {string} grade_value - Cotation au format texte (ex: "7A", "V5")
 * @property {GradeSystem} grade_system - Système de cotation utilisé
 * @property {DrawingData} drawing_data - Données de dessin (optionnelles pour création initiale)
 * @property {boolean} is_public - Visibilité publique (défaut: false)
 *
 * @example
 * ```typescript
 * const betaData: BetaCreation = {
 *   boulder_id: "550e8400-e29b-41d4-a716-446655440000",
 *   grade_value: "7A",
 *   grade_system: "fontainebleau",
 *   drawing_data: createEmptyDrawingData(),
 *   is_public: false
 * };
 * ```
 */
export const BetaCreationSchema = z
    .object({
        boulder_id: z
            .string()
            .min(1, "L'identifiant du boulder est requis")
            .uuid("L'identifiant du boulder doit être un UUID valide"),
        grade_value: z
            .string()
            .min(1, 'La cotation est requise')
            .trim(),
        grade_system: GradeSystemSchema,
        drawing_data: DrawingDataSchema.optional(),
        is_public: z.boolean().default(false),
    })
    .refine(
        (data) => {
            // Validation conditionnelle selon le système de cotation
            if (data.grade_system === 'fontainebleau') {
                return FontainebleauGradeSchema.safeParse(
                    data.grade_value
                ).success;
            } else {
                return VScaleGradeSchema.safeParse(data.grade_value).success;
            }
        },
        {
            message: 'La cotation est incompatible avec le système choisi',
            path: ['grade_value'],
        }
    );

/**
 * Type TypeScript inféré pour la création d'une beta.
 */
export type BetaCreation = z.infer<typeof BetaCreationSchema>;

/**
 * Schéma pour la création d'une beta sans boulder_id (utilisé dans CreateBoulderWithBetaSchema).
 * Identique à BetaCreationSchema mais sans le champ boulder_id.
 */
export const BetaCreationWithoutBoulderIdSchema = z
    .object({
        grade_value: z
            .string()
            .min(1, 'La cotation est requise')
            .trim(),
        grade_system: GradeSystemSchema,
        drawing_data: DrawingDataSchema.optional(),
        is_public: z.boolean().default(false),
    })
    .refine(
        (data) => {
            // Validation conditionnelle selon le système de cotation
            if (data.grade_system === 'fontainebleau') {
                return FontainebleauGradeSchema.safeParse(
                    data.grade_value
                ).success;
            } else {
                return VScaleGradeSchema.safeParse(data.grade_value).success;
            }
        },
        {
            message: 'La cotation est incompatible avec le système choisi',
            path: ['grade_value'],
        }
    );

/**
 * Type TypeScript inféré pour la création d'une beta sans boulder_id.
 */
export type BetaCreationWithoutBoulderId = z.infer<
    typeof BetaCreationWithoutBoulderIdSchema
>;

/**
 * Schéma combiné pour la création atomique d'un boulder avec sa première beta.
 *
 * @description
 * Utilisé dans la Server Action `createBoulderWithBeta` pour créer simultanément
 * un boulder et sa beta initiale en une seule transaction.
 *
 * - `boulder` : Métadonnées du bloc (image_url doit être fournie après upload)
 * - `beta` : Première beta de l'utilisateur (boulder_id sera généré automatiquement)
 *
 * @example
 * ```typescript
 * const payload: CreateBoulderWithBeta = {
 *   boulder: {
 *     name: "Karma",
 *     location: "Fontainebleau",
 *     image_url: "https://..."
 *   },
 *   beta: {
 *     grade_value: "7A",
 *     grade_system: "fontainebleau",
 *     is_public: false
 *   }
 * };
 * ```
 */
export const CreateBoulderWithBetaSchema = z.object({
    boulder: BoulderMetadataSchema,
    beta: BetaCreationWithoutBoulderIdSchema,
});

/**
 * Type TypeScript inféré pour la création combinée.
 */
export type CreateBoulderWithBeta = z.infer<
    typeof CreateBoulderWithBetaSchema
>;
