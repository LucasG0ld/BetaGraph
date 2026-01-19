import { describe, it, expect } from 'vitest';
import { BoulderMetadataSchema } from '../boulder.schema';

describe('BoulderMetadataSchema', () => {
    describe('Validation - Cas valides', () => {
        it('accepte des métadonnées complètes valides', () => {
            const validData = {
                name: 'Karma',
                location: 'Fontainebleau, France',
                image_url:
                    'https://supabase.co/storage/v1/object/public/boulders/user123/abc.webp',
            };

            const result = BoulderMetadataSchema.safeParse(validData);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.name).toBe('Karma');
                expect(result.data.location).toBe('Fontainebleau, France');
            }
        });

        it('accepte un boulder sans localisation (optionnelle)', () => {
            const validData = {
                name: 'Unnamed Boulder',
                image_url: 'https://example.com/boulder.webp',
            };

            const result = BoulderMetadataSchema.safeParse(validData);

            expect(result.success).toBe(true);
        });

        it('trim les espaces du nom et de la localisation', () => {
            const validData = {
                name: '  Karma  ',
                location: '  Fontainebleau  ',
                image_url: 'https://example.com/boulder.webp',
            };

            const result = BoulderMetadataSchema.safeParse(validData);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.name).toBe('Karma');
                expect(result.data.location).toBe('Fontainebleau');
            }
        });
    });

    describe('Validation - Nom invalide', () => {
        it('rejette un nom vide', () => {
            const invalidData = {
                name: '',
                image_url: 'https://example.com/boulder.webp',
            };

            const result = BoulderMetadataSchema.safeParse(invalidData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toContain('requis');
            }
        });

        it('rejette un nom trop long (> 100 caractères)', () => {
            const invalidData = {
                name: 'A'.repeat(101),
                image_url: 'https://example.com/boulder.webp',
            };

            const result = BoulderMetadataSchema.safeParse(invalidData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toContain('100');
            }
        });

        it('rejette un nom manquant', () => {
            const invalidData = {
                image_url: 'https://example.com/boulder.webp',
            };

            const result = BoulderMetadataSchema.safeParse(invalidData);

            expect(result.success).toBe(false);
            if (!result.success) {
                // Zod retourne un message système pour les champs undefined
                expect(result.error.issues[0].message).toBe(
                    'Invalid input: expected string, received undefined'
                );
            }
        });
    });

    describe('Validation - Localisation invalide', () => {
        it('rejette une localisation trop longue (> 200 caractères)', () => {
            const invalidData = {
                name: 'Karma',
                location: 'A'.repeat(201),
                image_url: 'https://example.com/boulder.webp',
            };

            const result = BoulderMetadataSchema.safeParse(invalidData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toContain('200');
            }
        });
    });

    describe('Validation - URL invalide', () => {
        it('rejette une URL non HTTPS', () => {
            const invalidData = {
                name: 'Karma',
                image_url: 'http://example.com/boulder.webp',
            };

            const result = BoulderMetadataSchema.safeParse(invalidData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toContain('HTTPS');
            }
        });

        it('rejette une URL invalide', () => {
            const invalidData = {
                name: 'Karma',
                image_url: 'not-a-valid-url',
            };

            const result = BoulderMetadataSchema.safeParse(invalidData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toContain('invalide');
            }
        });

        it('rejette une URL manquante', () => {
            const invalidData = {
                name: 'Karma',
            };

            const result = BoulderMetadataSchema.safeParse(invalidData);

            expect(result.success).toBe(false);
            if (!result.success) {
                // Zod retourne un message système pour les champs undefined
                expect(result.error.issues[0].message).toBe(
                    'Invalid input: expected string, received undefined'
                );
            }
        });
    });
});
