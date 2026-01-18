/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock les dépendances
vi.mock('../normalize-orientation', () => ({
    normalizeImageOrientation: vi.fn(),
}));

vi.mock('../compress-image', () => ({
    compressImage: vi.fn(),
}));

vi.mock('@/lib/schemas/image.schema', () => ({
    ImageUploadSchema: {
        safeParse: vi.fn(),
    },
    ProcessedImageSchema: {
        safeParse: vi.fn(),
    },
}));

import { processImageForUpload } from '../process-image';
import { normalizeImageOrientation } from '../normalize-orientation';
import { compressImage } from '../compress-image';
import { ImageUploadSchema, ProcessedImageSchema } from '@/lib/schemas/image.schema';

describe('processImageForUpload', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Validation initiale (Phase 3.1)', () => {
        it('rejette fichier invalide avec message Zod', async () => {
            const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });

            vi.mocked(ImageUploadSchema.safeParse).mockReturnValueOnce({
                success: false,
                error: {
                    issues: [{ message: 'Format non supporté. Formats acceptés : JPEG, PNG, WebP, HEIC.' }],
                },
            } as any);

            await expect(processImageForUpload(file)).rejects.toThrow(/Format non supporté/);
        });

        it('continue si validation réussit', async () => {
            const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

            vi.mocked(ImageUploadSchema.safeParse).mockReturnValueOnce({
                success: true,
                data: { file },
            } as any);

            vi.mocked(normalizeImageOrientation).mockResolvedValueOnce({
                blob: new Blob(['normalized']),
                width: 1920,
                height: 1080,
                originalOrientation: 1,
                wasRotated: false,
            });

            vi.mocked(compressImage).mockResolvedValueOnce(
                new Blob(['compressed'], { type: 'image/webp' })
            );

            vi.mocked(ProcessedImageSchema.safeParse).mockReturnValueOnce({
                success: true,
                data: {
                    blob: new Blob(),
                    width: 1920,
                    height: 1080,
                    aspectRatio: 1920 / 1080,
                    format: 'webp',
                    sizeInBytes: 1_000_000,
                    orientation: 1,
                },
            } as any);

            await processImageForUpload(file);

            expect(normalizeImageOrientation).toHaveBeenCalledWith(file);
        });
    });

    describe('Pipeline complet (3.1 → 3.2 → 3.3 → validation finale)', () => {
        it('orchestre les 3 phases dans le bon ordre', async () => {
            const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' });

            const mockNormalizedBlob = new Blob(['normalized'], { type: 'image/jpeg' });
            const mockCompressedBlob = new Blob(['compressed'], { type: 'image/webp' });

            vi.mocked(ImageUploadSchema.safeParse).mockReturnValueOnce({
                success: true,
                data: { file },
            } as any);

            vi.mocked(normalizeImageOrientation).mockResolvedValueOnce({
                blob: mockNormalizedBlob,
                width: 1920,
                height: 1080,
                originalOrientation: 6,
                wasRotated: true,
            });

            vi.mocked(compressImage).mockResolvedValueOnce(mockCompressedBlob);

            vi.mocked(ProcessedImageSchema.safeParse).mockReturnValueOnce({
                success: true,
                data: {
                    blob: mockCompressedBlob,
                    width: 1920,
                    height: 1080,
                    aspectRatio: 1920 / 1080,
                    format: 'webp',
                    sizeInBytes: 1_000_000,
                    orientation: 6,
                },
            } as any);

            const result = await processImageForUpload(file);

            // Vérifier ordre des appels
            expect(normalizeImageOrientation).toHaveBeenCalledWith(file);
            expect(compressImage).toHaveBeenCalledWith(mockNormalizedBlob);

            // Vérifier résultat
            expect(result.width).toBe(1920);
            expect(result.height).toBe(1080);
            expect(result.format).toBe('webp');
        });

        it('calcule aspect ratio correctement', async () => {
            const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

            vi.mocked(ImageUploadSchema.safeParse).mockReturnValueOnce({
                success: true,
                data: { file },
            } as any);

            vi.mocked(normalizeImageOrientation).mockResolvedValueOnce({
                blob: new Blob(),
                width: 1920,
                height: 1080,
                originalOrientation: 1,
                wasRotated: false,
            });

            vi.mocked(compressImage).mockResolvedValueOnce(new Blob([], { type: 'image/webp' }));

            const expectedAspectRatio = 1920 / 1080;

            vi.mocked(ProcessedImageSchema.safeParse).mockReturnValueOnce({
                success: true,
                data: {
                    blob: new Blob(),
                    width: 1920,
                    height: 1080,
                    aspectRatio: expectedAspectRatio,
                    format: 'webp',
                    sizeInBytes: 1_000_000,
                    orientation: 1,
                },
            } as any);

            const result = await processImageForUpload(file);

            expect(result.aspectRatio).toBeCloseTo(expectedAspectRatio, 5);
        });

        it('détecte format via blob.type', async () => {
            const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

            vi.mocked(ImageUploadSchema.safeParse).mockReturnValueOnce({
                success: true,
                data: { file },
            } as any);

            vi.mocked(normalizeImageOrientation).mockResolvedValueOnce({
                blob: new Blob(),
                width: 1920,
                height: 1080,
                originalOrientation: 1,
                wasRotated: false,
            });

            // Fallback JPEG (rare)
            const jpegBlob = new Blob([], { type: 'image/jpeg' });
            vi.mocked(compressImage).mockResolvedValueOnce(jpegBlob);

            vi.mocked(ProcessedImageSchema.safeParse).mockReturnValueOnce({
                success: true,
                data: {
                    blob: jpegBlob,
                    width: 1920,
                    height: 1080,
                    aspectRatio: 1920 / 1080,
                    format: 'jpeg', // Détecté via blob.type
                    sizeInBytes: 1_000_000,
                    orientation: 1,
                },
            } as any);

            const result = await processImageForUpload(file);

            expect(result.format).toBe('jpeg');
        });
    });

    describe('Validation finale (Phase 3.1)', () => {
        it('rejette si validation finale échoue', async () => {
            const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

            vi.mocked(ImageUploadSchema.safeParse).mockReturnValueOnce({
                success: true,
                data: { file },
            } as any);

            vi.mocked(normalizeImageOrientation).mockResolvedValueOnce({
                blob: new Blob(),
                width: 500, // Trop petit
                height: 400,
                originalOrientation: 1,
                wasRotated: false,
            });

            vi.mocked(compressImage).mockResolvedValueOnce(new Blob());

            vi.mocked(ProcessedImageSchema.safeParse).mockReturnValueOnce({
                success: false,
                error: {
                    issues: [{ message: 'La largeur de l\'image doit être d\'au moins 600px.' }],
                },
            } as any);

            await expect(processImageForUpload(file)).rejects.toThrow(/600px/);
        });
    });

    describe('Gestion d\'erreur', () => {
        it('propage erreur de normalizeImageOrientation', async () => {
            const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

            vi.mocked(ImageUploadSchema.safeParse).mockReturnValueOnce({
                success: true,
                data: { file },
            } as any);

            const errorMessage = 'Timeout: Le traitement de l\'image a pris plus de 10 secondes.';
            vi.mocked(normalizeImageOrientation).mockRejectedValueOnce(new Error(errorMessage));

            await expect(processImageForUpload(file)).rejects.toThrow(errorMessage);
        });

        it('propage erreur de compressImage', async () => {
            const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

            vi.mocked(ImageUploadSchema.safeParse).mockReturnValueOnce({
                success: true,
                data: { file },
            } as any);

            vi.mocked(normalizeImageOrientation).mockResolvedValueOnce({
                blob: new Blob(),
                width: 1920,
                height: 1080,
                originalOrientation: 1,
                wasRotated: false,
            });

            const errorMessage = 'Échec de la compression de l\'image';
            vi.mocked(compressImage).mockRejectedValueOnce(new Error(errorMessage));

            await expect(processImageForUpload(file)).rejects.toThrow(errorMessage);
        });
    });
});
