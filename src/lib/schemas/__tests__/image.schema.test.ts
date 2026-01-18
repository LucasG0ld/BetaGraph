import { describe, it, expect } from 'vitest';
import { ImageUploadSchema, ProcessedImageSchema } from '../image.schema';

describe('ImageUploadSchema', () => {
    describe('Validation de fichiers valides', () => {
        it('accepte un fichier JPEG < 15Mo', () => {
            const file = new File([new ArrayBuffer(1024 * 1024)], 'test.jpg', {
                type: 'image/jpeg',
            });

            const result = ImageUploadSchema.safeParse({ file });
            expect(result.success).toBe(true);
        });

        it('accepte un fichier PNG < 15Mo', () => {
            const file = new File([new ArrayBuffer(5 * 1024 * 1024)], 'test.png', {
                type: 'image/png',
            });

            const result = ImageUploadSchema.safeParse({ file });
            expect(result.success).toBe(true);
        });

        it('accepte un fichier WebP < 15Mo', () => {
            const file = new File([new ArrayBuffer(2 * 1024 * 1024)], 'test.webp', {
                type: 'image/webp',
            });

            const result = ImageUploadSchema.safeParse({ file });
            expect(result.success).toBe(true);
        });

        it('accepte un fichier HEIC < 15Mo', () => {
            const file = new File([new ArrayBuffer(3 * 1024 * 1024)], 'test.heic', {
                type: 'image/heic',
            });

            const result = ImageUploadSchema.safeParse({ file });
            expect(result.success).toBe(true);
        });
    });

    describe('Rejection de fichiers invalides', () => {
        it('rejette un fichier > 15Mo', () => {
            const file = new File(
                [new ArrayBuffer(16 * 1024 * 1024)],
                'big.jpg',
                { type: 'image/jpeg' }
            );

            const result = ImageUploadSchema.safeParse({ file });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0]?.message).toContain('15 Mo');
            }
        });

        it('rejette un format PDF', () => {
            const file = new File([new ArrayBuffer(1024)], 'doc.pdf', {
                type: 'application/pdf',
            });

            const result = ImageUploadSchema.safeParse({ file });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0]?.message).toContain('Format');
            }
        });

        it('rejette un format texte', () => {
            const file = new File([new ArrayBuffer(1024)], 'file.txt', {
                type: 'text/plain',
            });

            const result = ImageUploadSchema.safeParse({ file });
            expect(result.success).toBe(false);
        });
    });
});

describe('ProcessedImageSchema', () => {
    describe('Validation formats webp et jpeg', () => {
        it('accepte format webp', () => {
            const validWebP = {
                blob: new Blob(['test'], { type: 'image/webp' }),
                width: 1920,
                height: 1080,
                aspectRatio: 1920 / 1080,
                format: 'webp' as const,
                sizeInBytes: 1_000_000,
            };

            const result = ProcessedImageSchema.safeParse(validWebP);
            expect(result.success).toBe(true);
        });

        it('accepte format jpeg (fallback)', () => {
            const validJPEG = {
                blob: new Blob(['test'], { type: 'image/jpeg' }),
                width: 1920,
                height: 1080,
                aspectRatio: 1920 / 1080,
                format: 'jpeg' as const,
                sizeInBytes: 1_500_000,
            };

            const result = ProcessedImageSchema.safeParse(validJPEG);
            expect(result.success).toBe(true);
        });

        it('rejette format autre que webp/jpeg', () => {
            const invalidFormat = {
                blob: new Blob(['test']),
                width: 1920,
                height: 1080,
                aspectRatio: 1920 / 1080,
                format: 'png' as const,
                sizeInBytes: 1_000_000,
            };

            const result = ProcessedImageSchema.safeParse(invalidFormat);
            expect(result.success).toBe(false);
        });
    });

    describe('Validation dimensions', () => {
        it('rejette width < 600px', () => {
            const tooSmallWidth = {
                blob: new Blob(['test']),
                width: 500,
                height: 800,
                aspectRatio: 500 / 800,
                format: 'webp' as const,
                sizeInBytes: 100_000,
            };

            const result = ProcessedImageSchema.safeParse(tooSmallWidth);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0]?.message).toContain('600px');
            }
        });

        it('rejette height < 600px', () => {
            const tooSmallHeight = {
                blob: new Blob(['test']),
                width: 1000,
                height: 500,
                aspectRatio: 1000 / 500,
                format: 'webp' as const,
                sizeInBytes: 100_000,
            };

            const result = ProcessedImageSchema.safeParse(tooSmallHeight);
            expect(result.success).toBe(false);
        });

        it('rejette width > 4096px', () => {
            const tooBigWidth = {
                blob: new Blob(['test']),
                width: 5000,
                height: 1000,
                aspectRatio: 5000 / 1000,
                format: 'webp' as const,
                sizeInBytes: 1_000_000,
            };

            const result = ProcessedImageSchema.safeParse(tooBigWidth);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0]?.message).toContain('4096px');
            }
        });
    });

    describe('Validation taille fichier', () => {
        it('rejette taille > 2Mo', () => {
            const tooBig = {
                blob: new Blob(['test']),
                width: 1920,
                height: 1080,
                aspectRatio: 1920 / 1080,
                format: 'webp' as const,
                sizeInBytes: 3 * 1024 * 1024, // 3 Mo
            };

            const result = ProcessedImageSchema.safeParse(tooBig);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0]?.message).toContain('2 Mo');
            }
        });

        it('accepte taille exactement 2Mo', () => {
            const exactLimit = {
                blob: new Blob(['test']),
                width: 1920,
                height: 1080,
                aspectRatio: 1920 / 1080,
                format: 'webp' as const,
                sizeInBytes: 2 * 1024 * 1024, // Exactement 2 Mo
            };

            const result = ProcessedImageSchema.safeParse(exactLimit);
            expect(result.success).toBe(true);
        });
    });

    describe('Validation aspect ratio', () => {
        it('rejette aspect ratio < 0.25', () => {
            const tooVertical = {
                blob: new Blob(['test']),
                width: 800,
                height: 4000, // ratio = 0.2 (< 0.25 mais dimensions valides)
                aspectRatio: 0.2,
                format: 'webp' as const,
                sizeInBytes: 500_000,
            };

            const result = ProcessedImageSchema.safeParse(tooVertical);
            expect(result.success).toBe(false);
            if (!result.success) {
                // Cherche l'erreur d'aspect ratio spécifiquement
                const aspectError = result.error.issues.find((issue) =>
                    issue.message.includes('aspect')
                );
                expect(aspectError).toBeDefined();
                expect(aspectError?.message).toContain('0.25');
            }
        });

        it('rejette aspect ratio > 4', () => {
            const tooHorizontal = {
                blob: new Blob(['test']),
                width: 4000,
                height: 800, // ratio = 5
                aspectRatio: 5,
                format: 'webp' as const,
                sizeInBytes: 500_000,
            };

            const result = ProcessedImageSchema.safeParse(tooHorizontal);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0]?.message).toContain('4');
            }
        });

        it('accepte aspect ratio dans limites', () => {
            const validRatio = {
                blob: new Blob(['test']),
                width: 1920,
                height: 1080,
                aspectRatio: 1920 / 1080, // ≈ 1.78
                format: 'webp' as const,
                sizeInBytes: 1_000_000,
            };

            const result = ProcessedImageSchema.safeParse(validRatio);
            expect(result.success).toBe(true);
        });
    });
});
