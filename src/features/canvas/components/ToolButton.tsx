'use client';

/**
 * Bouton d'outil générique pour la toolbar.
 *
 * @description
 * Bouton avec icône, accessible, avec états actif/inactif.
 * Utilise Framer Motion pour les animations de feedback.
 *
 * @module ToolButton
 */

import { memo } from 'react';
import { motion } from 'framer-motion';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Props du composant ToolButton.
 */
export interface ToolButtonProps {
    /** Icône à afficher (emoji ou SVG) */
    icon: React.ReactNode;
    /** Label pour l'accessibilité */
    ariaLabel: string;
    /** Indique si le bouton est actif (sélectionné) */
    isActive?: boolean;
    /** Indique si le bouton est désactivé */
    isDisabled?: boolean;
    /** Callback au clic */
    onClick: () => void;
    /** Taille du bouton (défaut: 'md') */
    size?: 'sm' | 'md' | 'lg';
    /** Couleur d'accent pour l'état actif */
    activeColor?: string;
}

// ============================================================================
// CONSTANTES
// ============================================================================

const SIZE_CLASSES = {
    sm: 'w-9 h-9 text-lg',
    md: 'w-11 h-11 text-xl',
    lg: 'w-14 h-14 text-2xl',
} as const;

// ============================================================================
// COMPOSANT
// ============================================================================

/**
 * Bouton d'outil avec animation et accessibilité.
 *
 * @example
 * ```tsx
 * <ToolButton
 *   icon="🖌️"
 *   ariaLabel="Pinceau"
 *   isActive={currentTool === 'brush'}
 *   onClick={() => setTool('brush')}
 * />
 * ```
 */
export const ToolButton = memo(function ToolButton({
    icon,
    ariaLabel,
    isActive = false,
    isDisabled = false,
    onClick,
    size = 'md',
    activeColor = 'var(--brand-accent, #00D9FF)',
}: ToolButtonProps) {
    return (
        <motion.button
            type="button"
            aria-label={ariaLabel}
            aria-pressed={isActive}
            disabled={isDisabled}
            onClick={onClick}
            className={`
                ${SIZE_CLASSES[size]}
                flex items-center justify-center
                rounded-xl
                transition-colors duration-150
                ${isActive
                    ? 'bg-white/20 shadow-lg'
                    : 'bg-white/5 hover:bg-white/10'
                }
                ${isDisabled
                    ? 'opacity-40 cursor-not-allowed'
                    : 'cursor-pointer'
                }
            `}
            style={{
                boxShadow: isActive ? `0 0 12px ${activeColor}40` : undefined,
                border: isActive ? `2px solid ${activeColor}` : '2px solid transparent',
            }}
            whileTap={!isDisabled ? { scale: 0.92 } : undefined}
            whileHover={!isDisabled ? { scale: 1.05 } : undefined}
        >
            {icon}
        </motion.button>
    );
});
