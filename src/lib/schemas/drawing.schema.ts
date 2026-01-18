import { z } from 'zod';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Regex pour valider le format hexadécimal strict (#RRGGBB).
 */
const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

// ============================================================================
// POINT SCHEMA
// ============================================================================

/**
 * Schéma de validation pour un point en coordonnées relatives.
 *
 * @description
 * Représente une position sur le canvas en pourcentage (0-100).
 * Les coordonnées sont relatives aux dimensions de l'image originale,
 * garantissant un rendu parfaitement responsive quelle que soit la taille d'affichage.
 *
 * @property {number} x - Position horizontale en % (0-100) de la largeur de l'image
 * @property {number} y - Position verticale en % (0-100) de la hauteur de l'image
 *
 * @example
 * ```typescript
 * const center: Point = { x: 50, y: 50 }; // Centre exact de l'image
 * const topLeft: Point = { x: 0, y: 0 };   // Coin supérieur gauche
 * ```
 */
export const PointSchema = z.object({
    x: z
        .number()
        .min(0, { message: 'La coordonnée X doit être >= 0.' })
        .max(100, { message: 'La coordonnée X doit être <= 100.' }),
    y: z
        .number()
        .min(0, { message: 'La coordonnée Y doit être >= 0.' })
        .max(100, { message: 'La coordonnée Y doit être <= 100.' }),
});

/**
 * Type TypeScript inféré pour un point en coordonnées relatives.
 */
export type Point = z.infer<typeof PointSchema>;

// ============================================================================
// LINE SCHEMA
// ============================================================================

/**
 * Outils de dessin supportés pour les lignes.
 */
export const LineToolSchema = z.enum(['brush', 'eraser']);

/**
 * Type TypeScript inféré pour les outils de ligne.
 */
export type LineTool = z.infer<typeof LineToolSchema>;

/**
 * Schéma de validation pour une ligne (tracé de pinceau ou gomme).
 *
 * @description
 * Représente un tracé continu sur le canvas. Chaque ligne possède :
 * - Un identifiant unique pour la suppression/modification ciblée
 * - Une série de points formant le tracé
 * - Des propriétés stylistiques (couleur, épaisseur, outil)
 *
 * L'épaisseur (`width`) est exprimée en pourcentage de la **largeur de l'image**,
 * garantissant une apparence cohérente quelle que soit la résolution d'affichage.
 *
 * @property {string} id - Identifiant unique (nanoid recommandé)
 * @property {LineTool} tool - Type d'outil ('brush' pour dessiner, 'eraser' pour masquer)
 * @property {Point[]} points - Suite de points formant le tracé
 * @property {string} color - Couleur au format hexadécimal (#RRGGBB)
 * @property {number} width - Épaisseur en % de la largeur de l'image (0-100)
 *
 * @example
 * ```typescript
 * const stroke: Line = {
 *   id: 'abc123',
 *   tool: 'brush',
 *   points: [{ x: 10, y: 20 }, { x: 15, y: 25 }, { x: 20, y: 22 }],
 *   color: '#FF5733',
 *   width: 2, // 2% de la largeur = trait fin mais visible
 * };
 * ```
 */
export const LineSchema = z.object({
    id: z.string().min(1, { message: "L'identifiant de la ligne est requis." }),
    tool: LineToolSchema,
    points: z
        .array(PointSchema)
        .min(1, { message: 'Une ligne doit contenir au moins un point.' }),
    color: z.string().regex(HEX_COLOR_REGEX, {
        message: 'La couleur doit être au format hexadécimal (#RRGGBB).',
    }),
    width: z
        .number()
        .positive({ message: "L'épaisseur doit être un nombre positif." })
        .max(100, { message: "L'épaisseur ne peut pas dépasser 100%." }),
});

/**
 * Type TypeScript inféré pour une ligne.
 */
export type Line = z.infer<typeof LineSchema>;

// ============================================================================
// SHAPE SCHEMAS (Discriminated Union)
// ============================================================================

/**
 * Schéma de validation pour un cercle.
 *
 * @description
 * Représente un cercle sur le canvas. Le rayon (`radius`) est exprimé en
 * pourcentage de la **largeur de l'image**, garantissant une taille cohérente
 * quelle que soit la résolution d'affichage.
 *
 * Note : Sur une image non carrée, un cercle reste un cercle parfait,
 * car le rayon est calculé par rapport à la largeur uniquement.
 *
 * @property {string} id - Identifiant unique (nanoid recommandé)
 * @property {'circle'} type - Discriminant pour le type de forme
 * @property {Point} center - Centre du cercle en coordonnées relatives
 * @property {number} radius - Rayon en % de la largeur de l'image (0-100)
 * @property {string} color - Couleur de bordure au format hexadécimal (#RRGGBB)
 *
 * @example
 * ```typescript
 * const holdMarker: Circle = {
 *   id: 'xyz789',
 *   type: 'circle',
 *   center: { x: 45, y: 60 },
 *   radius: 5, // 5% de la largeur de l'image
 *   color: '#00FF00',
 * };
 * ```
 */
export const CircleSchema = z.object({
    id: z.string().min(1, { message: "L'identifiant du cercle est requis." }),
    type: z.literal('circle'),
    center: PointSchema,
    radius: z
        .number()
        .positive({ message: 'Le rayon doit être un nombre positif.' })
        .max(100, { message: 'Le rayon ne peut pas dépasser 100%.' }),
    color: z.string().regex(HEX_COLOR_REGEX, {
        message: 'La couleur doit être au format hexadécimal (#RRGGBB).',
    }),
});

/**
 * Type TypeScript inféré pour un cercle.
 */
export type Circle = z.infer<typeof CircleSchema>;

/**
 * Schéma de validation pour toutes les formes supportées (Discriminated Union).
 *
 * @description
 * Union discriminée par le champ `type`. Permet d'étendre facilement
 * le système avec de nouveaux types de formes (rectangle, polygon, text, etc.)
 * en ajoutant de nouveaux membres à l'union.
 *
 * Formes actuellement supportées :
 * - `circle` : Cercle pour marquer les prises
 *
 * @example
 * ```typescript
 * // Extensibilité future :
 * // const ShapeSchema = z.discriminatedUnion('type', [
 * //   CircleSchema,
 * //   RectangleSchema,
 * //   PolygonSchema,
 * // ]);
 * ```
 */
export const ShapeSchema = z.discriminatedUnion('type', [CircleSchema]);

/**
 * Type TypeScript inféré pour une forme quelconque.
 */
export type Shape = z.infer<typeof ShapeSchema>;

// ============================================================================
// DRAWING DATA SCHEMA (Root)
// ============================================================================

/**
 * Version actuelle du schéma de données de dessin.
 * Incrémenter cette valeur lors de modifications structurelles.
 */
export const DRAWING_DATA_SCHEMA_VERSION = 1;

/**
 * Schéma de validation pour les données de dessin complètes.
 *
 * @description
 * Structure racine stockée dans le champ JSONB `drawing_data` de la table `routes`.
 * Contient toutes les annotations graphiques d'une voie d'escalade.
 *
 * **Règle d'Or** : Toutes les coordonnées sont en pourcentage (0-100) par rapport
 * aux dimensions de l'image originale. Cela garantit un rendu parfaitement
 * responsive sur n'importe quelle taille d'écran.
 *
 * - `width` des lignes et `radius` des formes sont relatifs à la **largeur** de l'image.
 * - `x`, `y` des points sont relatifs à la largeur et hauteur respectivement.
 *
 * @property {number} version - Version du schéma (pour migrations futures)
 * @property {Line[]} lines - Tracés de pinceau et gomme
 * @property {Shape[]} shapes - Formes géométriques (cercles, etc.)
 *
 * @example
 * ```typescript
 * const emptyDrawing: DrawingData = {
 *   version: 1,
 *   lines: [],
 *   shapes: [],
 * };
 *
 * const annotatedRoute: DrawingData = {
 *   version: 1,
 *   lines: [
 *     { id: 'l1', tool: 'brush', points: [...], color: '#FF0000', width: 1.5 },
 *   ],
 *   shapes: [
 *     { id: 's1', type: 'circle', center: { x: 50, y: 50 }, radius: 3, color: '#00FF00' },
 *   ],
 * };
 * ```
 */
export const DrawingDataSchema = z.object({
    version: z
        .number()
        .int({ message: 'La version doit être un entier.' })
        .positive({ message: 'La version doit être positive.' }),
    lines: z.array(LineSchema),
    shapes: z.array(ShapeSchema),
});

/**
 * Type TypeScript inféré pour les données de dessin complètes.
 */
export type DrawingData = z.infer<typeof DrawingDataSchema>;

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Crée un objet DrawingData vide et valide.
 *
 * @returns {DrawingData} Structure de données de dessin initialisée
 *
 * @example
 * ```typescript
 * const newDrawing = createEmptyDrawingData();
 * // { version: 1, lines: [], shapes: [] }
 * ```
 */
export function createEmptyDrawingData(): DrawingData {
    return {
        version: DRAWING_DATA_SCHEMA_VERSION,
        lines: [],
        shapes: [],
    };
}
