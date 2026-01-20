import { z } from 'zod';

/**
 * Liste ordonnée des cotations Fontainebleau.
 * De la plus facile (3) à la plus dure (9C).
 *
 * @see https://en.wikipedia.org/wiki/Grade_(bouldering)
 */
export const FONTAINEBLEAU_GRADES = [
    '3',
    '4',
    '5',
    '5+',
    '6A',
    '6A+',
    '6B',
    '6B+',
    '6C',
    '6C+',
    '7A',
    '7A+',
    '7B',
    '7B+',
    '7C',
    '7C+',
    '8A',
    '8A+',
    '8B',
    '8B+',
    '8C',
    '8C+',
    '9A',
    '9A+',
    '9B',
    '9B+',
    '9C',
] as const;

/**
 * Liste ordonnée des cotations V-Scale (Hueco Scale).
 * De la plus facile (VB) à la plus dure (V17).
 *
 * @see https://en.wikipedia.org/wiki/V_scale
 */
export const V_SCALE_GRADES = [
    'VB',
    'V0',
    'V1',
    'V2',
    'V3',
    'V4',
    'V5',
    'V6',
    'V7',
    'V8',
    'V9',
    'V10',
    'V11',
    'V12',
    'V13',
    'V14',
    'V15',
    'V16',
    'V17',
] as const;

/**
 * Type pour un grade Fontainebleau.
 */
export type FontainebleauGrade = (typeof FONTAINEBLEAU_GRADES)[number];

/**
 * Type pour un grade V-Scale.
 */
export type VScaleGrade = (typeof V_SCALE_GRADES)[number];

/**
 * Systèmes de cotation supportés.
 */
export const GRADE_SYSTEMS = ['fontainebleau', 'v_scale'] as const;

/**
 * Type pour le système de cotation.
 */
export type GradeSystem = (typeof GRADE_SYSTEMS)[number];

/**
 * Schéma Zod pour valider un système de cotation.
 */
export const GradeSystemSchema = z.enum(GRADE_SYSTEMS);

/**
 * Schéma Zod pour valider un grade Fontainebleau.
 */
export const FontainebleauGradeSchema = z.enum(FONTAINEBLEAU_GRADES);

/**
 * Schéma Zod pour valider un grade V-Scale.
 */
export const VScaleGradeSchema = z.enum(V_SCALE_GRADES);

/**
 * Interface pour le mapping d'un grade.
 *
 * @property normalized - Valeur normalisée (0-100) pour le tri universel
 * @property vScale - Correspondances V-Scale (peut être multiple si approximatif)
 * @property fontainebleau - Correspondances Fontainebleau (peut être multiple si approximatif)
 */
export interface GradeMapping {
    readonly normalized: number;
    readonly vScale?: readonly VScaleGrade[];
    readonly fontainebleau?: readonly FontainebleauGrade[];
}

/**
 * Table de correspondance complète entre les systèmes de cotation.
 *
 * @description
 * Chaque grade possède une valeur normalisée (0-100) pour permettre le tri.
 * Les correspondances vers l'autre système peuvent être multiples
 * (ex: 6A+ → ['V3', 'V4']), indiquant une conversion approximative.
 *
 * Sources:
 * - https://8a.nu/grading
 * - https://www.moonboard.com/grade-conversion
 * - https://www.rockfax.com/databases/grade_comparisons/
 */
export const GRADE_MAPPING: Record<string, GradeMapping> = {
    // === FONTAINEBLEAU GRADES ===
    '3': { normalized: 0, vScale: ['VB'] },
    '4': { normalized: 5, vScale: ['VB', 'V0'] },
    '5': { normalized: 10, vScale: ['V0'] },
    '5+': { normalized: 15, vScale: ['V0', 'V1'] },
    '6A': { normalized: 20, vScale: ['V1', 'V2'] },
    '6A+': { normalized: 25, vScale: ['V2', 'V3'] },
    '6B': { normalized: 30, vScale: ['V3', 'V4'] },
    '6B+': { normalized: 35, vScale: ['V4'] },
    '6C': { normalized: 40, vScale: ['V4', 'V5'] },
    '6C+': { normalized: 45, vScale: ['V5'] },
    '7A': { normalized: 50, vScale: ['V6'] },
    '7A+': { normalized: 55, vScale: ['V7'] },
    '7B': { normalized: 60, vScale: ['V8'] },
    '7B+': { normalized: 65, vScale: ['V8', 'V9'] },
    '7C': { normalized: 70, vScale: ['V9'] },
    '7C+': { normalized: 73, vScale: ['V10'] },
    '8A': { normalized: 76, vScale: ['V11'] },
    '8A+': { normalized: 79, vScale: ['V12'] },
    '8B': { normalized: 82, vScale: ['V13'] },
    '8B+': { normalized: 85, vScale: ['V14'] },
    '8C': { normalized: 88, vScale: ['V15'] },
    '8C+': { normalized: 91, vScale: ['V16'] },
    '9A': { normalized: 94, vScale: ['V16', 'V17'] },
    '9A+': { normalized: 96, vScale: ['V17'] },
    '9B': { normalized: 98, vScale: ['V17'] },
    '9B+': { normalized: 99, vScale: ['V17'] },
    '9C': { normalized: 100, vScale: ['V17'] },

    // === V-SCALE GRADES ===
    VB: { normalized: 3, fontainebleau: ['3', '4'] },
    V0: { normalized: 12, fontainebleau: ['5', '5+'] },
    V1: { normalized: 18, fontainebleau: ['5+', '6A'] },
    V2: { normalized: 23, fontainebleau: ['6A', '6A+'] },
    V3: { normalized: 28, fontainebleau: ['6A+', '6B'] },
    V4: { normalized: 33, fontainebleau: ['6B', '6B+', '6C'] },
    V5: { normalized: 43, fontainebleau: ['6C', '6C+'] },
    V6: { normalized: 50, fontainebleau: ['7A'] },
    V7: { normalized: 55, fontainebleau: ['7A+'] },
    V8: { normalized: 62, fontainebleau: ['7B', '7B+'] },
    V9: { normalized: 68, fontainebleau: ['7B+', '7C'] },
    V10: { normalized: 73, fontainebleau: ['7C+'] },
    V11: { normalized: 76, fontainebleau: ['8A'] },
    V12: { normalized: 79, fontainebleau: ['8A+'] },
    V13: { normalized: 82, fontainebleau: ['8B'] },
    V14: { normalized: 85, fontainebleau: ['8B+'] },
    V15: { normalized: 88, fontainebleau: ['8C'] },
    V16: { normalized: 90, fontainebleau: ['8C+', '9A'] },
    V17: { normalized: 97, fontainebleau: ['9A+', '9B', '9B+', '9C'] },
} as const;

/**
 * Récupère la valeur normalisée d'un grade.
 *
 * @param grade - Le grade à normaliser
 * @returns La valeur normalisée (0-100), ou -1 si grade inconnu
 */
export function getNormalizedValue(grade: string): number {
    return GRADE_MAPPING[grade]?.normalized ?? -1;
}

/**
 * Vérifie si un grade est valide (existe dans le mapping).
 *
 * @param grade - Le grade à vérifier
 * @returns true si le grade existe
 */
export function isValidGrade(grade: string): boolean {
    return grade in GRADE_MAPPING;
}

/**
 * Détecte automatiquement le système d'un grade.
 *
 * @param grade - Le grade à analyser
 * @returns Le système détecté ou null si inconnu
 */
export function detectGradeSystem(grade: string): GradeSystem | null {
    if ((FONTAINEBLEAU_GRADES as readonly string[]).includes(grade)) {
        return 'fontainebleau';
    }
    if ((V_SCALE_GRADES as readonly string[]).includes(grade)) {
        return 'v_scale';
    }
    return null;
}
