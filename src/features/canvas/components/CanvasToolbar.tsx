'use client';

/**
 * Toolbar d'outils pour l'éditeur Canvas.
 *
 * @description
 * Barre d'outils flottante avec :
 * - Sélection d'outils (Brush, Circle, Eraser)
 * - Contrôle de couleur (presets + picker)
 * - Contrôle d'épaisseur (slider)
 * - Actions d'historique (Undo, Redo, Clear)
 *
 * @module CanvasToolbar
 */

import { memo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCanvasStore, useCanvasHistory, type CanvasTool } from '../store/canvasStore';
import { ToolButton } from './ToolButton';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Props du composant CanvasToolbar.
 */
export interface CanvasToolbarProps {
    /** Callback pour réinitialiser la vue (zoom 1x) */
    onResetView?: () => void;
    /** Classe CSS additionnelle */
    className?: string;
}

// ============================================================================
// CONSTANTES
// ============================================================================

/**
 * Presets de couleurs pour l'escalade.
 */
const COLOR_PRESETS = [
    { color: '#4CAF50', label: 'Vert (Mains)', emoji: '🟢' },
    { color: '#2196F3', label: 'Bleu (Pieds)', emoji: '🔵' },
    { color: '#FF3B30', label: 'Rouge (Attention)', emoji: '🔴' },
    { color: '#FFD700', label: 'Jaune (Start)', emoji: '🟡' },
    { color: '#FFFFFF', label: 'Blanc', emoji: '⚪' },
] as const;

/**
 * Configuration des outils.
 */
const TOOLS_CONFIG: { tool: CanvasTool; icon: string; label: string }[] = [
    { tool: 'brush', icon: '✏️', label: 'Pinceau' },
    { tool: 'circle', icon: '⭕', label: 'Cercle' },
    { tool: 'eraser', icon: '🧽', label: 'Gomme' },
];

/**
 * Épaisseurs prédéfinies.
 */
const WIDTH_PRESETS = [1, 2, 3, 5, 8] as const;

// ============================================================================
// ANIMATIONS
// ============================================================================

const toolbarVariants = {
    hidden: { y: 100, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: { type: 'spring' as const, damping: 20, stiffness: 300 },
    },
    exit: { y: 100, opacity: 0 },
};

// ============================================================================
// SOUS-COMPOSANTS
// ============================================================================

/**
 * Séparateur vertical entre sections.
 */
const Divider = memo(function Divider() {
    return <div className="w-px h-8 bg-white/20 mx-2" />;
});

/**
 * Section de sélection de couleur.
 */
const ColorSection = memo(function ColorSection({
    currentColor,
    onColorChange,
}: {
    currentColor: string;
    onColorChange: (color: string) => void;
}) {
    const [showPicker, setShowPicker] = useState(false);

    return (
        <div className="flex items-center gap-1 relative">
            {/* Presets de couleurs */}
            {COLOR_PRESETS.map(({ color, label }) => (
                <button
                    key={color}
                    type="button"
                    aria-label={label}
                    onClick={() => onColorChange(color)}
                    className={`
                        w-7 h-7 rounded-full
                        transition-all duration-150
                        ${currentColor === color
                            ? 'ring-2 ring-offset-2 ring-offset-black ring-white scale-110'
                            : 'hover:scale-110'
                        }
                    `}
                    style={{ backgroundColor: color }}
                />
            ))}

            {/* Bouton color picker */}
            <button
                type="button"
                aria-label="Couleur personnalisée"
                onClick={() => setShowPicker(!showPicker)}
                className="w-7 h-7 rounded-full bg-gradient-to-br from-red-500 via-green-500 to-blue-500 hover:scale-110 transition-transform"
            />

            {/* Picker (simple input color) */}
            <AnimatePresence>
                {showPicker && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute bottom-full mb-2 left-0 bg-black/90 p-2 rounded-lg"
                    >
                        <input
                            type="color"
                            value={currentColor}
                            onChange={(e) => onColorChange(e.target.value)}
                            className="w-10 h-10 cursor-pointer rounded"
                            aria-label="Sélectionner une couleur"
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});

/**
 * Section de sélection d'épaisseur.
 */
const WidthSection = memo(function WidthSection({
    currentWidth,
    onWidthChange,
}: {
    currentWidth: number;
    onWidthChange: (width: number) => void;
}) {
    return (
        <div className="flex items-center gap-1">
            {WIDTH_PRESETS.map((width) => (
                <button
                    key={width}
                    type="button"
                    aria-label={`Épaisseur ${width}%`}
                    onClick={() => onWidthChange(width)}
                    className={`
                        w-8 h-8 rounded-lg flex items-center justify-center
                        transition-all duration-150
                        ${currentWidth === width
                            ? 'bg-white/20 ring-1 ring-white'
                            : 'bg-white/5 hover:bg-white/10'
                        }
                    `}
                >
                    <div
                        className="rounded-full bg-white"
                        style={{
                            width: `${Math.max(4, width * 2)}px`,
                            height: `${Math.max(4, width * 2)}px`,
                        }}
                    />
                </button>
            ))}
        </div>
    );
});

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

/**
 * Toolbar flottante pour l'éditeur Canvas.
 *
 * @example
 * ```tsx
 * <CanvasToolbar
 *   onResetView={resetView}
 *   className="absolute bottom-4 left-1/2 -translate-x-1/2"
 * />
 * ```
 */
export const CanvasToolbar = memo(function CanvasToolbar({
    onResetView,
    className = '',
}: CanvasToolbarProps) {
    // Store
    const currentTool = useCanvasStore((s) => s.currentTool);
    const currentColor = useCanvasStore((s) => s.currentColor);
    const currentWidth = useCanvasStore((s) => s.currentWidth);
    const setTool = useCanvasStore((s) => s.setTool);
    const setColor = useCanvasStore((s) => s.setColor);
    const setWidth = useCanvasStore((s) => s.setWidth);
    const clearCanvas = useCanvasStore((s) => s.clearCanvas);

    // Historique
    const { undo, redo, pastStates, futureStates } = useCanvasHistory();
    const canUndo = pastStates.length > 0;
    const canRedo = futureStates.length > 0;

    // Handlers
    const handleToolChange = useCallback((tool: CanvasTool) => {
        setTool(tool);
    }, [setTool]);

    const handleUndo = useCallback(() => {
        if (canUndo) undo();
    }, [canUndo, undo]);

    const handleRedo = useCallback(() => {
        if (canRedo) redo();
    }, [canRedo, redo]);

    const handleClear = useCallback(() => {
        // Confirmation simple
        if (confirm('Effacer tout le dessin ?')) {
            clearCanvas();
        }
    }, [clearCanvas]);

    return (
        <motion.div
            variants={toolbarVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`
                flex items-center gap-2 p-3
                bg-black/80 backdrop-blur-md
                rounded-2xl shadow-2xl
                border border-white/10
                ${className}
            `}
        >
            {/* Section Outils */}
            <div className="flex items-center gap-1">
                {TOOLS_CONFIG.map(({ tool, icon, label }) => (
                    <ToolButton
                        key={tool}
                        icon={icon}
                        ariaLabel={label}
                        isActive={currentTool === tool}
                        onClick={() => handleToolChange(tool)}
                    />
                ))}
            </div>

            <Divider />

            {/* Section Couleurs */}
            <ColorSection
                currentColor={currentColor}
                onColorChange={setColor}
            />

            <Divider />

            {/* Section Épaisseur */}
            <WidthSection
                currentWidth={currentWidth}
                onWidthChange={setWidth}
            />

            <Divider />

            {/* Section Historique */}
            <div className="flex items-center gap-1">
                <ToolButton
                    icon="↩️"
                    ariaLabel="Annuler"
                    isDisabled={!canUndo}
                    onClick={handleUndo}
                    size="sm"
                />
                <ToolButton
                    icon="↪️"
                    ariaLabel="Rétablir"
                    isDisabled={!canRedo}
                    onClick={handleRedo}
                    size="sm"
                />
                {onResetView && (
                    <ToolButton
                        icon="🔍"
                        ariaLabel="Réinitialiser la vue"
                        onClick={onResetView}
                        size="sm"
                    />
                )}
                <ToolButton
                    icon="🗑️"
                    ariaLabel="Effacer tout"
                    onClick={handleClear}
                    size="sm"
                />
            </div>
        </motion.div>
    );
});
