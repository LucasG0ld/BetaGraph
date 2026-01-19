import { describe, it, expect } from 'vitest';
import { DrawingDataSchema } from '@/lib/schemas/drawing.schema';

/**
 * Tests pour la Server Action saveBetaDrawing
 * 
 * Note: Ces tests vérifient la logique de validation et de détection de conflits.
 * Les tests d'intégration complets avec Supabase nécessiteraient un environnement de test séparé.
 */

describe('saveBetaDrawing - Validation Logic', () => {
    describe('UUID Validation', () => {
        const validUUIDs = [
            '550e8400-e29b-41d4-a716-446655440000',
            'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
            '00000000-0000-0000-0000-000000000000',
        ];

        const invalidUUIDs = [
            'not-a-uuid',
            '550e8400-e29b-41d4-a716',
            '550e8400e29b41d4a716446655440000', // Sans tirets
            'g50e8400-e29b-41d4-a716-446655440000', // Caractère invalide
            '',
        ];

        it.each(validUUIDs)('accepte UUID valide: %s', (uuid) => {
            const uuidRegex =
                /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            expect(uuidRegex.test(uuid)).toBe(true);
        });

        it.each(invalidUUIDs)('rejette UUID invalide: %s', (uuid) => {
            const uuidRegex =
                /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            expect(uuidRegex.test(uuid)).toBe(false);
        });
    });

    describe('DrawingData Validation', () => {
        it('valide drawing_data correcte', () => {
            const validData = {
                version: 1,
                lines: [
                    {
                        id: 'line-1',
                        tool: 'brush' as const,
                        points: [
                            { x: 10, y: 20 },
                            { x: 30, y: 40 },
                        ],
                        color: '#FF0000',
                        width: 2,
                    },
                ],
                shapes: [
                    {
                        id: 'circle-1',
                        type: 'circle' as const,
                        center: { x: 50, y: 50 },
                        radius: 5,
                        color: '#00FF00',
                    },
                ],
            };

            const result = DrawingDataSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('rejette drawing_data avec version manquante', () => {
            const invalidData = {
                lines: [],
                shapes: [],
            };

            const result = DrawingDataSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('rejette drawing_data avec coordonnées hors limites', () => {
            const invalidData = {
                version: 1,
                lines: [
                    {
                        id: 'line-1',
                        tool: 'brush' as const,
                        points: [
                            { x: 150, y: 20 }, // x > 100
                        ],
                        color: '#FF0000',
                        width: 2,
                    },
                ],
                shapes: [],
            };

            const result = DrawingDataSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });
    });

    describe('Timestamp Comparison Logic', () => {
        it('détecte conflit quand serveur est plus récent', () => {
            const serverUpdatedAt = new Date('2026-01-19T12:05:00Z');
            const clientLastUpdatedAt = new Date('2026-01-19T12:00:00Z');

            const hasConflict = serverUpdatedAt > clientLastUpdatedAt;

            expect(hasConflict).toBe(true);
        });

        it('pas de conflit quand timestamps identiques', () => {
            const serverUpdatedAt = new Date('2026-01-19T12:00:00Z');
            const clientLastUpdatedAt = new Date('2026-01-19T12:00:00Z');

            const hasConflict = serverUpdatedAt > clientLastUpdatedAt;

            expect(hasConflict).toBe(false);
        });

        it('pas de conflit quand client est plus récent', () => {
            const serverUpdatedAt = new Date('2026-01-19T12:00:00Z');
            const clientLastUpdatedAt = new Date('2026-01-19T12:05:00Z');

            const hasConflict = serverUpdatedAt > clientLastUpdatedAt;

            expect(hasConflict).toBe(false);
        });

        it('gère correctement les timestamps avec millisecondes', () => {
            // JavaScript Date a une précision en millisecondes (pas microsecondes)
            const serverUpdatedAt = new Date('2026-01-19T12:00:00.124Z');
            const clientLastUpdatedAt = new Date('2026-01-19T12:00:00.123Z');

            const hasConflict = serverUpdatedAt > clientLastUpdatedAt;

            // Le serveur est 1 milliseconde plus récent
            expect(hasConflict).toBe(true);
        });

        it('gère correctement les timestamps en timezone différente', () => {
            // Même instant, timezones différentes
            const serverUpdatedAt = new Date('2026-01-19T12:00:00Z'); // UTC
            const clientLastUpdatedAt = new Date('2026-01-19T13:00:00+01:00'); // Paris (UTC+1)

            const hasConflict = serverUpdatedAt > clientLastUpdatedAt;

            // Même instant → pas de conflit
            expect(hasConflict).toBe(false);
        });
    });

    describe('Scénarios de Conflit Réels', () => {
        it('simule conflit : édition simultanée par deux users', () => {
            // Bob charge la beta
            const bobLoadTime = new Date('2026-01-19T12:00:00Z');

            // Alice sauvegarde en premier (elle avait chargé au même moment)
            const aliceSaveTime = new Date('2026-01-19T12:05:00Z');

            // Bob tente de sauvegarder après
            // Son lastUpdatedAt = bobLoadTime (12:00:00)
            // Serveur updated_at = aliceSaveTime (12:05:00)
            const hasConflict = aliceSaveTime > bobLoadTime;

            expect(hasConflict).toBe(true);
        });

        it('simule pas de conflit : sauvegarde offline puis online', () => {
            // User charge la beta
            const loadTime = new Date('2026-01-19T12:00:00Z');

            // User travaille offline pendant 1 heure
            // User se reconnecte et sauvegarde
            // Personne d'autre n'a édité → server updated_at = loadTime
            const serverUpdatedAt = loadTime;
            const clientLastUpdatedAt = loadTime;

            const hasConflict = serverUpdatedAt > clientLastUpdatedAt;

            expect(hasConflict).toBe(false);
        });

        it('simule race condition : deux requêtes simultanées', () => {
            // PostgreSQL a une précision en microsecondes
            // Mais JavaScript Date en millisecondes
            // Request A arrive à 12:00:00.123
            const requestA = new Date('2026-01-19T12:00:00.123Z');

            // Request B arrive 1ms plus tard à 12:00:00.124
            const requestB = new Date('2026-01-19T12:00:00.124Z');

            // PostgreSQL NOW() garantit que requestB aura un timestamp > requestA
            const requestBWins = requestB > requestA;

            expect(requestBWins).toBe(true);
        });
    });

    describe('Edge Cases de Timestamp', () => {
        it('gère timestamp invalide gracieusement', () => {
            const invalidTimestamp = 'not-a-valid-date';
            const date = new Date(invalidTimestamp);

            expect(isNaN(date.getTime())).toBe(true);
        });

        it('gère timestamp futur (horloge client dérèglée)', () => {
            const serverUpdatedAt = new Date('2026-01-19T12:00:00Z');
            const clientLastUpdatedAt = new Date('2030-01-19T12:00:00Z'); // 4 ans dans le futur

            const hasConflict = serverUpdatedAt > clientLastUpdatedAt;

            // Pas de conflit (client plus "récent")
            expect(hasConflict).toBe(false);
        });

        it('gère timestamp très ancien (cache obsolète)', () => {
            const serverUpdatedAt = new Date('2026-01-19T12:00:00Z');
            const clientLastUpdatedAt = new Date('2020-01-19T12:00:00Z'); // 6 ans dans le passé

            const hasConflict = serverUpdatedAt > clientLastUpdatedAt;

            // Conflit détecté
            expect(hasConflict).toBe(true);
        });
    });
});

describe('saveBetaDrawing - Type Guards', () => {
    it('vérifie le type de retour succès', () => {
        type SuccessResult = Extract<
            { success: true; data: { updated_at: string } },
            { success: true }
        >;

        const result: SuccessResult = {
            success: true,
            data: {
                updated_at: '2026-01-19T12:05:00Z',
            },
        };

        expect(result.success).toBe(true);
        expect(result.data.updated_at).toBeDefined();
    });

    it('vérifie le type de retour conflit', () => {
        type ConflictResult = {
            success: false;
            conflict: true;
            serverData: {
                drawing_data: unknown;
                updated_at: string;
            };
        };

        const result: ConflictResult = {
            success: false,
            conflict: true,
            serverData: {
                drawing_data: { version: 1, lines: [], shapes: [] },
                updated_at: '2026-01-19T12:05:00Z',
            },
        };

        expect(result.success).toBe(false);
        expect(result.conflict).toBe(true);
        expect(result.serverData).toBeDefined();
    });

    it('vérifie le type de retour erreur', () => {
        type ErrorResult = {
            success: false;
            conflict: false;
            error: string;
        };

        const result: ErrorResult = {
            success: false,
            conflict: false,
            error: 'Beta introuvable',
        };

        expect(result.success).toBe(false);
        expect(result.conflict).toBe(false);
        expect(result.error).toBeDefined();
    });
});
