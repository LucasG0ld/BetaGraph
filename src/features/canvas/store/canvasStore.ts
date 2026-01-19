import { create, useStore } from 'zustand';
import { persist } from 'zustand/middleware';
import { temporal } from 'zundo';
import { nanoid } from 'nanoid';

import {
    createEmptyDrawingData,
    DRAWING_DATA_SCHEMA_VERSION,
    type DrawingData,
    type Line,
    type LineTool,
    type Point,
    type Shape,
} from '@/lib/schemas/drawing.schema';
import { simplifyPath, TOLERANCE_PERCENT } from '../utils/simplify-path';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Outils disponibles dans le Canvas.
 */
export type CanvasTool = 'brush' | 'circle' | 'eraser';

/**
 * État du store Canvas.
 */
export interface CanvasState {
    // État UI (non persisté, non suivi par undo)
    /** Outil actuellement sélectionné */
    currentTool: CanvasTool;
    /** Couleur de dessin actuelle (format #RRGGBB) */
    currentColor: string;
    /** Épaisseur de trait actuelle (% de la largeur image) */
    currentWidth: number;
    /** Tracé en cours de dessin (temporaire, avant finalisation) */
    currentLine: Point[];
    /** Indique si l'utilisateur est en train de dessiner */
    isDrawing: boolean;

    // État Données (persisté + suivi par undo)
    /** Données de dessin complètes */
    drawingData: DrawingData;
    /** Timestamp de la dernière modification locale (ISO 8601) */
    lastModifiedLocally: string | null;
    /** Timestamp du dernier sync réussi avec le serveur (ISO 8601) */
    lastSyncedWithServer: string | null;
}

/**
 * Actions du store Canvas.
 */
export interface CanvasActions {
    // Actions UI
    /** Définit l'outil actif */
    setTool: (tool: CanvasTool) => void;
    /** Définit la couleur de dessin */
    setColor: (color: string) => void;
    /** Définit l'épaisseur de trait */
    setWidth: (width: number) => void;

    // Actions de dessin (Ligne)
    /** Démarre un nouveau tracé */
    startLine: (point: Point) => void;
    /** Met à jour le tracé en cours (pendant le dessin) */
    updateCurrentLine: (point: Point) => void;
    /** Finalise le tracé et l'ajoute aux données */
    finalizeLine: () => void;
    /** Annule le tracé en cours sans le sauvegarder */
    cancelLine: () => void;

    // Actions de dessin (Forme)
    /** Ajoute une forme (cercle) aux données */
    addShape: (shape: Omit<Shape, 'id'>) => void;

    // Actions globales
    /** Supprime un élément par son ID */
    removeElement: (id: string) => void;
    /** Efface tout le dessin */
    clearCanvas: () => void;
    /** Réinitialise complètement le store */
    resetStore: () => void;
    /** Charge des données de dessin externes (ex: depuis Supabase) */
    loadDrawingData: (data: DrawingData, serverTimestamp?: string) => void;
}

export type CanvasStore = CanvasState & CanvasActions;

// ============================================================================
// CONSTANTES
// ============================================================================

/** Couleur par défaut (rouge vif) */
const DEFAULT_COLOR = '#FF3B30';

/** Épaisseur par défaut (2% de la largeur image) */
const DEFAULT_WIDTH = 2;



/** Outil par défaut */
const DEFAULT_TOOL: CanvasTool = 'brush';

// ============================================================================
// ÉTAT INITIAL
// ============================================================================

const initialState: CanvasState = {
    // UI
    currentTool: DEFAULT_TOOL,
    currentColor: DEFAULT_COLOR,
    currentWidth: DEFAULT_WIDTH,
    currentLine: [],
    isDrawing: false,

    // Données
    drawingData: createEmptyDrawingData(),
    lastModifiedLocally: null,
    lastSyncedWithServer: null,
};

// ============================================================================
// STORE
// ============================================================================

/**
 * Store Zustand pour le moteur Canvas.
 *
 * @description
 * Gère l'état complet du canvas de dessin :
 * - **État UI** : Outil sélectionné, couleur, épaisseur (non persisté)
 * - **Données** : Tracés et formes (persisté dans localStorage + suivi undo/redo)
 *
 * Configuration des middlewares :
 * - `temporal` (zundo) : Historique undo/redo sur `drawingData` uniquement
 * - `persist` : Sauvegarde automatique de `drawingData` dans localStorage
 *
 * @example
 * ```typescript
 * // Utilisation basique
 * const { currentTool, setTool, addShape } = useCanvasStore();
 *
 * // Accès à l'historique (undo/redo)
 * const { undo, redo, pastStates, futureStates } = useCanvasStore.temporal.getState();
 * ```
 */
export const useCanvasStore = create<CanvasStore>()(
    temporal(
        persist(
            (set, get) => ({
                ...initialState,

                // ============================================================
                // ACTIONS UI
                // ============================================================

                setTool: (tool) => {
                    set({ currentTool: tool });
                },

                setColor: (color) => {
                    set({ currentColor: color });
                },

                setWidth: (width) => {
                    set({ currentWidth: width });
                },

                // ============================================================
                // ACTIONS DESSIN (Ligne)
                // ============================================================

                startLine: (point) => {
                    set({
                        currentLine: [point],
                        isDrawing: true,
                    });
                },

                updateCurrentLine: (point) => {
                    const { currentLine } = get();
                    set({
                        currentLine: [...currentLine, point],
                    });
                },

                finalizeLine: () => {
                    const { currentLine, currentTool, currentColor, currentWidth, drawingData } =
                        get();

                    // Ignorer si le tracé est trop court
                    if (currentLine.length < 2) {
                        set({ currentLine: [], isDrawing: false });
                        return;
                    }

                    // Simplifier les points pour réduire la taille du stockage
                    const simplifiedPoints = simplifyPath(currentLine, TOLERANCE_PERCENT);

                    // Déterminer le type d'outil ligne
                    const lineTool: LineTool = currentTool === 'eraser' ? 'eraser' : 'brush';

                    // Créer la nouvelle ligne avec les points simplifiés
                    const newLine: Line = {
                        id: nanoid(),
                        tool: lineTool,
                        points: simplifiedPoints,
                        color: currentColor,
                        width: currentWidth,
                    };

                    // Ajouter aux données (cette mutation est suivie par zundo)
                    set({
                        drawingData: {
                            ...drawingData,
                            lines: [...drawingData.lines, newLine],
                        },
                        currentLine: [],
                        isDrawing: false,
                        lastModifiedLocally: new Date().toISOString(),
                    });
                },

                cancelLine: () => {
                    set({ currentLine: [], isDrawing: false });
                },

                // ============================================================
                // ACTIONS DESSIN (Forme)
                // ============================================================

                addShape: (shapeWithoutId) => {
                    const { drawingData } = get();

                    const newShape: Shape = {
                        ...shapeWithoutId,
                        id: nanoid(),
                    } as Shape;

                    set({
                        drawingData: {
                            ...drawingData,
                            shapes: [...drawingData.shapes, newShape],
                        },
                        lastModifiedLocally: new Date().toISOString(),
                    });
                },

                // ============================================================
                // ACTIONS GLOBALES
                // ============================================================

                removeElement: (id) => {
                    const { drawingData } = get();

                    set({
                        drawingData: {
                            ...drawingData,
                            lines: drawingData.lines.filter((line) => line.id !== id),
                            shapes: drawingData.shapes.filter((shape) => shape.id !== id),
                        },
                        lastModifiedLocally: new Date().toISOString(),
                    });
                },

                clearCanvas: () => {
                    set({
                        drawingData: {
                            version: DRAWING_DATA_SCHEMA_VERSION,
                            lines: [],
                            shapes: [],
                        },
                        currentLine: [],
                        isDrawing: false,
                        lastModifiedLocally: new Date().toISOString(),
                    });
                },

                resetStore: () => {
                    set(initialState);
                },

                loadDrawingData: (data, serverTimestamp?: string) => {
                    set({
                        drawingData: data,
                        currentLine: [],
                        isDrawing: false,
                        // Ne pas mettre à jour lastModifiedLocally (provient du serveur)
                        lastSyncedWithServer: serverTimestamp ?? new Date().toISOString(),
                    });
                },
            }),
            {
                name: 'canvas-storage',
                partialize: (state) => ({
                    drawingData: state.drawingData,
                    lastModifiedLocally: state.lastModifiedLocally,
                    lastSyncedWithServer: state.lastSyncedWithServer,
                }),
            }
        ),
        {
            // Configuration zundo : ne suivre que drawingData pour l'historique
            partialize: (state) => ({
                drawingData: state.drawingData,
            }),
            // Fonction d'égalité pour éviter les doublons d'état (phantom pushes)
            equality: (pastState, currentState) => {
                // Comparaison simple des versions et longueurs pour performance
                // Si on a besoin de plus de précision, on peut faire un deepEqual
                const past = pastState?.drawingData;
                const current = currentState?.drawingData;

                if (!past || !current) return false;

                return (
                    past.lines.length === current.lines.length &&
                    past.shapes.length === current.shapes.length &&
                    // Vérifier les derniers IDs pour être sûr
                    past.lines[past.lines.length - 1]?.id === current.lines[current.lines.length - 1]?.id &&
                    past.shapes[past.shapes.length - 1]?.id === current.shapes[current.shapes.length - 1]?.id
                );
            },
            // Limite l'historique à 50 états pour éviter une consommation mémoire excessive
            limit: 50,
        }
    )
);


// ============================================================================
// HOOKS DÉRIVÉS
// ============================================================================

/**
 * Hook pour accéder aux fonctions undo/redo de manière réactive.
 *
 * @description
 * Utilise le store temporal de zundo comme un hook réactif.
 * Le composant se re-rend quand l'historique change.
 *
 * @example
 * ```typescript
 * const { undo, redo, canUndo, canRedo } = useCanvasHistory();
 *
 * // Les booléens canUndo/canRedo sont déjà calculés
 * <button disabled={!canUndo} onClick={undo}>Undo</button>
 * ```
 */
export function useCanvasHistory() {
    const { pastStates, futureStates, undo, redo } = useStore(useCanvasStore.temporal);

    return {
        undo,
        redo,
        canUndo: pastStates.length > 0,
        canRedo: futureStates.length > 0,
    };
}

/**
 * Génère un ID unique pour les éléments de dessin.
 * Exposé pour usage externe si nécessaire.
 *
 * @returns ID unique de 21 caractères (nanoid)
 */
export function generateElementId(): string {
    return nanoid();
}
