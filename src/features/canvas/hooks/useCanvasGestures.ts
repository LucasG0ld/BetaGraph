'use client';

/**
 * Hook de gestion des gestes de navigation Canvas (Zoom/Pan).
 *
 * @description
 * Gère les gestes tactiles et souris pour la navigation :
 * - **Pinch** : Zoom centré sur les doigts
 * - **Drag** : Pan avec 2 doigts ou molette souris
 * - **Wheel** : Zoom avec molette souris
 *
 * @module useCanvasGestures
 */

import { useState, useCallback, useRef } from 'react';
import { useGesture } from '@use-gesture/react';
import type Konva from 'konva';

// ============================================================================
// TYPES
// ============================================================================

/**
 * État de transformation du Canvas.
 */
export interface CanvasTransform {
    /** Facteur de zoom (1 = 100%) */
    scale: number;
    /** Position X du Stage */
    x: number;
    /** Position Y du Stage */
    y: number;
}

/**
 * Configuration du hook.
 */
export interface UseCanvasGesturesConfig {
    /** Référence au Stage Konva */
    stageRef: React.RefObject<Konva.Stage | null>;
    /** Zoom minimum (défaut: 0.5) */
    minScale?: number;
    /** Zoom maximum (défaut: 5) */
    maxScale?: number;
    /** Callback quand les gestes commencent (pour désactiver le dessin) */
    onGestureStart?: () => void;
    /** Callback quand les gestes se terminent */
    onGestureEnd?: () => void;
}

/**
 * Valeurs retournées par le hook.
 */
export interface UseCanvasGesturesReturn {
    /** État actuel de transformation */
    transform: CanvasTransform;
    /** Propriétés à appliquer au conteneur pour les gestes */
    gestureProps: ReturnType<typeof useGesture>;
    /** Réinitialise la vue (zoom 1x, position 0,0) */
    resetView: () => void;
    /** Indique si un geste de navigation est en cours */
    isGesturing: boolean;
    /** Définit le zoom programmatiquement */
    setZoom: (scale: number) => void;
}

// ============================================================================
// CONSTANTES
// ============================================================================

/** Zoom minimum par défaut */
const DEFAULT_MIN_SCALE = 0.5;

/** Zoom maximum par défaut */
const DEFAULT_MAX_SCALE = 5;

/** Zoom initial */
const INITIAL_SCALE = 1;

/** Facteur de zoom pour la molette */
const WHEEL_ZOOM_FACTOR = 0.002;

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook pour gérer le zoom et le pan du Canvas.
 *
 * @param config - Configuration avec stageRef et limites de zoom
 * @returns Transform, gestureProps et fonctions de contrôle
 *
 * @example
 * ```tsx
 * const stageRef = useRef<Konva.Stage>(null);
 * const { transform, gestureProps, isGesturing, resetView } = useCanvasGestures({
 *   stageRef,
 *   onGestureStart: () => setCanDraw(false),
 *   onGestureEnd: () => setCanDraw(true),
 * });
 *
 * <div {...gestureProps()}>
 *   <Stage
 *     ref={stageRef}
 *     scaleX={transform.scale}
 *     scaleY={transform.scale}
 *     x={transform.x}
 *     y={transform.y}
 *   />
 * </div>
 * ```
 */
export function useCanvasGestures({
    stageRef,
    minScale = DEFAULT_MIN_SCALE,
    maxScale = DEFAULT_MAX_SCALE,
    onGestureStart,
    onGestureEnd,
}: UseCanvasGesturesConfig): UseCanvasGesturesReturn {
    // État de transformation
    const [transform, setTransform] = useState<CanvasTransform>({
        scale: INITIAL_SCALE,
        x: 0,
        y: 0,
    });

    // État de geste en cours
    const [isGesturing, setIsGesturing] = useState(false);

    // Références pour le calcul du zoom centré
    const lastScaleRef = useRef(INITIAL_SCALE);

    /**
     * Borne le scale entre min et max.
     */
    const clampScale = useCallback(
        (scale: number): number => {
            return Math.max(minScale, Math.min(maxScale, scale));
        },
        [minScale, maxScale]
    );

    /**
     * Calcule le nouveau transform pour un zoom centré.
     */
    const zoomToPoint = useCallback(
        (newScale: number, centerX: number, centerY: number): CanvasTransform => {
            const clampedScale = clampScale(newScale);
            const stage = stageRef.current;

            if (!stage) {
                return { scale: clampedScale, x: 0, y: 0 };
            }

            // Position actuelle
            const oldScale = transform.scale;
            const oldX = transform.x;
            const oldY = transform.y;

            // Calculer la nouvelle position pour que le centre de zoom reste fixe
            // Formule : newPos = center - (center - oldPos) * (newScale / oldScale)
            const scaleRatio = clampedScale / oldScale;
            const newX = centerX - (centerX - oldX) * scaleRatio;
            const newY = centerY - (centerY - oldY) * scaleRatio;

            return {
                scale: clampedScale,
                x: newX,
                y: newY,
            };
        },
        [clampScale, stageRef, transform]
    );

    /**
     * Réinitialise la vue à l'état initial.
     */
    const resetView = useCallback(() => {
        setTransform({
            scale: INITIAL_SCALE,
            x: 0,
            y: 0,
        });
        lastScaleRef.current = INITIAL_SCALE;
    }, []);

    /**
     * Définit le zoom programmatiquement (centré sur le Stage).
     */
    const setZoom = useCallback(
        (scale: number) => {
            const stage = stageRef.current;
            if (!stage) return;

            const centerX = stage.width() / 2;
            const centerY = stage.height() / 2;

            setTransform(zoomToPoint(scale, centerX, centerY));
        },
        [stageRef, zoomToPoint]
    );

    // ========================================================================
    // GESTURE BINDINGS
    // ========================================================================

    const gestureProps = useGesture(
        {
            // Pinch (2 doigts) pour zoom
            onPinchStart: () => {
                setIsGesturing(true);
                lastScaleRef.current = transform.scale;
                onGestureStart?.();
            },
            onPinch: ({ origin: [ox, oy], offset: [scale] }) => {
                // origin = centre du pinch (coordonnées écran)
                const stage = stageRef.current;
                if (!stage) return;

                // Convertir origin en coordonnées relatives au Stage
                const stageBox = stage.container().getBoundingClientRect();
                const centerX = ox - stageBox.left;
                const centerY = oy - stageBox.top;

                // Appliquer le zoom centré
                const newTransform = zoomToPoint(scale, centerX, centerY);
                setTransform(newTransform);
            },
            onPinchEnd: () => {
                setIsGesturing(false);
                lastScaleRef.current = transform.scale;
                onGestureEnd?.();
            },

            // Drag (2 doigts sur mobile, ou 1 doigt + touche spéciale)
            onDragStart: ({ touches }) => {
                // Ne pas démarrer le pan si c'est un simple clic (1 doigt)
                // Le pan ne se fait qu'avec 2 doigts sur mobile
                if (touches && touches < 2) return;

                setIsGesturing(true);
                onGestureStart?.();
            },
            onDrag: ({ delta: [dx, dy], touches, ctrlKey, metaKey }) => {
                // Pan seulement avec 2 doigts OU Ctrl/Cmd enfoncé
                const isTwoFingers = touches && touches >= 2;
                const isModifierKey = ctrlKey || metaKey;

                if (!isTwoFingers && !isModifierKey) return;

                setTransform((prev) => ({
                    ...prev,
                    x: prev.x + dx,
                    y: prev.y + dy,
                }));
            },
            onDragEnd: ({ touches }) => {
                if (touches && touches < 2) return;

                setIsGesturing(false);
                onGestureEnd?.();
            },

            // Wheel (molette souris) pour zoom
            onWheel: ({ delta: [, dy], event }) => {
                event.preventDefault();

                const stage = stageRef.current;
                if (!stage) return;

                // Position de la souris relative au Stage
                const stageBox = stage.container().getBoundingClientRect();
                const centerX = event.clientX - stageBox.left;
                const centerY = event.clientY - stageBox.top;

                // Calculer le nouveau scale
                const scaleChange = -dy * WHEEL_ZOOM_FACTOR;
                const newScale = transform.scale * (1 + scaleChange);

                // Appliquer le zoom centré
                const newTransform = zoomToPoint(newScale, centerX, centerY);
                setTransform(newTransform);
            },
        },
        {
            // Configuration des gestes
            pinch: {
                scaleBounds: { min: minScale, max: maxScale },
                from: () => [transform.scale, 0],
            },
            drag: {
                // Désactiver le drag avec 1 doigt pour laisser place au dessin
                filterTaps: true,
            },
            wheel: {
                eventOptions: { passive: false },
            },
        }
    );

    return {
        transform,
        gestureProps,
        resetView,
        isGesturing,
        setZoom,
    };
}

// ============================================================================
// EXPORTS ADDITIONNELS
// ============================================================================

/**
 * Constantes de zoom exportées pour usage externe.
 */
export const ZOOM_LIMITS = {
    MIN: DEFAULT_MIN_SCALE,
    MAX: DEFAULT_MAX_SCALE,
    INITIAL: INITIAL_SCALE,
} as const;
