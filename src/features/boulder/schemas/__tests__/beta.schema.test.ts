import { describe, it, expect } from 'vitest';
import {
    BetaCreationSchema,
    CreateBoulderWithBetaSchema,
    GradeSystemSchema,
    FONTAINEBLEAU_GRADE_REGEX,
    V_SCALE_GRADE_REGEX,
} from '../beta.schema';
import { createEmptyDrawingData } from '@/lib/schemas/drawing.schema';

describe('GradeSystemSchema', () => {
    it('accepte "fontainebleau"', () => {
        const result = GradeSystemSchema.safeParse('fontainebleau');
        expect(result.success).toBe(true);
    });

    it('accepte "v_scale"', () => {
        const result = GradeSystemSchema.safeParse('v_scale');
        expect(result.success).toBe(true);
    });

    it('rejette un système invalide', () => {
        const result = GradeSystemSchema.safeParse('invalid');
        expect(result.success).toBe(false);
    });
});

describe('Regex - Fontainebleau', () => {
    const validGrades = [
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
        '9C+',
    ];

    const invalidGrades = [
        '2',
        '10A',
        '7D',
        '6AA',
        'V5',
        '7a',
        '7A++',
        '5++',
        '',
    ];

    validGrades.forEach((grade) => {
        it(`valide "${grade}" comme cotation Fontainebleau`, () => {
            expect(FONTAINEBLEAU_GRADE_REGEX.test(grade)).toBe(true);
        });
    });

    invalidGrades.forEach((grade) => {
        it(`rejette "${grade}" comme cotation Fontainebleau`, () => {
            expect(FONTAINEBLEAU_GRADE_REGEX.test(grade)).toBe(false);
        });
    });
});

describe('Regex - V-Scale', () => {
    const validGrades = [
        'VB',
        'V0',
        'V1',
        'V5',
        'V9',
        'V10',
        'V15',
        'V17',
    ];

    const invalidGrades = [
        'V18',
        'V-1',
        'VBB',
        'v5',
        '7A',
        'VV',
        'V01',
        '',
    ];

    validGrades.forEach((grade) => {
        it(`valide "${grade}" comme cotation V-Scale`, () => {
            expect(V_SCALE_GRADE_REGEX.test(grade)).toBe(true);
        });
    });

    invalidGrades.forEach((grade) => {
        it(`rejette "${grade}" comme cotation V-Scale`, () => {
            expect(V_SCALE_GRADE_REGEX.test(grade)).toBe(false);
        });
    });
});

describe('BetaCreationSchema', () => {
    const validBoulderUuid = '550e8400-e29b-41d4-a716-446655440000';

    describe('Validation - Cas valides', () => {
        it('accepte une beta avec cotation Fontainebleau', () => {
            const validData = {
                boulder_id: validBoulderUuid,
                grade_value: '7A',
                grade_system: 'fontainebleau' as const,
                drawing_data: createEmptyDrawingData(),
                is_public: false,
            };

            const result = BetaCreationSchema.safeParse(validData);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.grade_value).toBe('7A');
                expect(result.data.grade_system).toBe('fontainebleau');
            }
        });

        it('accepte une beta avec cotation V-Scale', () => {
            const validData = {
                boulder_id: validBoulderUuid,
                grade_value: 'V5',
                grade_system: 'v_scale' as const,
                is_public: true,
            };

            const result = BetaCreationSchema.safeParse(validData);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.grade_value).toBe('V5');
                expect(result.data.is_public).toBe(true);
            }
        });

        it('accepte une beta sans drawing_data (optionnel)', () => {
            const validData = {
                boulder_id: validBoulderUuid,
                grade_value: '6B+',
                grade_system: 'fontainebleau' as const,
            };

            const result = BetaCreationSchema.safeParse(validData);

            expect(result.success).toBe(true);
        });

        it('applique is_public: false par défaut', () => {
            const validData = {
                boulder_id: validBoulderUuid,
                grade_value: 'V3',
                grade_system: 'v_scale' as const,
            };

            const result = BetaCreationSchema.safeParse(validData);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.is_public).toBe(false);
            }
        });
    });

    describe('Validation - UUID invalide', () => {
        it('rejette un boulder_id non UUID', () => {
            const invalidData = {
                boulder_id: 'not-a-uuid',
                grade_value: '7A',
                grade_system: 'fontainebleau' as const,
            };

            const result = BetaCreationSchema.safeParse(invalidData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toContain('UUID');
            }
        });
    });

    describe('Validation conditionnelle - Fontainebleau', () => {
        it('rejette une cotation V-Scale avec système Fontainebleau', () => {
            const invalidData = {
                boulder_id: validBoulderUuid,
                grade_value: 'V5',
                grade_system: 'fontainebleau' as const,
            };

            const result = BetaCreationSchema.safeParse(invalidData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toContain(
                    'incompatible'
                );
            }
        });

        it('rejette une cotation invalide avec système Fontainebleau', () => {
            const invalidData = {
                boulder_id: validBoulderUuid,
                grade_value: '10A',
                grade_system: 'fontainebleau' as const,
            };

            const result = BetaCreationSchema.safeParse(invalidData);

            expect(result.success).toBe(false);
        });
    });

    describe('Validation conditionnelle - V-Scale', () => {
        it('rejette une cotation Fontainebleau avec système V-Scale', () => {
            const invalidData = {
                boulder_id: validBoulderUuid,
                grade_value: '7A',
                grade_system: 'v_scale' as const,
            };

            const result = BetaCreationSchema.safeParse(invalidData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toContain(
                    'incompatible'
                );
            }
        });

        it('rejette une cotation invalide avec système V-Scale', () => {
            const invalidData = {
                boulder_id: validBoulderUuid,
                grade_value: 'V18',
                grade_system: 'v_scale' as const,
            };

            const result = BetaCreationSchema.safeParse(invalidData);

            expect(result.success).toBe(false);
        });
    });
});

describe('CreateBoulderWithBetaSchema', () => {
    it('accepte des données combinées valides', () => {
        const validData = {
            boulder: {
                name: 'Karma',
                location: 'Fontainebleau',
                image_url:
                    'https://supabase.co/storage/v1/object/public/boulders/test.webp',
            },
            beta: {
                grade_value: '7A',
                grade_system: 'fontainebleau' as const,
                is_public: false,
            },
        };

        const result = CreateBoulderWithBetaSchema.safeParse(validData);

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.boulder.name).toBe('Karma');
            expect(result.data.beta.grade_value).toBe('7A');
        }
    });

    it('rejette si le boulder est invalide', () => {
        const invalidData = {
            boulder: {
                name: '', // Invalide
                image_url: 'https://example.com/test.webp',
            },
            beta: {
                grade_value: 'V5',
                grade_system: 'v_scale' as const,
            },
        };

        const result = CreateBoulderWithBetaSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
    });

    it('rejette si la beta est invalide', () => {
        const invalidData = {
            boulder: {
                name: 'Karma',
                image_url: 'https://example.com/test.webp',
            },
            beta: {
                grade_value: 'INVALID',
                grade_system: 'fontainebleau' as const,
            },
        };

        const result = CreateBoulderWithBetaSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
    });
});
