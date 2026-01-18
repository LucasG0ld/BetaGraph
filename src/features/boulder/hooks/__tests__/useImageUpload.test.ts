import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useImageUpload } from '../useImageUpload';

// Mock les modules externes
vi.mock('@/lib/utils/image/process-image', () => ({
    processImageForUpload: vi.fn(),
}));

vi.mock('@/lib/supabase/storage', () => ({
    uploadBoulderImage: vi.fn(),
}));

import { processImageForUpload } from '@/lib/utils/image/process-image';
import { uploadBoulderImage } from '@/lib/supabase/storage';

describe('useImageUpload', () => {
    describe('États initiaux', () => {
        it('initialise tous les états à leur valeur par défaut', () => {
            const { result } = renderHook(() => useImageUpload());

            expect(result.current.isProcessing).toBe(false);
            expect(result.current.isUploading).toBe(false);
            expect(result.current.error).toBeNull();
            expect(result.current.imageUrl).toBeNull();
            expect(result.current.imageData).toBeNull();
            expect(typeof result.current.upload).toBe('function');
            expect(typeof result.current.reset).toBe('function');
        });
    });

    describe('Fonction reset', () => {
        it('réinitialise tous les états', async () => {
            const { result } = renderHook(() => useImageUpload());

            // Mock données de succès
            vi.mocked(processImageForUpload).mockResolvedValueOnce({
                blob: new Blob(['test']),
                width: 1920,
                height: 1080,
                aspectRatio: 1920 / 1080,
                format: 'webp' as const,
                sizeInBytes: 1_000_000,
                orientation: 1,
            });

            vi.mocked(uploadBoulderImage).mockResolvedValueOnce(
                'https://example.com/image.webp'
            );

            const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

            // Upload réussi
            await act(async () => {
                await result.current.upload(file);
            });

            // Vérifier que les états sont set
            expect(result.current.imageUrl).not.toBeNull();
            expect(result.current.imageData).not.toBeNull();

            // Reset
            act(() => {
                result.current.reset();
            });

            // Vérifier que tout est null
            expect(result.current.isProcessing).toBe(false);
            expect(result.current.isUploading).toBe(false);
            expect(result.current.error).toBeNull();
            expect(result.current.imageUrl).toBeNull();
            expect(result.current.imageData).toBeNull();
        });
    });

    describe('Fonction upload - Succès', () => {
        it('déclenche isProcessing puis isUploading', async () => {
            const { result } = renderHook(() => useImageUpload());

            const mockProcessedImage = {
                blob: new Blob(['test'], { type: 'image/webp' }),
                width: 1920,
                height: 1080,
                aspectRatio: 1920 / 1080,
                format: 'webp' as const,
                sizeInBytes: 1_500_000,
                orientation: 1,
            };

            const mockUrl = 'https://supabase.co/storage/v1/object/public/boulders/test.webp';

            vi.mocked(processImageForUpload).mockResolvedValueOnce(mockProcessedImage);
            vi.mocked(uploadBoulderImage).mockResolvedValueOnce(mockUrl);

            const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

            await act(async () => {
                await result.current.upload(file);
            });

            // Vérifier états finaux
            expect(result.current.isProcessing).toBe(false);
            expect(result.current.isUploading).toBe(false);
            expect(result.current.error).toBeNull();
            expect(result.current.imageUrl).toBe(mockUrl);
            expect(result.current.imageData).toEqual(mockProcessedImage);
        });

        it('appelle processImageForUpload avec le bon fichier', async () => {
            const { result } = renderHook(() => useImageUpload());

            vi.mocked(processImageForUpload).mockResolvedValueOnce({
                blob: new Blob(['test']),
                width: 1920,
                height: 1080,
                aspectRatio: 1920 / 1080,
                format: 'webp' as const,
                sizeInBytes: 1_000_000,
                orientation: 1,
            });

            vi.mocked(uploadBoulderImage).mockResolvedValueOnce('https://example.com/test.webp');

            const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' });

            await act(async () => {
                await result.current.upload(file);
            });

            expect(processImageForUpload).toHaveBeenCalledWith(file);
            expect(processImageForUpload).toHaveBeenCalledTimes(1);
        });

        it('appelle uploadBoulderImage avec blob et format corrects', async () => {
            const { result } = renderHook(() => useImageUpload());

            const mockBlob = new Blob(['test'], { type: 'image/webp' });
            const mockProcessedImage = {
                blob: mockBlob,
                width: 1920,
                height: 1080,
                aspectRatio: 1920 / 1080,
                format: 'webp' as const,
                sizeInBytes: 1_000_000,
                orientation: 1,
            };

            vi.mocked(processImageForUpload).mockResolvedValueOnce(mockProcessedImage);
            vi.mocked(uploadBoulderImage).mockResolvedValueOnce('https://example.com/test.webp');

            const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

            await act(async () => {
                await result.current.upload(file);
            });

            expect(uploadBoulderImage).toHaveBeenCalledWith(mockBlob, 'webp');
        });
    });

    describe('Fonction upload - Gestion d\'erreur', () => {
        it('capture erreur de processImageForUpload', async () => {
            const { result } = renderHook(() => useImageUpload());

            const errorMessage = 'Fichier invalide : La taille du fichier ne peut pas dépasser 15 Mo.';
            vi.mocked(processImageForUpload).mockRejectedValueOnce(new Error(errorMessage));

            const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

            await act(async () => {
                await result.current.upload(file);
            });

            expect(result.current.error).toContain(errorMessage);
            expect(result.current.imageUrl).toBeNull();
            expect(result.current.imageData).toBeNull();
        });

        it('capture erreur de uploadBoulderImage', async () => {
            const { result } = renderHook(() => useImageUpload());

            vi.mocked(processImageForUpload).mockResolvedValueOnce({
                blob: new Blob(['test']),
                width: 1920,
                height: 1080,
                aspectRatio: 1920 / 1080,
                format: 'webp' as const,
                sizeInBytes: 1_000_000,
                orientation: 1,
            });

            const errorMessage = 'Vous devez être connecté pour uploader une image.';
            vi.mocked(uploadBoulderImage).mockRejectedValueOnce(new Error(errorMessage));

            const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

            await act(async () => {
                await result.current.upload(file);
            });

            expect(result.current.error).toContain(errorMessage);
            expect(result.current.imageUrl).toBeNull();
        });

        it('nettoie toujours les états loading après erreur', async () => {
            const { result } = renderHook(() => useImageUpload());

            vi.mocked(processImageForUpload).mockRejectedValueOnce(new Error('Test error'));

            const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

            await act(async () => {
                await result.current.upload(file);
            });

            // États loading doivent être false même après erreur
            expect(result.current.isProcessing).toBe(false);
            expect(result.current.isUploading).toBe(false);
        });
    });

    describe('Reset automatique au début de upload', () => {
        it('efface erreur précédente sur nouvelle tentative', async () => {
            const { result } = renderHook(() => useImageUpload());

            // Première tentative : erreur
            vi.mocked(processImageForUpload).mockRejectedValueOnce(new Error('Erreur 1'));

            const file1 = new File(['test'], 'test1.jpg', { type: 'image/jpeg' });

            await act(async () => {
                await result.current.upload(file1);
            });

            expect(result.current.error).toContain('Erreur 1');

            // Deuxième tentative : succès
            vi.mocked(processImageForUpload).mockResolvedValueOnce({
                blob: new Blob(['test']),
                width: 1920,
                height: 1080,
                aspectRatio: 1920 / 1080,
                format: 'webp' as const,
                sizeInBytes: 1_000_000,
                orientation: 1,
            });

            vi.mocked(uploadBoulderImage).mockResolvedValueOnce('https://example.com/test.webp');

            const file2 = new File(['test'], 'test2.jpg', { type: 'image/jpeg' });

            await act(async () => {
                await result.current.upload(file2);
            });

            // Erreur doit être null après succès
            expect(result.current.error).toBeNull();
            expect(result.current.imageUrl).not.toBeNull();
        });

        it('efface URL précédente sur nouvelle tentative', async () => {
            const { result } = renderHook(() => useImageUpload());

            // Premier upload réussi
            vi.mocked(processImageForUpload).mockResolvedValueOnce({
                blob: new Blob(['test']),
                width: 1920,
                height: 1080,
                aspectRatio: 1920 / 1080,
                format: 'webp' as const,
                sizeInBytes: 1_000_000,
                orientation: 1,
            });

            vi.mocked(uploadBoulderImage).mockResolvedValueOnce('https://example.com/first.webp');

            const file1 = new File(['test'], 'test1.jpg', { type: 'image/jpeg' });

            await act(async () => {
                await result.current.upload(file1);
            });

            const firstUrl = result.current.imageUrl;
            expect(firstUrl).toBe('https://example.com/first.webp');

            // Deuxième upload
            vi.mocked(processImageForUpload).mockResolvedValueOnce({
                blob: new Blob(['test2']),
                width: 1080,
                height: 1920,
                aspectRatio: 1080 / 1920,
                format: 'jpeg' as const,
                sizeInBytes: 800_000,
                orientation: 6,
            });

            vi.mocked(uploadBoulderImage).mockResolvedValueOnce('https://example.com/second.jpeg');

            const file2 = new File(['test'], 'test2.jpg', { type: 'image/jpeg' });

            await act(async () => {
                await result.current.upload(file2);
            });

            // URL doit être la nouvelle
            expect(result.current.imageUrl).toBe('https://example.com/second.jpeg');
            expect(result.current.imageUrl).not.toBe(firstUrl);
        });
    });
});
