import {
    type FontainebleauGrade,
    FONTAINEBLEAU_GRADES,
    type GradeMapping,
    GRADE_MAPPING,
    type GradeSystem,
    type VScaleGrade,
    V_SCALE_GRADES,
    detectGradeSystem,
    getNormalizedValue,
    isValidGrade,
} from '../constants/grades';

/**
 * Résultat d'une conversion de grade.
 *
 * @property value - Le grade converti
 * @property isApproximate - true si la conversion n'est pas bijective
 */
export interface ConversionResult {
    readonly value: string;
    readonly isApproximate: boolean;
}

/**
 * Erreur lancée pour un grade invalide ou inconnu.
 */
export class InvalidGradeError extends Error {
    constructor(grade: string) {
        super(`Grade inconnu ou invalide : "${grade}"`);
        this.name = 'InvalidGradeError';
    }
}

/**
 * Convertit un grade d'un système vers un autre.
 *
 * @param value - Le grade à convertir (ex: "7A", "V5")
 * @param from - Le système source ('fontainebleau' | 'v_scale')
 * @param to - Le système cible ('fontainebleau' | 'v_scale')
 * @returns Le grade converti avec un flag indiquant si approximatif
 *
 * @throws {InvalidGradeError} Si le grade n'existe pas dans le mapping
 *
 * @example
 * ```typescript
 * // Conversion exacte
 * convertGrade('7A', 'fontainebleau', 'v_scale')
 * // → { value: 'V6', isApproximate: false }
 *
 * // Conversion approximative
 * convertGrade('6A+', 'fontainebleau', 'v_scale')
 * // → { value: 'V2', isApproximate: true }
 *
 * // Même système = pas de conversion
 * convertGrade('V5', 'v_scale', 'v_scale')
 * // → { value: 'V5', isApproximate: false }
 * ```
 */
export function convertGrade(
    value: string,
    from: GradeSystem,
    to: GradeSystem
): ConversionResult {
    // Normalise la casse (ex: "6a" → "6A", "vb" → "VB")
    const normalizedValue = normalizeGradeCase(value, from);

    // Pas de conversion si même système
    if (from === to) {
        if (!isValidGrade(normalizedValue)) {
            throw new InvalidGradeError(value);
        }
        return { value: normalizedValue, isApproximate: false };
    }

    const mapping: GradeMapping | undefined = GRADE_MAPPING[normalizedValue];
    if (!mapping) {
        throw new InvalidGradeError(value);
    }

    // Récupère les correspondances vers le système cible
    const correspondences =
        to === 'v_scale' ? mapping.vScale : mapping.fontainebleau;

    if (!correspondences || correspondences.length === 0) {
        throw new InvalidGradeError(value);
    }

    // Retourne le premier grade (convention: le plus proche en difficulté)
    const convertedValue = correspondences[0];
    const isApproximate = correspondences.length > 1;

    return { value: convertedValue, isApproximate };
}

/**
 * Compare deux grades pour le tri.
 *
 * @param grade1 - Premier grade
 * @param grade2 - Deuxième grade
 * @param system - Système de cotation (optionnel, auto-détecté si omis)
 * @returns -1 si grade1 < grade2, 0 si égaux, 1 si grade1 > grade2
 *
 * @description
 * Utilise l'échelle normalisée (0-100) pour permettre la comparaison
 * entre grades de systèmes différents.
 *
 * @example
 * ```typescript
 * // Tri de Fontainebleau
 * compareGrades('6A', '7A', 'fontainebleau') // → -1
 *
 * // Tri mixte (FB vs V-Scale)
 * compareGrades('7A', 'V6', 'fontainebleau') // → 0 (équivalents)
 *
 * // Utilisable avec Array.sort()
 * grades.sort((a, b) => compareGrades(a, b))
 * ```
 */
export function compareGrades(
    grade1: string,
    grade2: string,
    system?: GradeSystem
): -1 | 0 | 1 {
    // Normalise les grades
    const system1 = system ?? detectGradeSystem(grade1);
    const system2 = system ?? detectGradeSystem(grade2);

    const normalized1 = normalizeGradeCase(
        grade1,
        system1 ?? 'fontainebleau'
    );
    const normalized2 = normalizeGradeCase(
        grade2,
        system2 ?? 'fontainebleau'
    );

    const value1 = getNormalizedValue(normalized1);
    const value2 = getNormalizedValue(normalized2);

    // Grades inconnus sont considérés comme les plus bas
    if (value1 === -1 && value2 === -1) return 0;
    if (value1 === -1) return -1;
    if (value2 === -1) return 1;

    if (value1 < value2) return -1;
    if (value1 > value2) return 1;
    return 0;
}

/**
 * Crée une fonction de comparaison pour Array.sort().
 *
 * @param ascending - true pour trier du plus facile au plus dur
 * @returns Fonction comparateur compatible avec Array.sort()
 *
 * @example
 * ```typescript
 * const grades = ['7A', 'V3', '6B', 'V10'];
 * grades.sort(createGradeComparator(true));
 * // → ['V3', '6B', '7A', 'V10']
 * ```
 */
export function createGradeComparator(
    ascending = true
): (a: string, b: string) => number {
    return (a: string, b: string) => {
        const result = compareGrades(a, b);
        return ascending ? result : -result;
    };
}

/**
 * Retourne la liste des grades valides pour un système.
 *
 * @param system - Le système de cotation
 * @returns Liste ordonnée des grades (du plus facile au plus dur)
 *
 * @example
 * ```typescript
 * getGradeValues('fontainebleau')
 * // → ['3', '4', '5', '5+', '6A', ...]
 *
 * getGradeValues('v_scale')
 * // → ['VB', 'V0', 'V1', 'V2', ...]
 * ```
 */
export function getGradeValues(system: GradeSystem): readonly string[] {
    return system === 'fontainebleau' ? FONTAINEBLEAU_GRADES : V_SCALE_GRADES;
}

/**
 * Retourne tous les grades correspondants dans un système cible.
 *
 * @param value - Le grade source
 * @param from - Le système source
 * @param to - Le système cible
 * @returns Tableau de tous les grades correspondants (peut être vide)
 *
 * @example
 * ```typescript
 * getAllConversions('6B', 'fontainebleau', 'v_scale')
 * // → ['V3', 'V4']
 * ```
 */
export function getAllConversions(
    value: string,
    from: GradeSystem,
    to: GradeSystem
): readonly string[] {
    if (from === to) {
        return isValidGrade(value) ? [value] : [];
    }

    const normalizedValue = normalizeGradeCase(value, from);
    const mapping = GRADE_MAPPING[normalizedValue];

    if (!mapping) return [];

    const correspondences =
        to === 'v_scale' ? mapping.vScale : mapping.fontainebleau;

    return correspondences ?? [];
}

/**
 * Normalise la casse d'un grade selon son système.
 *
 * @param grade - Le grade à normaliser
 * @param system - Le système de cotation
 * @returns Le grade avec la bonne casse
 *
 * @example
 * ```typescript
 * normalizeGradeCase('6a+', 'fontainebleau') // → '6A+'
 * normalizeGradeCase('vb', 'v_scale') // → 'VB'
 * ```
 */
export function normalizeGradeCase(
    grade: string,
    system: GradeSystem
): string {
    if (system === 'fontainebleau') {
        // Fontainebleau: chiffres + lettres majuscules + optionnel "+"
        // Ex: "6a+" → "6A+"
        return grade.toUpperCase();
    } else {
        // V-Scale: "V" majuscule + chiffre(s) ou "VB"
        // Ex: "vb" → "VB", "v5" → "V5"
        return grade.toUpperCase();
    }
}

/**
 * Trouve le grade le plus proche dans un système donné.
 *
 * @param targetNormalized - Valeur normalisée cible (0-100)
 * @param system - Système dans lequel chercher
 * @returns Le grade le plus proche
 *
 * @example
 * ```typescript
 * findClosestGrade(51, 'fontainebleau') // → '7A' (normalized: 50)
 * ```
 */
export function findClosestGrade(
    targetNormalized: number,
    system: GradeSystem
): string {
    const grades = getGradeValues(system);
    let closest = grades[0];
    let minDiff = Infinity;

    for (const grade of grades) {
        const normalized = getNormalizedValue(grade);
        const diff = Math.abs(normalized - targetNormalized);

        if (diff < minDiff) {
            minDiff = diff;
            closest = grade;
        }
    }

    return closest;
}

// Re-export des types et constantes utiles depuis grades.ts
export type { FontainebleauGrade, VScaleGrade, GradeSystem };
export { FONTAINEBLEAU_GRADES, V_SCALE_GRADES, isValidGrade, detectGradeSystem };
