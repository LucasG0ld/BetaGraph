import { describe, expect, it } from 'vitest';
import {
    compareGrades,
    convertGrade,
    createGradeComparator,
    detectGradeSystem,
    FONTAINEBLEAU_GRADES,
    getAllConversions,
    getGradeValues,
    InvalidGradeError,
    isValidGrade,
    normalizeGradeCase,
    V_SCALE_GRADES,
} from '../grade-converter';

// =============================================================================
// TESTS: convertGrade
// =============================================================================

describe('convertGrade', () => {
    describe('Conversion Fontainebleau → V-Scale', () => {
        it('doit convertir 7A → V6 (bijection exacte)', () => {
            const result = convertGrade('7A', 'fontainebleau', 'v_scale');
            expect(result.value).toBe('V6');
            expect(result.isApproximate).toBe(false);
        });

        it('doit convertir 7A+ → V7 (bijection exacte)', () => {
            const result = convertGrade('7A+', 'fontainebleau', 'v_scale');
            expect(result.value).toBe('V7');
            expect(result.isApproximate).toBe(false);
        });

        it('doit convertir 6A+ → V2 avec isApproximate:true (non-bijectif)', () => {
            const result = convertGrade('6A+', 'fontainebleau', 'v_scale');
            expect(result.value).toBe('V2');
            expect(result.isApproximate).toBe(true);
        });

        it('doit convertir 6B → V3 avec isApproximate:true (non-bijectif)', () => {
            const result = convertGrade('6B', 'fontainebleau', 'v_scale');
            expect(result.value).toBe('V3');
            expect(result.isApproximate).toBe(true);
        });

        it('doit convertir le grade le plus bas (3) → VB', () => {
            const result = convertGrade('3', 'fontainebleau', 'v_scale');
            expect(result.value).toBe('VB');
            expect(result.isApproximate).toBe(false);
        });

        it('doit convertir le grade le plus haut (9C) → V17', () => {
            const result = convertGrade('9C', 'fontainebleau', 'v_scale');
            expect(result.value).toBe('V17');
            expect(result.isApproximate).toBe(false);
        });
    });

    describe('Conversion V-Scale → Fontainebleau', () => {
        it('doit convertir V6 → 7A (bijection exacte)', () => {
            const result = convertGrade('V6', 'v_scale', 'fontainebleau');
            expect(result.value).toBe('7A');
            expect(result.isApproximate).toBe(false);
        });

        it('doit convertir V7 → 7A+ (bijection exacte)', () => {
            const result = convertGrade('V7', 'v_scale', 'fontainebleau');
            expect(result.value).toBe('7A+');
            expect(result.isApproximate).toBe(false);
        });

        it('doit convertir V4 → 6B avec isApproximate:true (non-bijectif)', () => {
            const result = convertGrade('V4', 'v_scale', 'fontainebleau');
            expect(result.value).toBe('6B');
            expect(result.isApproximate).toBe(true);
        });

        it('doit convertir VB → 3 avec isApproximate:true (non-bijectif)', () => {
            const result = convertGrade('VB', 'v_scale', 'fontainebleau');
            expect(result.value).toBe('3');
            expect(result.isApproximate).toBe(true);
        });

        it('doit convertir V17 → 9A+ avec isApproximate:true', () => {
            const result = convertGrade('V17', 'v_scale', 'fontainebleau');
            expect(result.value).toBe('9A+');
            expect(result.isApproximate).toBe(true);
        });
    });

    describe('Même système (pas de conversion)', () => {
        it('doit retourner le même grade FB si systèmes identiques', () => {
            const result = convertGrade('7A', 'fontainebleau', 'fontainebleau');
            expect(result.value).toBe('7A');
            expect(result.isApproximate).toBe(false);
        });

        it('doit retourner le même grade V-Scale si systèmes identiques', () => {
            const result = convertGrade('V5', 'v_scale', 'v_scale');
            expect(result.value).toBe('V5');
            expect(result.isApproximate).toBe(false);
        });
    });

    describe('Résilience: Normalisation de casse', () => {
        it('doit convertir "6a" (minuscule) comme "6A"', () => {
            const result = convertGrade('6a', 'fontainebleau', 'v_scale');
            expect(result.value).toBe('V1');
        });

        it('doit convertir "6a+" (minuscule) comme "6A+"', () => {
            const result = convertGrade('6a+', 'fontainebleau', 'v_scale');
            expect(result.value).toBe('V2');
        });

        it('doit convertir "vb" (minuscule) comme "VB"', () => {
            const result = convertGrade('vb', 'v_scale', 'fontainebleau');
            expect(result.value).toBe('3');
        });

        it('doit convertir "v5" (minuscule) comme "V5"', () => {
            const result = convertGrade('v5', 'v_scale', 'fontainebleau');
            expect(result.value).toBe('6C');
        });
    });

    describe('Gestion des erreurs: Grades inconnus', () => {
        it('doit lever InvalidGradeError pour un grade FB inexistant', () => {
            expect(() => convertGrade('10A', 'fontainebleau', 'v_scale'))
                .toThrow(InvalidGradeError);
        });

        it('doit lever InvalidGradeError pour un grade V inexistant', () => {
            expect(() => convertGrade('V20', 'v_scale', 'fontainebleau'))
                .toThrow(InvalidGradeError);
        });

        it('doit lever InvalidGradeError pour une chaîne vide', () => {
            expect(() => convertGrade('', 'fontainebleau', 'v_scale'))
                .toThrow(InvalidGradeError);
        });

        it('doit lever InvalidGradeError pour un format invalide', () => {
            expect(() => convertGrade('ABC', 'fontainebleau', 'v_scale'))
                .toThrow(InvalidGradeError);
        });
    });
});

// =============================================================================
// TESTS: compareGrades
// =============================================================================

describe('compareGrades', () => {
    describe('Comparaison dans le même système (Fontainebleau)', () => {
        it('doit retourner -1 si grade1 < grade2', () => {
            expect(compareGrades('6A', '7A', 'fontainebleau')).toBe(-1);
        });

        it('doit retourner 1 si grade1 > grade2', () => {
            expect(compareGrades('8A', '6B', 'fontainebleau')).toBe(1);
        });

        it('doit retourner 0 si grades identiques', () => {
            expect(compareGrades('7A', '7A', 'fontainebleau')).toBe(0);
        });

        it('doit ordonner correctement les grades adjacents', () => {
            expect(compareGrades('6A', '6A+', 'fontainebleau')).toBe(-1);
            expect(compareGrades('6A+', '6B', 'fontainebleau')).toBe(-1);
            expect(compareGrades('6B', '6B+', 'fontainebleau')).toBe(-1);
        });
    });

    describe('Comparaison dans le même système (V-Scale)', () => {
        it('doit retourner -1 si grade1 < grade2', () => {
            expect(compareGrades('V3', 'V8', 'v_scale')).toBe(-1);
        });

        it('doit retourner 1 si grade1 > grade2', () => {
            expect(compareGrades('V10', 'V5', 'v_scale')).toBe(1);
        });

        it('doit retourner 0 si grades identiques', () => {
            expect(compareGrades('VB', 'VB', 'v_scale')).toBe(0);
        });
    });

    describe('Comparaison mixte (Fontainebleau vs V-Scale)', () => {
        it('doit comparer 7A (FB) et V6 (équivalents) → 0', () => {
            expect(compareGrades('7A', 'V6')).toBe(0);
        });

        it('doit comparer 6B (FB) inférieur à V6', () => {
            expect(compareGrades('6B', 'V6')).toBe(-1);
        });

        it('doit comparer 8A (FB) supérieur à V6', () => {
            expect(compareGrades('8A', 'V6')).toBe(1);
        });

        it('doit gérer les extremes: 3 (FB) vs V17', () => {
            expect(compareGrades('3', 'V17')).toBe(-1);
            expect(compareGrades('V17', '3')).toBe(1);
        });
    });

    describe('Résilience: Grades inconnus', () => {
        it('doit traiter un grade inconnu comme le plus bas (-1)', () => {
            expect(compareGrades('INVALID', '7A')).toBe(-1);
        });

        it('doit retourner 0 si les deux sont inconnus', () => {
            expect(compareGrades('INVALID1', 'INVALID2')).toBe(0);
        });
    });
});

// =============================================================================
// TESTS: createGradeComparator (pour Array.sort)
// =============================================================================

describe('createGradeComparator', () => {
    it('doit trier un tableau FB du plus facile au plus dur (ascending)', () => {
        const grades = ['7A', '5', '6B', '8A', '4'];
        const sorted = [...grades].sort(createGradeComparator(true));
        expect(sorted).toEqual(['4', '5', '6B', '7A', '8A']);
    });

    it('doit trier un tableau FB du plus dur au plus facile (descending)', () => {
        const grades = ['7A', '5', '6B', '8A', '4'];
        const sorted = [...grades].sort(createGradeComparator(false));
        expect(sorted).toEqual(['8A', '7A', '6B', '5', '4']);
    });

    it('doit trier un tableau V-Scale correctement', () => {
        const grades = ['V5', 'VB', 'V10', 'V2'];
        const sorted = [...grades].sort(createGradeComparator(true));
        expect(sorted).toEqual(['VB', 'V2', 'V5', 'V10']);
    });

    it('doit trier un tableau MIXTE (FB + V-Scale) par difficulté', () => {
        const grades = ['7A', 'V3', '6B', 'V10', 'VB'];
        const sorted = [...grades].sort(createGradeComparator(true));
        // VB(3) < V3(28) < 6B(30) ≈ 7A(50) < V10(73)
        expect(sorted).toEqual(['VB', 'V3', '6B', '7A', 'V10']);
    });
});

// =============================================================================
// TESTS: getGradeValues
// =============================================================================

describe('getGradeValues', () => {
    it('doit retourner tous les grades Fontainebleau', () => {
        const grades = getGradeValues('fontainebleau');
        expect(grades).toEqual(FONTAINEBLEAU_GRADES);
        expect(grades.length).toBe(27);
        expect(grades[0]).toBe('3');
        expect(grades[grades.length - 1]).toBe('9C');
    });

    it('doit retourner tous les grades V-Scale', () => {
        const grades = getGradeValues('v_scale');
        expect(grades).toEqual(V_SCALE_GRADES);
        expect(grades.length).toBe(19);
        expect(grades[0]).toBe('VB');
        expect(grades[grades.length - 1]).toBe('V17');
    });
});

// =============================================================================
// TESTS: getAllConversions
// =============================================================================

describe('getAllConversions', () => {
    it('doit retourner toutes les correspondances pour 6B → V-Scale', () => {
        const result = getAllConversions('6B', 'fontainebleau', 'v_scale');
        expect(result).toEqual(['V3', 'V4']);
    });

    it('doit retourner une seule correspondance pour 7A', () => {
        const result = getAllConversions('7A', 'fontainebleau', 'v_scale');
        expect(result).toEqual(['V6']);
    });

    it('doit retourner le grade lui-même si même système', () => {
        const result = getAllConversions('7A', 'fontainebleau', 'fontainebleau');
        expect(result).toEqual(['7A']);
    });

    it('doit retourner tableau vide pour grade invalide', () => {
        const result = getAllConversions('INVALID', 'fontainebleau', 'v_scale');
        expect(result).toEqual([]);
    });
});

// =============================================================================
// TESTS: Utilitaires (isValidGrade, detectGradeSystem, normalizeGradeCase)
// =============================================================================

describe('isValidGrade', () => {
    it('doit valider les grades Fontainebleau', () => {
        expect(isValidGrade('7A')).toBe(true);
        expect(isValidGrade('6A+')).toBe(true);
        expect(isValidGrade('9C')).toBe(true);
    });

    it('doit valider les grades V-Scale', () => {
        expect(isValidGrade('VB')).toBe(true);
        expect(isValidGrade('V5')).toBe(true);
        expect(isValidGrade('V17')).toBe(true);
    });

    it('doit rejeter les grades invalides', () => {
        expect(isValidGrade('10A')).toBe(false);
        expect(isValidGrade('V20')).toBe(false);
        expect(isValidGrade('')).toBe(false);
        expect(isValidGrade('ABC')).toBe(false);
    });
});

describe('detectGradeSystem', () => {
    it('doit détecter Fontainebleau', () => {
        expect(detectGradeSystem('7A')).toBe('fontainebleau');
        expect(detectGradeSystem('6A+')).toBe('fontainebleau');
        expect(detectGradeSystem('5+')).toBe('fontainebleau');
    });

    it('doit détecter V-Scale', () => {
        expect(detectGradeSystem('VB')).toBe('v_scale');
        expect(detectGradeSystem('V5')).toBe('v_scale');
        expect(detectGradeSystem('V17')).toBe('v_scale');
    });

    it('doit retourner null pour grade inconnu', () => {
        expect(detectGradeSystem('INVALID')).toBeNull();
        expect(detectGradeSystem('')).toBeNull();
    });
});

describe('normalizeGradeCase', () => {
    it('doit normaliser les grades Fontainebleau en majuscules', () => {
        expect(normalizeGradeCase('6a', 'fontainebleau')).toBe('6A');
        expect(normalizeGradeCase('6a+', 'fontainebleau')).toBe('6A+');
        expect(normalizeGradeCase('7c+', 'fontainebleau')).toBe('7C+');
    });

    it('doit normaliser les grades V-Scale en majuscules', () => {
        expect(normalizeGradeCase('vb', 'v_scale')).toBe('VB');
        expect(normalizeGradeCase('v5', 'v_scale')).toBe('V5');
        expect(normalizeGradeCase('v17', 'v_scale')).toBe('V17');
    });

    it('doit laisser inchangé un grade déjà correct', () => {
        expect(normalizeGradeCase('7A', 'fontainebleau')).toBe('7A');
        expect(normalizeGradeCase('V5', 'v_scale')).toBe('V5');
    });
});

// =============================================================================
// TESTS: Couverture complète des échelles
// =============================================================================

describe('Couverture complète: Tous grades FB convertibles', () => {
    it.each(FONTAINEBLEAU_GRADES as unknown as string[])(
        'doit convertir %s vers V-Scale sans erreur',
        (grade) => {
            expect(() => convertGrade(grade, 'fontainebleau', 'v_scale')).not.toThrow();
        }
    );
});

describe('Couverture complète: Tous grades V-Scale convertibles', () => {
    it.each(V_SCALE_GRADES as unknown as string[])(
        'doit convertir %s vers Fontainebleau sans erreur',
        (grade) => {
            expect(() => convertGrade(grade, 'v_scale', 'fontainebleau')).not.toThrow();
        }
    );
});
