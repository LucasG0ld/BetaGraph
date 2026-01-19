import { describe, it, expect, beforeEach } from 'vitest';
import { useCanvasStore } from '../canvasStore';
import { createEmptyDrawingData, DRAWING_DATA_SCHEMA_VERSION } from '@/lib/schemas/drawing.schema';
import type { DrawingData, Point, Circle } from '@/lib/schemas/drawing.schema';

// ============================================================================
// SETUP
// ============================================================================

/**
 * Reset le store avant chaque test pour isoler les tests.
 */
beforeEach(() => {
    // Reset le store principal
    useCanvasStore.setState({
        currentTool: 'brush',
        currentColor: '#FF3B30',
        currentWidth: 2,
        currentLine: [],
        isDrawing: false,
        drawingData: createEmptyDrawingData(),
    });

    // Reset l'historique temporal (zundo)
    const temporalStore = useCanvasStore.temporal.getState();
    temporalStore.clear();
});

// ============================================================================
// TESTS - ACTIONS UI
// ============================================================================

describe('Canvas Store - Actions UI', () => {
    describe('setTool', () => {
        it('change l\'outil courant vers brush', () => {
            const { setTool } = useCanvasStore.getState();
            setTool('brush');
            expect(useCanvasStore.getState().currentTool).toBe('brush');
        });

        it('change l\'outil courant vers circle', () => {
            const { setTool } = useCanvasStore.getState();
            setTool('circle');
            expect(useCanvasStore.getState().currentTool).toBe('circle');
        });

        it('change l\'outil courant vers eraser', () => {
            const { setTool } = useCanvasStore.getState();
            setTool('eraser');
            expect(useCanvasStore.getState().currentTool).toBe('eraser');
        });
    });

    describe('setColor', () => {
        it('change la couleur courante', () => {
            const { setColor } = useCanvasStore.getState();
            setColor('#00FF00');
            expect(useCanvasStore.getState().currentColor).toBe('#00FF00');
        });
    });

    describe('setWidth', () => {
        it('change l\'épaisseur courante', () => {
            const { setWidth } = useCanvasStore.getState();
            setWidth(5);
            expect(useCanvasStore.getState().currentWidth).toBe(5);
        });
    });
});

// ============================================================================
// TESTS - ACTIONS DESSIN (Lignes)
// ============================================================================

describe('Canvas Store - Actions Dessin (Lignes)', () => {
    describe('startLine', () => {
        it('initialise currentLine avec un point', () => {
            const { startLine } = useCanvasStore.getState();
            const point: Point = { x: 10, y: 20 };

            startLine(point);

            const state = useCanvasStore.getState();
            expect(state.currentLine).toEqual([point]);
            expect(state.isDrawing).toBe(true);
        });
    });

    describe('updateCurrentLine', () => {
        it('ajoute un point au tracé en cours', () => {
            const { startLine, updateCurrentLine } = useCanvasStore.getState();
            const point1: Point = { x: 10, y: 20 };
            const point2: Point = { x: 15, y: 25 };

            startLine(point1);
            updateCurrentLine(point2);

            expect(useCanvasStore.getState().currentLine).toEqual([point1, point2]);
        });
    });

    describe('finalizeLine', () => {
        it('ajoute une ligne valide à drawingData.lines', () => {
            const { startLine, updateCurrentLine, finalizeLine } = useCanvasStore.getState();

            startLine({ x: 10, y: 20 });
            updateCurrentLine({ x: 15, y: 25 });
            updateCurrentLine({ x: 20, y: 30 });
            finalizeLine();

            const state = useCanvasStore.getState();
            expect(state.drawingData.lines).toHaveLength(1);
            expect(state.drawingData.lines[0].tool).toBe('brush');
            expect(state.drawingData.lines[0].color).toBe('#FF3B30');
            expect(state.drawingData.lines[0].width).toBe(2);
            expect(state.drawingData.lines[0].id).toBeDefined();
        });

        it('reset currentLine et isDrawing après finalisation', () => {
            const { startLine, updateCurrentLine, finalizeLine } = useCanvasStore.getState();

            startLine({ x: 10, y: 20 });
            updateCurrentLine({ x: 15, y: 25 });
            finalizeLine();

            const state = useCanvasStore.getState();
            expect(state.currentLine).toEqual([]);
            expect(state.isDrawing).toBe(false);
        });

        it('ignore un tracé avec moins de 2 points', () => {
            const { startLine, finalizeLine } = useCanvasStore.getState();

            startLine({ x: 10, y: 20 });
            finalizeLine();

            const state = useCanvasStore.getState();
            expect(state.drawingData.lines).toHaveLength(0);
            expect(state.currentLine).toEqual([]);
            expect(state.isDrawing).toBe(false);
        });

        it('utilise l\'outil eraser quand sélectionné', () => {
            const { setTool, startLine, updateCurrentLine, finalizeLine } =
                useCanvasStore.getState();

            setTool('eraser');
            startLine({ x: 10, y: 20 });
            updateCurrentLine({ x: 15, y: 25 });
            finalizeLine();

            expect(useCanvasStore.getState().drawingData.lines[0].tool).toBe('eraser');
        });
    });

    describe('cancelLine', () => {
        it('annule le tracé en cours sans le sauvegarder', () => {
            const { startLine, updateCurrentLine, cancelLine } = useCanvasStore.getState();

            startLine({ x: 10, y: 20 });
            updateCurrentLine({ x: 15, y: 25 });
            cancelLine();

            const state = useCanvasStore.getState();
            expect(state.currentLine).toEqual([]);
            expect(state.isDrawing).toBe(false);
            expect(state.drawingData.lines).toHaveLength(0);
        });
    });
});

// ============================================================================
// TESTS - ACTIONS DESSIN (Formes)
// ============================================================================

describe('Canvas Store - Actions Dessin (Formes)', () => {
    describe('addShape', () => {
        it('ajoute un cercle à drawingData.shapes', () => {
            const { addShape } = useCanvasStore.getState();

            const circle: Omit<Circle, 'id'> = {
                type: 'circle',
                center: { x: 50, y: 50 },
                radius: 5,
                color: '#00FF00',
            };

            addShape(circle);

            const state = useCanvasStore.getState();
            expect(state.drawingData.shapes).toHaveLength(1);
            expect(state.drawingData.shapes[0].type).toBe('circle');
            expect(state.drawingData.shapes[0].id).toBeDefined();
            expect((state.drawingData.shapes[0] as Circle).center).toEqual({ x: 50, y: 50 });
        });

        it('génère un ID unique pour chaque forme', () => {
            const { addShape } = useCanvasStore.getState();

            const circle: Omit<Circle, 'id'> = {
                type: 'circle',
                center: { x: 50, y: 50 },
                radius: 5,
                color: '#00FF00',
            };

            addShape(circle);
            addShape({ ...circle, center: { x: 60, y: 60 } });

            const state = useCanvasStore.getState();
            expect(state.drawingData.shapes[0].id).not.toBe(state.drawingData.shapes[1].id);
        });
    });
});

// ============================================================================
// TESTS - ACTIONS GLOBALES
// ============================================================================

describe('Canvas Store - Actions Globales', () => {
    describe('removeElement', () => {
        it('supprime une ligne par son ID', () => {
            const { startLine, updateCurrentLine, finalizeLine, removeElement } =
                useCanvasStore.getState();

            startLine({ x: 10, y: 20 });
            updateCurrentLine({ x: 15, y: 25 });
            finalizeLine();

            const lineId = useCanvasStore.getState().drawingData.lines[0].id;
            removeElement(lineId);

            expect(useCanvasStore.getState().drawingData.lines).toHaveLength(0);
        });

        it('supprime une forme par son ID', () => {
            const { addShape, removeElement } = useCanvasStore.getState();

            addShape({
                type: 'circle',
                center: { x: 50, y: 50 },
                radius: 5,
                color: '#00FF00',
            });

            const shapeId = useCanvasStore.getState().drawingData.shapes[0].id;
            removeElement(shapeId);

            expect(useCanvasStore.getState().drawingData.shapes).toHaveLength(0);
        });

        it('ne supprime rien si l\'ID n\'existe pas', () => {
            const { startLine, updateCurrentLine, finalizeLine, removeElement } =
                useCanvasStore.getState();

            startLine({ x: 10, y: 20 });
            updateCurrentLine({ x: 15, y: 25 });
            finalizeLine();

            removeElement('non-existent-id');

            expect(useCanvasStore.getState().drawingData.lines).toHaveLength(1);
        });
    });

    describe('clearCanvas', () => {
        it('vide toutes les lignes et formes', () => {
            const { startLine, updateCurrentLine, finalizeLine, addShape, clearCanvas } =
                useCanvasStore.getState();

            // Ajouter une ligne
            startLine({ x: 10, y: 20 });
            updateCurrentLine({ x: 15, y: 25 });
            finalizeLine();

            // Ajouter une forme
            addShape({
                type: 'circle',
                center: { x: 50, y: 50 },
                radius: 5,
                color: '#00FF00',
            });

            clearCanvas();

            const state = useCanvasStore.getState();
            expect(state.drawingData.lines).toHaveLength(0);
            expect(state.drawingData.shapes).toHaveLength(0);
            expect(state.drawingData.version).toBe(DRAWING_DATA_SCHEMA_VERSION);
        });

        it('reset aussi currentLine et isDrawing', () => {
            const { startLine, updateCurrentLine, clearCanvas } = useCanvasStore.getState();

            startLine({ x: 10, y: 20 });
            updateCurrentLine({ x: 15, y: 25 });
            clearCanvas();

            const state = useCanvasStore.getState();
            expect(state.currentLine).toEqual([]);
            expect(state.isDrawing).toBe(false);
        });
    });

    describe('resetStore', () => {
        it('remet le store à son état initial', () => {
            const { setTool, setColor, setWidth, startLine, updateCurrentLine, finalizeLine, resetStore } =
                useCanvasStore.getState();

            setTool('eraser');
            setColor('#00FF00');
            setWidth(10);
            startLine({ x: 10, y: 20 });
            updateCurrentLine({ x: 15, y: 25 });
            finalizeLine();

            resetStore();

            const state = useCanvasStore.getState();
            expect(state.currentTool).toBe('brush');
            expect(state.currentColor).toBe('#FF3B30');
            expect(state.currentWidth).toBe(2);
            expect(state.drawingData.lines).toHaveLength(0);
            expect(state.drawingData.shapes).toHaveLength(0);
        });
    });

    describe('loadDrawingData', () => {
        it('charge des données de dessin externes', () => {
            const { loadDrawingData } = useCanvasStore.getState();

            const externalData: DrawingData = {
                version: 1,
                lines: [
                    {
                        id: 'external-line-1',
                        tool: 'brush',
                        points: [{ x: 0, y: 0 }, { x: 100, y: 100 }],
                        color: '#0000FF',
                        width: 3,
                    },
                ],
                shapes: [
                    {
                        id: 'external-shape-1',
                        type: 'circle',
                        center: { x: 25, y: 75 },
                        radius: 10,
                        color: '#FF00FF',
                    },
                ],
            };

            loadDrawingData(externalData);

            const state = useCanvasStore.getState();
            expect(state.drawingData).toEqual(externalData);
            expect(state.currentLine).toEqual([]);
            expect(state.isDrawing).toBe(false);
        });
    });
});

// ============================================================================
// TESTS - UNDO/REDO (Zundo)
// ============================================================================

describe('Canvas Store - Undo/Redo (Zundo)', () => {
    describe('pastStates tracking', () => {
        it('ajoute un état à pastStates après ajout d\'une ligne', () => {
            const { startLine, updateCurrentLine, finalizeLine } = useCanvasStore.getState();
            const temporalStore = useCanvasStore.temporal.getState();

            expect(temporalStore.pastStates.length).toBe(0);

            startLine({ x: 10, y: 20 });
            updateCurrentLine({ x: 15, y: 25 });
            finalizeLine();

            expect(useCanvasStore.temporal.getState().pastStates.length).toBe(1);
        });

        it('ajoute un état à pastStates après ajout d\'une forme', () => {
            const { addShape } = useCanvasStore.getState();

            addShape({
                type: 'circle',
                center: { x: 50, y: 50 },
                radius: 5,
                color: '#00FF00',
            });

            expect(useCanvasStore.temporal.getState().pastStates.length).toBe(1);
        });
    });

    describe('undo', () => {
        it('annule la dernière ligne ajoutée', () => {
            const { startLine, updateCurrentLine, finalizeLine } = useCanvasStore.getState();

            startLine({ x: 10, y: 20 });
            updateCurrentLine({ x: 15, y: 25 });
            finalizeLine();

            expect(useCanvasStore.getState().drawingData.lines).toHaveLength(1);

            useCanvasStore.temporal.getState().undo();

            expect(useCanvasStore.getState().drawingData.lines).toHaveLength(0);
        });

        it('annule la dernière forme ajoutée', () => {
            const { addShape } = useCanvasStore.getState();

            addShape({
                type: 'circle',
                center: { x: 50, y: 50 },
                radius: 5,
                color: '#00FF00',
            });

            expect(useCanvasStore.getState().drawingData.shapes).toHaveLength(1);

            useCanvasStore.temporal.getState().undo();

            expect(useCanvasStore.getState().drawingData.shapes).toHaveLength(0);
        });

        it('déplace l\'état vers futureStates', () => {
            const { startLine, updateCurrentLine, finalizeLine } = useCanvasStore.getState();

            startLine({ x: 10, y: 20 });
            updateCurrentLine({ x: 15, y: 25 });
            finalizeLine();

            useCanvasStore.temporal.getState().undo();

            const temporalState = useCanvasStore.temporal.getState();
            expect(temporalState.pastStates.length).toBe(0);
            expect(temporalState.futureStates.length).toBe(1);
        });
    });

    describe('redo', () => {
        it('rétablit la dernière action annulée', () => {
            const { startLine, updateCurrentLine, finalizeLine } = useCanvasStore.getState();

            startLine({ x: 10, y: 20 });
            updateCurrentLine({ x: 15, y: 25 });
            finalizeLine();

            const lineId = useCanvasStore.getState().drawingData.lines[0].id;

            useCanvasStore.temporal.getState().undo();
            expect(useCanvasStore.getState().drawingData.lines).toHaveLength(0);

            useCanvasStore.temporal.getState().redo();
            expect(useCanvasStore.getState().drawingData.lines).toHaveLength(1);
            expect(useCanvasStore.getState().drawingData.lines[0].id).toBe(lineId);
        });

        it('déplace l\'état de futureStates vers pastStates', () => {
            const { startLine, updateCurrentLine, finalizeLine } = useCanvasStore.getState();

            startLine({ x: 10, y: 20 });
            updateCurrentLine({ x: 15, y: 25 });
            finalizeLine();

            useCanvasStore.temporal.getState().undo();
            useCanvasStore.temporal.getState().redo();

            const temporalState = useCanvasStore.temporal.getState();
            expect(temporalState.pastStates.length).toBe(1);
            expect(temporalState.futureStates.length).toBe(0);
        });
    });

    describe('equality function (évite les doublons)', () => {
        it('ne crée pas d\'état dupliqué pour les changements UI seuls', () => {
            const { setTool, setColor, setWidth } = useCanvasStore.getState();

            // Ces actions ne modifient pas drawingData, donc ne devraient pas créer d'états
            setTool('eraser');
            setColor('#00FF00');
            setWidth(10);

            // pastStates devrait rester vide car drawingData n'a pas changé
            expect(useCanvasStore.temporal.getState().pastStates.length).toBe(0);
        });
    });

    describe('cycle complet undo/redo', () => {
        it('gère plusieurs undo/redo consécutifs', () => {
            const { startLine, updateCurrentLine, finalizeLine, addShape } =
                useCanvasStore.getState();

            // Action 1 : Ajouter une ligne
            startLine({ x: 10, y: 20 });
            updateCurrentLine({ x: 15, y: 25 });
            finalizeLine();

            // Action 2 : Ajouter une forme
            addShape({
                type: 'circle',
                center: { x: 50, y: 50 },
                radius: 5,
                color: '#00FF00',
            });

            // Action 3 : Ajouter une autre ligne
            startLine({ x: 30, y: 40 });
            updateCurrentLine({ x: 35, y: 45 });
            finalizeLine();

            expect(useCanvasStore.getState().drawingData.lines).toHaveLength(2);
            expect(useCanvasStore.getState().drawingData.shapes).toHaveLength(1);

            // Undo 3 fois
            useCanvasStore.temporal.getState().undo();
            expect(useCanvasStore.getState().drawingData.lines).toHaveLength(1);

            useCanvasStore.temporal.getState().undo();
            expect(useCanvasStore.getState().drawingData.shapes).toHaveLength(0);

            useCanvasStore.temporal.getState().undo();
            expect(useCanvasStore.getState().drawingData.lines).toHaveLength(0);

            // Redo 2 fois
            useCanvasStore.temporal.getState().redo();
            expect(useCanvasStore.getState().drawingData.lines).toHaveLength(1);

            useCanvasStore.temporal.getState().redo();
            expect(useCanvasStore.getState().drawingData.shapes).toHaveLength(1);
        });
    });
});
