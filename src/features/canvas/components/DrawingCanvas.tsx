'use client';

/**
 * Composant Canvas principal pour le dessin sur image.
 *
 * @description
 * Affiche une image de fond avec les tracés et formes stockés dans le store Zustand.
 * Gère le redimensionnement responsive via ResizeObserver.
 *
 * @module DrawingCanvas
 */

import { useEffect, useRef, useState, useMemo, memo } from 'react';
import { Stage, Layer, Line, Circle, Image as KonvaImage } from 'react-konva';
import { useCanvasStore } from '../store/canvasStore';
import { calculateCanvasLayout, type CanvasLayout } from '../utils/canvas-math';
import {
    relativeToStage,
    relativePointsToFlat,
    relativeWidthToStage,
    relativeRadiusToStage,
} from '../utils/coords-converter';
import { useCanvasDrawing } from '../hooks/useCanvasDrawing';
import { useCanvasGestures } from '../hooks/useCanvasGestures';
import { CanvasToolbar } from './CanvasToolbar';
import type Konva from 'konva';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Props du composant DrawingCanvas.
 */
export interface DrawingCanvasProps {
    /** URL de l'image de fond (Supabase Storage) */
    imageUrl: string;
    /** Largeur originale de l'image en pixels */
    imageWidth: number;
    /** Hauteur originale de l'image en pixels */
    imageHeight: number;
    /** Classe CSS additionnelle pour le conteneur */
    className?: string;
}

/**
 * État du chargement d'image.
 */
type ImageStatus = 'loading' | 'loaded' | 'failed';

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook pour charger une image HTMLImageElement à partir d'une URL.
 *
 * @param url - URL de l'image
 * @returns [image, status] - L'élément image et son statut
 */
function useImage(url: string): [HTMLImageElement | null, ImageStatus] {
    const [image, setImage] = useState<HTMLImageElement | null>(null);
    const [status, setStatus] = useState<ImageStatus>('loading');

    useEffect(() => {
        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
            setImage(img);
            setStatus('loaded');
        };

        img.onerror = () => {
            setStatus('failed');
        };

        img.src = url;

        return () => {
            img.onload = null;
            img.onerror = null;
        };
    }, [url]);

    return [image, status];
}

/**
 * Hook pour observer la taille d'un conteneur avec debounce.
 *
 * @param ref - Ref du conteneur à observer
 * @param debounceMs - Délai de debounce en millisecondes
 * @returns Dimensions du conteneur
 */
function useContainerSize(
    ref: React.RefObject<HTMLDivElement | null>,
    debounceMs: number = 100
): { width: number; height: number } {
    const [size, setSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        // Initialiser avec la taille actuelle
        const rect = element.getBoundingClientRect();
        setSize({ width: rect.width, height: rect.height });

        // Debounce timer
        let timeoutId: ReturnType<typeof setTimeout>;

        const observer = new ResizeObserver((entries) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                const { width, height } = entries[0].contentRect;
                setSize({ width, height });
            }, debounceMs);
        });

        observer.observe(element);

        return () => {
            clearTimeout(timeoutId);
            observer.disconnect();
        };
    }, [ref, debounceMs]);

    return size;
}

// ============================================================================
// SOUS-COMPOSANTS MEMOÏSÉS
// ============================================================================

/**
 * Props pour le rendu d'une ligne.
 */
interface LineRendererProps {
    points: number[];
    color: string;
    width: number;
    tool: 'brush' | 'eraser';
}

/**
 * Composant mémoïsé pour le rendu d'une ligne.
 */
const LineRenderer = memo(function LineRenderer({
    points,
    color,
    width,
    tool,
}: LineRendererProps) {
    return (
        <Line
            points={points}
            stroke={color}
            strokeWidth={width}
            lineCap="round"
            lineJoin="round"
            tension={0.5}
            globalCompositeOperation={
                tool === 'eraser' ? 'destination-out' : 'source-over'
            }
        />
    );
});

/**
 * Props pour le rendu d'un cercle.
 */
interface CircleRendererProps {
    x: number;
    y: number;
    radius: number;
    color: string;
}

/**
 * Composant mémoïsé pour le rendu d'un cercle.
 */
const CircleRenderer = memo(function CircleRenderer({
    x,
    y,
    radius,
    color,
}: CircleRendererProps) {
    return (
        <Circle
            x={x}
            y={y}
            radius={radius}
            stroke={color}
            strokeWidth={2}
            fill="transparent"
        />
    );
});

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

/**
 * Composant Canvas principal pour BetaGraph.
 *
 * @description
 * Affiche une image de fond avec les tracés et formes stockés.
 * Le canvas s'adapte automatiquement à la taille de son conteneur
 * tout en préservant le ratio d'aspect de l'image (object-fit: contain).
 *
 * @example
 * ```tsx
 * <DrawingCanvas
 *   imageUrl="https://storage.supabase.co/image.webp"
 *   imageWidth={1920}
 *   imageHeight={1080}
 *   className="flex-1"
 * />
 * ```
 */
export function DrawingCanvas({
    imageUrl,
    imageWidth,
    imageHeight,
    className = '',
}: DrawingCanvasProps) {
    // Refs
    const containerRef = useRef<HTMLDivElement>(null);

    // Hooks
    const containerSize = useContainerSize(containerRef);
    const [image, imageStatus] = useImage(imageUrl);

    // Store
    const drawingData = useCanvasStore((state) => state.drawingData);
    const currentLine = useCanvasStore((state) => state.currentLine);
    const currentColor = useCanvasStore((state) => state.currentColor);
    const currentWidth = useCanvasStore((state) => state.currentWidth);
    const currentTool = useCanvasStore((state) => state.currentTool);
    const isDrawing = useCanvasStore((state) => state.isDrawing);

    // Calculer le layout responsive
    const layout: CanvasLayout | null = useMemo(() => {
        if (containerSize.width === 0 || containerSize.height === 0) {
            return null;
        }
        return calculateCanvasLayout(containerSize, {
            width: imageWidth,
            height: imageHeight,
        });
    }, [containerSize, imageWidth, imageHeight]);

    // Convertir les lignes stockées en coordonnées Stage
    const renderedLines = useMemo(() => {
        if (!layout) return [];

        return drawingData.lines.map((line) => ({
            id: line.id,
            points: relativePointsToFlat(line.points, layout, imageWidth, imageHeight),
            color: line.color,
            width: relativeWidthToStage(line.width, layout, imageWidth),
            tool: line.tool,
        }));
    }, [drawingData.lines, layout, imageWidth, imageHeight]);

    // Convertir les formes stockées en coordonnées Stage
    const renderedShapes = useMemo(() => {
        if (!layout) return [];

        return drawingData.shapes.map((shape) => {
            if (shape.type === 'circle') {
                const center = relativeToStage(
                    shape.center.x,
                    shape.center.y,
                    layout,
                    imageWidth,
                    imageHeight
                );
                return {
                    id: shape.id,
                    type: 'circle' as const,
                    x: center.x,
                    y: center.y,
                    radius: relativeRadiusToStage(shape.radius, layout, imageWidth),
                    color: shape.color,
                };
            }
            return null;
        }).filter(Boolean);
    }, [drawingData.shapes, layout, imageWidth, imageHeight]);

    // Convertir le tracé en cours en coordonnées Stage
    const currentLinePoints = useMemo(() => {
        if (!layout || currentLine.length === 0) return [];

        return relativePointsToFlat(currentLine, layout, imageWidth, imageHeight);
    }, [currentLine, layout, imageWidth, imageHeight]);

    // Épaisseur du tracé en cours en pixels
    const currentWidthPx = useMemo(() => {
        if (!layout) return 0;
        return relativeWidthToStage(currentWidth, layout, imageWidth);
    }, [currentWidth, layout, imageWidth]);

    // Hook de gestion des gestes (zoom/pan)
    const stageRef = useRef<Konva.Stage>(null);
    const { transform, gestureProps, isGesturing, resetView } = useCanvasGestures({
        stageRef,
    });

    // Hook de gestion des événements de dessin
    const { handlePointerDown, handlePointerMove, handlePointerUp } = useCanvasDrawing({
        layout,
        imageWidth,
        imageHeight,
        isGesturing,
    });

    // États de rendu
    if (imageStatus === 'loading') {
        return (
            <div
                ref={containerRef}
                className={`flex items-center justify-center bg-brand-black ${className}`}
            >
                <div className="text-gray-400">Chargement de l&apos;image...</div>
            </div>
        );
    }

    if (imageStatus === 'failed') {
        return (
            <div
                ref={containerRef}
                className={`flex items-center justify-center bg-brand-black ${className}`}
            >
                <div className="text-red-400">Erreur de chargement de l&apos;image</div>
            </div>
        );
    }

    if (!layout) {
        return (
            <div
                ref={containerRef}
                className={`flex items-center justify-center bg-brand-black ${className}`}
            />
        );
    }

    return (
        <div
            ref={containerRef}
            className={`relative bg-brand-black ${className}`}
            style={{ touchAction: 'none' }}
            {...gestureProps()}
        >
            <Stage
                ref={stageRef}
                width={layout.stageWidth}
                height={layout.stageHeight}
                scaleX={transform.scale}
                scaleY={transform.scale}
                x={transform.x}
                y={transform.y}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
            >
                {/* Layer 1: Image de fond */}
                <Layer>
                    {image && (
                        <KonvaImage
                            image={image}
                            x={layout.offsetX}
                            y={layout.offsetY}
                            width={layout.scaledWidth}
                            height={layout.scaledHeight}
                        />
                    )}
                </Layer>

                {/* Layer 2: Tracés et formes */}
                <Layer>
                    {/* Lignes finalisées */}
                    {renderedLines.map((line) => (
                        <LineRenderer
                            key={line.id}
                            points={line.points}
                            color={line.color}
                            width={line.width}
                            tool={line.tool}
                        />
                    ))}

                    {/* Formes (cercles) */}
                    {renderedShapes.map((shape) =>
                        shape?.type === 'circle' ? (
                            <CircleRenderer
                                key={shape.id}
                                x={shape.x}
                                y={shape.y}
                                radius={shape.radius}
                                color={shape.color}
                            />
                        ) : null
                    )}

                    {/* Tracé en cours (temps réel) */}
                    {isDrawing && currentLinePoints.length >= 2 && (
                        <Line
                            points={currentLinePoints}
                            stroke={currentColor}
                            strokeWidth={currentWidthPx}
                            lineCap="round"
                            lineJoin="round"
                            tension={0.5}
                            globalCompositeOperation={
                                currentTool === 'eraser' ? 'destination-out' : 'source-over'
                            }
                        />
                    )}
                </Layer>
            </Stage>

            {/* Toolbar flottante */}
            <CanvasToolbar
                onResetView={resetView}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10"
            />
        </div>
    );
}
