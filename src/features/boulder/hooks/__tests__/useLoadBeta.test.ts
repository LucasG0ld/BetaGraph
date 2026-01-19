import { describe, it, expect } from 'vitest';

/**
 * Tests pour useLoadBeta
 * 
 * Note: Tests de la logique de décision de stratégie de chargement.
 * Les tests d'intégration complets avec Supabase et React hooks seront ajoutés ultérieurement.
 */

describe('useLoadBeta - Strategy Decision Logic', () => {
    describe('decideLoadStrategy', () => {
        it('charge serveur si aucune donnée locale', () => {
            const result = decideLoadStrategy({
                hasLocalData: false,
                localLastModified: null,
                localLastSynced: null,
                serverUpdatedAt: '2026-01-19T12:00:00Z',
            });

            expect(result).toBe('LOAD_SERVER');
        });

        it('charge serveur si lastModifiedLocally null', () => {
            const result = decideLoadStrategy({
                hasLocalData: true,
                localLastModified: null,
                localLastSynced: null,
                serverUpdatedAt: '2026-01-19T12:00:00Z',
            });

            expect(result).toBe('LOAD_SERVER');
        });

        it('garde local si déjà synchronisé avec cette version', () => {
            const timestamp = '2026-01-19T12:00:00Z';
            const result = decideLoadStrategy({
                hasLocalData: true,
                localLastModified: timestamp,
                localLastSynced: timestamp,
                serverUpdatedAt: timestamp,
            });

            expect(result).toBe('KEEP_LOCAL');
        });

        it('demande à user si serveur plus récent et jamais synchronisé', () => {
            const result = decideLoadStrategy({
                hasLocalData: true,
                localLastModified: '2026-01-19T10:00:00Z',
                localLastSynced: null,
                serverUpdatedAt: '2026-01-19T12:00:00Z',
            });

            expect(result).toBe('PROMPT_USER');
        });

        it('charge serveur si serveur plus récent et déjà synchronisé avant', () => {
            const result = decideLoadStrategy({
                hasLocalData: true,
                localLastModified: '2026-01-19T10:00:00Z',
                localLastSynced: '2026-01-19T09:00:00Z',
                serverUpdatedAt: '2026-01-19T12:00:00Z',
            });

            expect(result).toBe('LOAD_SERVER');
        });

        it('garde local avec flag unsaved si local plus récent', () => {
            const result = decideLoadStrategy({
                hasLocalData: true,
                localLastModified: '2026-01-19T14:00:00Z',
                localLastSynced: '2026-01-19T12:00:00Z',
                serverUpdatedAt: '2026-01-19T12:00:00Z',
            });

            expect(result).toBe('KEEP_LOCAL_UNSAVED');
        });
    });

    describe('Timestamp Comparison Edge Cases', () => {
        it('gère timestamps identiques', () => {
            const timestamp = '2026-01-19T12:00:00.000Z';
            const result = decideLoadStrategy({
                hasLocalData: true,
                localLastModified: timestamp,
                localLastSynced: timestamp,
                serverUpdatedAt: timestamp,
            });

            expect(result).toBe('KEEP_LOCAL');
        });

        it('gère différence de 1 milliseconde', () => {
            const result = decideLoadStrategy({
                hasLocalData: true,
                localLastModified: '2026-01-19T12:00:00.123Z',
                localLastSynced: '2026-01-19T12:00:00.122Z',
                serverUpdatedAt: '2026-01-19T12:00:00.124Z',
            });

            // Serveur plus récent (124ms > 123ms)
            expect(result).toBe('LOAD_SERVER');
        });

        it('gère timezones différentes correctement', () => {
            const result = decideLoadStrategy({
                hasLocalData: true,
                localLastModified: '2026-01-19T12:00:00Z', // UTC
                localLastSynced: '2026-01-19T13:00:00+01:00', // Paris (même instant)
                serverUpdatedAt: '2026-01-19T13:00:00+01:00', // Paris
            });

            // Timestamps identiques après conversion UTC
            expect(result).toBe('KEEP_LOCAL');
        });
    });

    describe('Scénarios Réels', () => {
        it('premier chargement (jamais utilisé)', () => {
            const result = decideLoadStrategy({
                hasLocalData: false,
                localLastModified: null,
                localLastSynced: null,
                serverUpdatedAt: '2026-01-19T12:00:00Z',
            });

            expect(result).toBe('LOAD_SERVER');
        });

        it('utilisateur a dessiné hors ligne puis se reconnecte', () => {
            const result = decideLoadStrategy({
                hasLocalData: true,
                localLastModified: '2026-01-19T14:00:00Z', // Dessiné aujourd'hui
                localLastSynced: '2026-01-19T10:00:00Z', // Sync ce matin
                serverUpdatedAt: '2026-01-19T10:00:00Z', // Pas de changement serveur
            });

            // Local plus récent (14h > 10h) → Garder local + flag unsaved
            expect(result).toBe('KEEP_LOCAL_UNSAVED');
        });

        it('quelqu\'un d\'autre a modifié pendant que user était hors ligne', () => {
            const result = decideLoadStrategy({
                hasLocalData: true,
                localLastModified: '2026-01-19T10:00:00Z',
                localLastSynced: '2026-01-19T09:00:00Z',
                serverUpdatedAt: '2026-01-19T14:00:00Z', // Modifié par quelqu'un
            });

            // Serveur plus récent ET déjà sync avant → Charger serveur
            expect(result).toBe('LOAD_SERVER');
        });

        it('user charge beta mais a des modifications locales anciennes', () => {
            const result = decideLoadStrategy({
                hasLocalData: true,
                localLastModified: '2026-01-18T10:00:00Z', // Hier
                localLastSynced: null, // Jamais synchronisé
                serverUpdatedAt: '2026-01-19T14:00:00Z', // Aujourd'hui
            });

            // Serveur plus récent ET jamais sync → Demander à user
            expect(result).toBe('PROMPT_USER');
        });
    });
});

// Helper function reproduisant la logique de useLoadBeta
type LoadStrategy = 'LOAD_SERVER' | 'KEEP_LOCAL' | 'KEEP_LOCAL_UNSAVED' | 'PROMPT_USER';

function decideLoadStrategy(params: {
    hasLocalData: boolean;
    localLastModified: string | null;
    localLastSynced: string | null;
    serverUpdatedAt: string;
}): LoadStrategy {
    const { hasLocalData, localLastModified, localLastSynced, serverUpdatedAt } = params;

    if (!hasLocalData || !localLastModified) {
        return 'LOAD_SERVER';
    }

    if (localLastSynced === serverUpdatedAt) {
        // Déjà sync avec serveur, mais vérifier si modif locale après sync
        const localTime = new Date(localLastModified);
        const syncTime = new Date(localLastSynced);

        if (localTime > syncTime) {
            // Modifié après le dernier sync
            return 'KEEP_LOCAL_UNSAVED';
        }
        return 'KEEP_LOCAL';
    }

    const localTime = new Date(localLastModified);
    const serverTime = new Date(serverUpdatedAt);

    if (serverTime > localTime && !localLastSynced) {
        return 'PROMPT_USER';
    }

    if (serverTime > localTime && localLastSynced) {
        return 'LOAD_SERVER';
    }

    return 'KEEP_LOCAL_UNSAVED';
}
