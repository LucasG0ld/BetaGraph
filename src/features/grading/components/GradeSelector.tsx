'use client';

import { useState, useCallback, useId } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { type GradeSystem, FONTAINEBLEAU_GRADES, V_SCALE_GRADES } from '../constants/grades';
import { GradeSystemToggle } from './GradeSystemToggle';

interface GradeSelectorProps {
    /** Valeur actuelle du grade */
    value?: string;
    /** Système actuel */
    system?: GradeSystem;
    /** Callback appelé lors du changement */
    onChange: (value: string, system: GradeSystem) => void;
    /** Erreur de validation */
    error?: string;
    /** Désactiver le sélecteur */
    disabled?: boolean;
    /** Classes CSS supplémentaires pour le conteneur */
    className?: string;
    /** Label pour l'accessibilité */
    label?: string;
    /** Afficher le toggle de système */
    showSystemToggle?: boolean;
}

/**
 * Sélecteur de cotation en grille 4 colonnes.
 * 
 * @description
 * - Compatible react-hook-form via `onChange`
 * - Toggle FB/V-Scale intégré
 * - Grille scrollable pour mobile
 * - Design High-Tech Lab avec bordure cyan sur sélection
 * 
 * @example
 * ```tsx
 * // Standalone
 * <GradeSelector
 *   value={grade}
 *   system={system}
 *   onChange={(val, sys) => {
 *     setGrade(val);
 *     setSystem(sys);
 *   }}
 * />
 * 
 * // Avec react-hook-form (Controller)
 * <Controller
 *   name="grade"
 *   control={control}
 *   render={({ field }) => (
 *     <GradeSelector
 *       value={field.value?.value}
 *       system={field.value?.system}
 *       onChange={(val, sys) => field.onChange({ value: val, system: sys })}
 *     />
 *   )}
 * />
 * ```
 */
export function GradeSelector({
    value,
    system = 'fontainebleau',
    onChange,
    error,
    disabled = false,
    className,
    label = 'Cotation',
    showSystemToggle = true,
}: GradeSelectorProps) {
    const [currentSystem, setCurrentSystem] = useState<GradeSystem>(system);
    const labelId = useId();

    // Grades selon le système actif
    const grades = currentSystem === 'fontainebleau'
        ? FONTAINEBLEAU_GRADES
        : V_SCALE_GRADES;

    // Gérer le changement de système
    const handleSystemChange = useCallback((newSystem: GradeSystem) => {
        setCurrentSystem(newSystem);
        // Réinitialiser la valeur si le système change
        // (le grade actuel n'est peut-être pas valide dans le nouveau système)
    }, []);

    // Gérer la sélection de grade
    const handleGradeSelect = useCallback((grade: string) => {
        onChange(grade, currentSystem);
    }, [currentSystem, onChange]);

    return (
        <div className={cn('space-y-3', className)}>
            {/* Header avec label et toggle */}
            <div className="flex items-center justify-between">
                <label
                    id={labelId}
                    className="text-sm font-medium text-brand-gray-300"
                >
                    {label}
                </label>

                {showSystemToggle && (
                    <GradeSystemToggle
                        value={currentSystem}
                        onChange={handleSystemChange}
                        disabled={disabled}
                        size="sm"
                    />
                )}
            </div>

            {/* Grille de grades */}
            <div
                role="listbox"
                aria-labelledby={labelId}
                aria-activedescendant={value ? `grade-${value}` : undefined}
                className={cn(
                    'grid grid-cols-4 gap-2 max-h-64 overflow-y-auto p-2 rounded-lg',
                    'bg-brand-gray-800/50 border border-brand-gray-700',
                    disabled && 'opacity-50 pointer-events-none'
                )}
            >
                {(grades as readonly string[]).map((grade) => {
                    const isSelected = value === grade;

                    return (
                        <motion.button
                            key={grade}
                            id={`grade-${grade}`}
                            type="button"
                            role="option"
                            aria-selected={isSelected}
                            disabled={disabled}
                            onClick={() => handleGradeSelect(grade)}
                            whileTap={{ scale: 0.95 }}
                            className={cn(
                                'relative px-2 py-2.5 rounded-md font-mono font-semibold text-sm',
                                'transition-all duration-150 focus:outline-none',
                                'min-h-[44px] min-w-[44px]', // Touch target WCAG
                                isSelected
                                    ? 'bg-brand-accent-cyan/20 text-brand-accent-cyan border-2 border-brand-accent-cyan'
                                    : 'bg-brand-gray-700/50 text-white border-2 border-transparent hover:bg-brand-gray-600/50 hover:border-brand-gray-500'
                            )}
                        >
                            {/* Indicateur de sélection */}
                            {isSelected && (
                                <motion.div
                                    layoutId="gradeSelection"
                                    className="absolute inset-0 rounded-md bg-brand-accent-cyan/10"
                                    initial={false}
                                    transition={{
                                        type: 'spring',
                                        stiffness: 400,
                                        damping: 25,
                                    }}
                                />
                            )}
                            <span className="relative z-10">{grade}</span>
                        </motion.button>
                    );
                })}
            </div>

            {/* Valeur sélectionnée */}
            {value && (
                <div className="flex items-center gap-2 text-sm">
                    <span className="text-brand-gray-400">Sélection :</span>
                    <span className="font-mono font-bold text-brand-accent-cyan">
                        {value}
                    </span>
                    <span className="text-brand-gray-500">
                        ({currentSystem === 'fontainebleau' ? 'Fontainebleau' : 'V-Scale'})
                    </span>
                </div>
            )}

            {/* Message d'erreur */}
            {error && (
                <p className="text-sm text-red-400" role="alert">
                    {error}
                </p>
            )}
        </div>
    );
}

/**
 * Version compacte du sélecteur (dropdown style).
 * Pour les formulaires avec peu d'espace.
 */
interface GradeSelectorCompactProps {
    value?: string;
    system?: GradeSystem;
    onChange: (value: string, system: GradeSystem) => void;
    disabled?: boolean;
    className?: string;
}

export function GradeSelectorCompact({
    value,
    system = 'fontainebleau',
    onChange,
    disabled = false,
    className,
}: GradeSelectorCompactProps) {
    const grades = system === 'fontainebleau'
        ? FONTAINEBLEAU_GRADES
        : V_SCALE_GRADES;

    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value, system)}
            disabled={disabled}
            aria-label="Sélectionner une cotation"
            className={cn(
                'w-full px-3 py-2 rounded-lg font-mono font-semibold',
                'bg-brand-gray-800 border border-brand-gray-700 text-white',
                'focus:outline-none focus:ring-2 focus:ring-brand-accent-cyan focus:border-transparent',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                className
            )}
        >
            <option value="" disabled>
                Choisir...
            </option>
            {(grades as readonly string[]).map((grade) => (
                <option key={grade} value={grade}>
                    {grade}
                </option>
            ))}
        </select>
    );
}
