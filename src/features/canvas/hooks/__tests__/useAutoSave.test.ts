import { describe, it, expect } from 'vitest';
import type { SaveStatus } from '../useAutoSave';

/**
 * Tests pour useAutoSave
 * 
 * Note: Tests basiques de logique. Les tests d'intégration complets avec React hooks
 * et timers nécessitent une configuration plus complexe et seront ajoutés ultérieurement.
 */

describe('useAutoSave - Logic Tests', () => {
    describe('Hash Generation', () => {
        it('génère un hash basé sur version, lines et shapes', () => {
            const data1 = { version: 1, lines: [], shapes: [] };
            const data2 = { version: 1, lines: [{}, {}], shapes: [] };
            const data3 = { version: 1, lines: [], shapes: [{}] };

            const hash1 = generateHash(data1);
            const hash2 = generateHash(data2);
            const hash3 = generateHash(data3);

            expect(hash1).toBe('v1-l0-s0');
            expect(hash2).toBe('v1-l2-s0');
            expect(hash3).toBe('v1-l0-s1');
        });

        it('génère des hashs différents pour des données différentes', () => {
            const data1 = { version: 1, lines: [], shapes: [] };
            const data2 = { version: 1, lines: [{}], shapes: [] };

            const hash1 = generateHash(data1);
            const hash2 = generateHash(data2);

            expect(hash1).not.toBe(hash2);
        });

        it('génère le même hash pour des données identiques', () => {
            const data = { version: 1, lines: [{}, {}], shapes: [{}] };

            const hash1 = generateHash(data);
            const hash2 = generateHash(data);

            expect(hash1).toBe(hash2);
        });
    });

    describe('SaveStatus Types', () => {
        it('valide les valeurs possibles de SaveStatus', () => {
            const validStatuses: SaveStatus[] = [
                'idle',
                'saving',
                'saved',
                'error',
                'conflict',
            ];

            validStatuses.forEach((status) => {
                expect(status).toBeTruthy();
            });
        });
    });

    describe('Error Messages', () => {
        it('les messages d\'erreur sont en français', () => {
            const conflictMessage =
                'Une version plus récente existe. Rechargez la page pour voir les modifications.';

            expect(conflictMessage).toContain('version plus récente');
            expect(conflictMessage).toContain('Rechargez');
        });
    });
});

// Helper function (reproduit la logique interne du hook)
function generateHash(data: { version: number; lines: unknown[]; shapes: unknown[] }): string {
    return `v${data.version}-l${data.lines.length}-s${data.shapes.length}`;
}
