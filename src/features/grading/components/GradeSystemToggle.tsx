'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { type GradeSystem } from '../constants/grades';

interface GradeSystemToggleProps {
    /** Système actuellement sélectionné */
    value: GradeSystem;
    /** Callback appelé lors du changement */
    onChange: (system: GradeSystem) => void;
    /** Désactiver le toggle */
    disabled?: boolean;
    /** Classes CSS supplémentaires */
    className?: string;
    /** Taille du composant */
    size?: 'sm' | 'md';
}

/**
 * Toggle animé pour basculer entre Fontainebleau et V-Scale.
 * 
 * @description
 * Design High-Tech Lab avec animation Framer Motion.
 * Bordure cyan sur l'option sélectionnée.
 * 
 * @example
 * ```tsx
 * <GradeSystemToggle
 *   value={system}
 *   onChange={setSystem}
 * />
 * ```
 */
export function GradeSystemToggle({
    value,
    onChange,
    disabled = false,
    className,
    size = 'md',
}: GradeSystemToggleProps) {
    const systems: { value: GradeSystem; label: string; shortLabel: string }[] = [
        { value: 'fontainebleau', label: 'Fontainebleau', shortLabel: 'FB' },
        { value: 'v_scale', label: 'V-Scale', shortLabel: 'V' },
    ];

    const sizeStyles = {
        sm: 'text-xs px-2 py-1',
        md: 'text-sm px-3 py-1.5',
    };

    return (
        <div
            className={cn(
                'relative inline-flex rounded-lg bg-brand-gray-800 p-1',
                disabled && 'opacity-50 cursor-not-allowed',
                className
            )}
            role="radiogroup"
            aria-label="Système de cotation"
        >
            {systems.map((system) => {
                const isSelected = value === system.value;

                return (
                    <button
                        key={system.value}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        aria-label={system.label}
                        disabled={disabled}
                        onClick={() => onChange(system.value)}
                        className={cn(
                            'relative z-10 rounded-md font-medium transition-colors',
                            sizeStyles[size],
                            isSelected
                                ? 'text-brand-black'
                                : 'text-brand-gray-400 hover:text-white'
                        )}
                    >
                        {/* Background animé */}
                        {isSelected && (
                            <motion.div
                                layoutId="gradeSystemToggle"
                                className="absolute inset-0 rounded-md bg-brand-accent-cyan"
                                initial={false}
                                transition={{
                                    type: 'spring',
                                    stiffness: 500,
                                    damping: 30,
                                }}
                            />
                        )}
                        <span className="relative z-10">
                            {/* Afficher label court sur mobile, long sur desktop */}
                            <span className="sm:hidden">{system.shortLabel}</span>
                            <span className="hidden sm:inline">{system.label}</span>
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
