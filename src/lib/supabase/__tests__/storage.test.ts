import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase client
const mockGetSession = vi.fn();
const mockUpload = vi.fn();
const mockGetPublicUrl = vi.fn();

vi.mock('../client', () => ({
    supabaseBrowser: {
        auth: {
            getSession: () => mockGetSession(),
        },
        storage: {
            from: () => ({
                upload: mockUpload,
                getPublicUrl: mockGetPublicUrl,
            }),
        },
    },
}));

// Mock crypto.randomUUID
vi.stubGlobal('crypto', {
    randomUUID: () => '550e8400-e29b-41d4-a716-446655440000',
});

import { uploadBoulderImage } from '../storage';

describe('uploadBoulderImage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Vérification session utilisateur', () => {
        it('rejette si pas de session', async () => {
            mockGetSession.mockResolvedValueOnce({
                data: { session: null },
                error: null,
            });

            const blob = new Blob(['test'], { type: 'image/webp' });

            await expect(uploadBoulderImage(blob, 'webp')).rejects.toThrow(/connecté/);
        });

        it('rejette si erreur session', async () => {
            mockGetSession.mockResolvedValueOnce({
                data: { session: null },
                error: { message: 'Session expired' },
            });

            const blob = new Blob(['test'], { type: 'image/webp' });

            await expect(uploadBoulderImage(blob, 'webp')).rejects.toThrow(/authentification/);
        });

        it('continue si session valide', async () => {
            mockGetSession.mockResolvedValueOnce({
                data: {
                    session: { user: { id: 'user-123' } },
                },
                error: null,
            });

            mockUpload.mockResolvedValueOnce({
                data: { path: 'user-123/550e8400-e29b-41d4-a716-446655440000.webp' },
                error: null,
            });

            mockGetPublicUrl.mockReturnValueOnce({
                data: { publicUrl: 'https://example.com/storage/boulders/user-123/550e8400-e29b-41d4-a716-446655440000.webp' },
            });

            const blob = new Blob(['test'], { type: 'image/webp' });

            await expect(uploadBoulderImage(blob, 'webp')).resolves.toBeDefined();
        });
    });

    describe('Upload vers Supabase Storage', () => {
        beforeEach(() => {
            // Session valide par défaut
            mockGetSession.mockResolvedValue({
                data: { session: { user: { id: 'user-123' } } },
                error: null,
            });
        });

        it('construit chemin correct userId/uuid.format', async () => {
            mockUpload.mockResolvedValueOnce({
                data: { path: 'user-123/550e8400-e29b-41d4-a716-446655440000.webp' },
                error: null,
            });

            mockGetPublicUrl.mockReturnValueOnce({
                data: { publicUrl: 'https://example.com/test.webp' },
            });

            const blob = new Blob(['test'], { type: 'image/webp' });

            await uploadBoulderImage(blob, 'webp');

            expect(mockUpload).toHaveBeenCalledWith(
                'user-123/550e8400-e29b-41d4-a716-446655440000.webp',
                blob,
                expect.objectContaining({
                    contentType: 'image/webp',
                    cacheControl: '3600',
                    upsert: false,
                })
            );
        });

        it('utilise contentType correct pour webp', async () => {
            mockUpload.mockResolvedValueOnce({
                data: { path: 'user-123/uuid.webp' },
                error: null,
            });

            mockGetPublicUrl.mockReturnValueOnce({
                data: { publicUrl: 'https://example.com/test.webp' },
            });

            const blob = new Blob(['test'], { type: 'image/webp' });

            await uploadBoulderImage(blob, 'webp');

            expect(mockUpload).toHaveBeenCalledWith(
                expect.any(String),
                blob,
                expect.objectContaining({
                    contentType: 'image/webp',
                })
            );
        });

        it('utilise contentType correct pour jpeg', async () => {
            mockUpload.mockResolvedValueOnce({
                data: { path: 'user-123/uuid.jpeg' },
                error: null,
            });

            mockGetPublicUrl.mockReturnValueOnce({
                data: { publicUrl: 'https://example.com/test.jpeg' },
            });

            const blob = new Blob(['test'], { type: 'image/jpeg' });

            await uploadBoulderImage(blob, 'jpeg');

            expect(mockUpload).toHaveBeenCalledWith(
                'user-123/550e8400-e29b-41d4-a716-446655440000.jpeg',
                blob,
                expect.objectContaining({
                    contentType: 'image/jpeg',
                })
            );
        });

        it('retourne URL publique', async () => {
            const expectedUrl = 'https://abc123.supabase.co/storage/v1/object/public/boulders/user-123/550e8400-e29b-41d4-a716-446655440000.webp';

            mockUpload.mockResolvedValueOnce({
                data: { path: 'user-123/550e8400-e29b-41d4-a716-446655440000.webp' },
                error: null,
            });

            mockGetPublicUrl.mockReturnValueOnce({
                data: { publicUrl: expectedUrl },
            });

            const blob = new Blob(['test'], { type: 'image/webp' });

            const url = await uploadBoulderImage(blob, 'webp');

            expect(url).toBe(expectedUrl);
        });
    });

    describe('Gestion erreurs Supabase Storage', () => {
        beforeEach(() => {
            mockGetSession.mockResolvedValue({
                data: { session: { user: { id: 'user-123' } } },
                error: null,
            });
        });

        it('gère erreur "The resource already exists"', async () => {
            mockUpload.mockResolvedValueOnce({
                data: null,
                error: { message: 'The resource already exists' },
            });

            const blob = new Blob(['test'], { type: 'image/webp' });

            await expect(uploadBoulderImage(blob, 'webp')).rejects.toThrow(/existe/);
        });

        it('gère erreur "Payload too large"', async () => {
            mockUpload.mockResolvedValueOnce({
                data: null,
                error: { message: 'Payload too large' },
            });

            const blob = new Blob(['test'], { type: 'image/webp' });

            await expect(uploadBoulderImage(blob, 'webp')).rejects.toThrow(/volumineuse/);
        });

        it('gère erreur "Invalid mime type"', async () => {
            mockUpload.mockResolvedValueOnce({
                data: null,
                error: { message: 'Invalid mime type' },
            });

            const blob = new Blob(['test'], { type: 'image/webp' });

            await expect(uploadBoulderImage(blob, 'webp')).rejects.toThrow(/Format.*invalide/);
        });

        it('gère erreur "Row level security policy violated"', async () => {
            mockUpload.mockResolvedValueOnce({
                data: null,
                error: { message: 'Row level security policy violated' },
            });

            const blob = new Blob(['test'], { type: 'image/webp' });

            await expect(uploadBoulderImage(blob, 'webp')).rejects.toThrow(/Permission refusée/);
        });

        it('gère erreur générique', async () => {
            mockUpload.mockResolvedValueOnce({
                data: null,
                error: { message: 'Network error' },
            });

            const blob = new Blob(['test'], { type: 'image/webp' });

            await expect(uploadBoulderImage(blob, 'webp')).rejects.toThrow(/Network error/);
        });
    });
});
