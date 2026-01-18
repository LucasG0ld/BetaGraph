'use client';

/**
 * Hook de gestion des événements de dessin sur le Canvas.
 *
 * @description
 * Gère les événements pointeur (mouse/touch) pour le dessin :
 * - Brush : Tracés à main levée
 * - Eraser : Tracés masquants (destination-out)
 * - Circle : Formes géométriques (centre + rayon)
 *
 * @module useCanvasDrawing
 */

import { useCallback, useRef } from 'react';
import type { KonvaEventObject } from 'konva/lib/Node';
import { useCanvasStore } from '../store/canvasStore';
import { isPointInsideImage, type CanvasLayout } from '../utils/canvas-math';
import { stageToRelative } from '../utils/coords-converter';
import type { Point } from '@/lib/schemas/drawing.schema';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Configuration du hook de dessin.
 */
export interface UseCanvasDrawingConfig {
    /** Layout calculé du canvas */
    layout: CanvasLayout | null;
    /** Largeur originale de l'image */
    imageWidth: number;
    /** Hauteur originale de l'image */
    imageHeight: number;
    /** Indique si un geste de navigation est en cours (désactive le dessin) */
    isGesturing?: boolean;
}

/**
 * État temporaire pour le dessin de cercle.
 */
interface CircleDrawState {
    center: Point;
    isDrawing: boolean;
}

/**
 * Valeurs retournées par le hook.
 */
export interface UseCanvasDrawingReturn {
    /** Handler pour PointerDown */
    handlePointerDown: (e: KonvaEventObject<PointerEvent>) => void;
    /** Handler pour PointerMove */
    handlePointerMove: (e: KonvaEventObject<PointerEvent>) => void;
    /** Handler pour PointerUp */
    handlePointerUp: (e: KonvaEventObject<PointerEvent>) => void;
    /** Centre du cercle en cours de dessin (pour preview) */
    circlePreview: CircleDrawState | null;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook pour gérer les événements de dessin sur le Canvas.
 *
 * @param config - Configuration avec layout et dimensions image
 * @returns Handlers d'événements et état de preview
 *
 * @example
 * ```tsx
 * const { handlePointerDown, handlePointerMove, handlePointerUp } =
 *   useCanvasDrawing({ layout, imageWidth, imageHeight });
 *
 * <Stage
 *   onPointerDown={handlePointerDown}
 *   onPointerMove={handlePointerMove}
 *   onPointerUp={handlePointerUp}
 * />
 * ```
 */
export function useCanvasDrawing({
    layout,
    imageWidth,
    imageHeight,
    isGesturing = false,
}: UseCanvasDrawingConfig): UseCanvasDrawingReturn {
    // Store actions
    const startLine = useCanvasStore((s) => s.startLine);
    const updateCurrentLine = useCanvasStore((s) => s.updateCurrentLine);
    const finalizeLine = useCanvasStore((s) => s.finalizeLine);
    const cancelLine = useCanvasStore((s) => s.cancelLine);
    const addShape = useCanvasStore((s) => s.addShape);
    const currentTool = useCanvasStore((s) => s.currentTool);
    const currentColor = useCanvasStore((s) => s.currentColor);
    const currentLine = useCanvasStore((s) => s.currentLine);
    const isDrawing = useCanvasStore((s) => s.isDrawing);

    // État local pour le cercle en cours
    const circleStateRef = useRef<CircleDrawState | null>(null);

    // Throttle pour PointerMove (via rAF)
    const rafIdRef = useRef<number | null>(null);
    const lastMoveTimeRef = useRef<number>(0);

    /**
     * Convertit les coordonnées d'un événement Konva en coordonnées relatives.
     */
    const getRelativePoint = useCallback(
        (e: KonvaEventObject<PointerEvent>): Point | null => {
            if (!layout) return null;

            const stage = e.target.getStage();
            if (!stage) return null;

            const pos = stage.getPointerPosition();
            if (!pos) return null;

            // Vérifier si le point est dans l'image
            if (!isPointInsideImage(pos.x, pos.y, layout)) {
                return null;
            }

            return stageToRelative(pos.x, pos.y, layout, imageWidth, imageHeight);
        },
        [layout, imageWidth, imageHeight]
    );

    /**
     * Calcule le rayon d'un cercle entre deux points (en %).
     */
    const calculateRadius = useCallback(
        (center: Point, edge: Point): number => {
            const dx = edge.x - center.x;
            const dy = edge.y - center.y;
            // Rayon = distance euclidienne (en % de l'image)
            // Mais on normalise par rapport à la largeur pour cohérence
            return Math.sqrt(dx * dx + dy * dy);
        },
        []
    );

    // ========================================================================
    // HANDLERS
    // ========================================================================

    const handlePointerDown = useCallback(
        (e: KonvaEventObject<PointerEvent>) => {
            // Ignorer si un geste de navigation est en cours
            if (isGesturing) return;

            // Ignorer si multi-touch (geste de zoom/pan)
            const nativeEvent = e.evt as TouchEvent | MouseEvent;
            if ('touches' in nativeEvent && nativeEvent.touches.length >= 2) {
                return;
            }

            const point = getRelativePoint(e);
            if (!point) return;

            if (currentTool === 'circle') {
                // Mode cercle : stocker le centre
                circleStateRef.current = {
                    center: point,
                    isDrawing: true,
                };
            } else {
                // Mode brush ou eraser : démarrer un tracé
                startLine(point);
            }
        },
        [getRelativePoint, currentTool, startLine, isGesturing]
    );

    const handlePointerMove = useCallback(
        (e: KonvaEventObject<PointerEvent>) => {
            // Throttle via rAF pour éviter trop de mises à jour
            const now = performance.now();
            if (now - lastMoveTimeRef.current < 16) {
                // ~60fps max
                return;
            }
            lastMoveTimeRef.current = now;

            if (rafIdRef.current) {
                cancelAnimationFrame(rafIdRef.current);
            }

            rafIdRef.current = requestAnimationFrame(() => {
                const point = getRelativePoint(e);

                if (currentTool === 'circle') {
                    // Mode cercle : on ne fait rien de spécial ici
                    // Le preview sera calculé au render
                    if (circleStateRef.current?.isDrawing && point) {
                        // On pourrait ajouter un état de preview ici si besoin
                    }
                } else {
                    // Mode brush ou eraser : ajouter le point au tracé
                    if (isDrawing && point) {
                        updateCurrentLine(point);
                    }
                }
            });
        },
        [getRelativePoint, currentTool, isDrawing, updateCurrentLine]
    );

    const handlePointerUp = useCallback(
        (e: KonvaEventObject<PointerEvent>) => {
            // Annuler tout rAF en cours
            if (rafIdRef.current) {
                cancelAnimationFrame(rafIdRef.current);
                rafIdRef.current = null;
            }

            const point = getRelativePoint(e);

            if (currentTool === 'circle') {
                // Mode cercle : créer la forme
                if (circleStateRef.current?.isDrawing && point) {
                    const { center } = circleStateRef.current;
                    const radius = calculateRadius(center, point);

                    // Éviter les cercles trop petits (< 0.5% de la largeur)
                    if (radius >= 0.5) {
                        addShape({
                            type: 'circle',
                            center,
                            radius,
                            color: currentColor,
                        });
                    }
                }
                circleStateRef.current = null;
            } else {
                // Mode brush ou eraser : finaliser le tracé
                // Note: La simplification est gérée dans finalizeLine() du store
                if (isDrawing && currentLine.length >= 2) {
                    finalizeLine();
                } else {
                    // Tracé trop court, annuler
                    cancelLine();
                }
            }
        },
        [
            getRelativePoint,
            currentTool,
            calculateRadius,
            addShape,
            currentColor,
            isDrawing,
            currentLine,
            finalizeLine,
            cancelLine,
        ]
    );

    return {
        handlePointerDown,
        handlePointerMove,
        handlePointerUp,
        circlePreview: circleStateRef.current,
    };
}
