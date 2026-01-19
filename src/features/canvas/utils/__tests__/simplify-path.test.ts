import { describe, it, expect } from 'vitest';
import {
    simplifyPath,
    simplifyFlatPath,
    calculateReductionRatio,
    simplifyPathWithStats,
    TOLERANCE_PERCENT,
    TOLERANCE_PIXELS,
} from '../simplify-path';
import type { Point } from '@/lib/schemas/drawing.schema';

// ============================================================================
// TESTS - simplifyPath
// ============================================================================

describe('simplifyPath', () => {
    describe('cas triviaux', () => {
        it('retourne un tableau vide si aucun point', () => {
            const result = simplifyPath([]);
            expect(result).toEqual([]);
        });

        it('retourne le même point si un seul point', () => {
            const points: Point[] = [{ x: 50, y: 50 }];
            const result = simplifyPath(points);
            expect(result).toEqual(points);
        });

        it('retourne les mêmes points si seulement 2 points', () => {
            const points: Point[] = [
                { x: 0, y: 0 },
                { x: 100, y: 100 },
            ];
            const result = simplifyPath(points);
            expect(result).toEqual(points);
        });
    });

    describe('simplification de tracés', () => {
        it('réduit les points alignés à début et fin', () => {
            const points: Point[] = [
                { x: 0, y: 0 },
                { x: 25, y: 25 },
                { x: 50, y: 50 },
                { x: 75, y: 75 },
                { x: 100, y: 100 },
            ];

            const result = simplifyPath(points);

            // Points parfaitement alignés = seulement début et fin
            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({ x: 0, y: 0 });
            expect(result[result.length - 1]).toEqual({ x: 100, y: 100 });
        });

        it('préserve les points formant un angle', () => {
            const points: Point[] = [
                { x: 0, y: 0 },
                { x: 50, y: 0 },  // Point de virage
                { x: 50, y: 50 },
            ];

            const result = simplifyPath(points, 0.1);

            // Le point de virage devrait être préservé
            expect(result.length).toBeGreaterThanOrEqual(3);
        });

        it('réduit un tracé avec micro-variations', () => {
            // Simule un tracé avec des tremblements
            const points: Point[] = [
                { x: 0, y: 0 },
                { x: 10.01, y: 10.02 },
                { x: 20.02, y: 19.98 },
                { x: 30.01, y: 30.03 },
                { x: 40.00, y: 40.01 },
                { x: 50, y: 50 },
            ];

            const result = simplifyPath(points, TOLERANCE_PERCENT);

            // Devrait réduire car les points sont quasi-alignés
            expect(result.length).toBeLessThan(points.length);
        });
    });

    describe('paramètre tolerance', () => {
        it('une tolérance plus élevée supprime plus de points', () => {
            const points: Point[] = [
                { x: 0, y: 0 },
                { x: 25, y: 26 },  // Légèrement hors ligne
                { x: 50, y: 50 },
                { x: 75, y: 74 },  // Légèrement hors ligne
                { x: 100, y: 100 },
            ];

            const resultLow = simplifyPath(points, 0.1);
            const resultHigh = simplifyPath(points, 5);

            expect(resultHigh.length).toBeLessThanOrEqual(resultLow.length);
        });
    });
});

// ============================================================================
// TESTS - simplifyFlatPath
// ============================================================================

describe('simplifyFlatPath', () => {
    it('convertit et simplifie un tableau plat Konva', () => {
        const flatPoints = [0, 0, 25, 25, 50, 50, 75, 75, 100, 100];
        const result = simplifyFlatPath(flatPoints);

        // Points alignés = seulement début et fin (4 valeurs)
        expect(result).toHaveLength(4);
        expect(result).toEqual([0, 0, 100, 100]);
    });

    it('lève une erreur si le nombre d\'éléments est impair', () => {
        const oddPoints = [0, 0, 25]; // 3 éléments = impair

        expect(() => simplifyFlatPath(oddPoints)).toThrow(
            "Le tableau de points doit contenir un nombre pair d'éléments"
        );
    });

    it('gère un tableau vide', () => {
        const result = simplifyFlatPath([]);
        expect(result).toEqual([]);
    });

    it('préserve les points formant un angle', () => {
        const flatPoints = [0, 0, 50, 0, 50, 50]; // Forme un L

        const result = simplifyFlatPath(flatPoints, 0.1);

        // Devrait préserver le point de virage
        expect(result.length).toBeGreaterThanOrEqual(6);
    });
});

// ============================================================================
// TESTS - calculateReductionRatio
// ============================================================================

describe('calculateReductionRatio', () => {
    it('calcule 75% de réduction pour 100 → 25 points', () => {
        const ratio = calculateReductionRatio(100, 25);
        expect(ratio).toBe(75);
    });

    it('calcule 50% de réduction pour 10 → 5 points', () => {
        const ratio = calculateReductionRatio(10, 5);
        expect(ratio).toBe(50);
    });

    it('calcule 0% si aucun point original', () => {
        const ratio = calculateReductionRatio(0, 0);
        expect(ratio).toBe(0);
    });

    it('calcule 0% si même nombre de points', () => {
        const ratio = calculateReductionRatio(10, 10);
        expect(ratio).toBe(0);
    });

    it('arrondit correctement', () => {
        // 100 → 33 = 67% (exactement)
        const ratio = calculateReductionRatio(100, 33);
        expect(ratio).toBe(67);
    });
});

// ============================================================================
// TESTS - simplifyPathWithStats
// ============================================================================

describe('simplifyPathWithStats', () => {
    it('retourne les statistiques complètes', () => {
        const points: Point[] = [
            { x: 0, y: 0 },
            { x: 25, y: 25 },
            { x: 50, y: 50 },
            { x: 75, y: 75 },
            { x: 100, y: 100 },
        ];

        const result = simplifyPathWithStats(points);

        expect(result.originalCount).toBe(5);
        expect(result.simplifiedCount).toBe(2); // Points alignés
        expect(result.reductionPercent).toBe(60);
        expect(result.points).toHaveLength(2);
    });

    it('gère un tracé non simplifiable', () => {
        const points: Point[] = [
            { x: 0, y: 0 },
            { x: 100, y: 100 },
        ];

        const result = simplifyPathWithStats(points);

        expect(result.originalCount).toBe(2);
        expect(result.simplifiedCount).toBe(2);
        expect(result.reductionPercent).toBe(0);
    });
});

// ============================================================================
// TESTS - Constantes exportées
// ============================================================================

describe('Constantes', () => {
    it('TOLERANCE_PERCENT est définie', () => {
        expect(TOLERANCE_PERCENT).toBe(0.15);
    });

    it('TOLERANCE_PIXELS est définie', () => {
        expect(TOLERANCE_PIXELS).toBe(1.5);
    });
});
