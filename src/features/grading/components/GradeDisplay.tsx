'use client';

import { cn } from '@/lib/utils';
import { type GradeSystem } from '../constants/grades';
import { convertGrade } from '../utils/grade-converter';
import { usePreferredSystem, useHasHydrated } from '../store/useGradingStore';

interface GradeDisplayProps {
    /** Valeur du grade (ex: "7A", "V5") */
    value: string;
    /** Système d'origine du grade */
    system: GradeSystem;
    /** Afficher toujours le grade original (ignorer la préférence) */
    forceOriginal?: boolean;
    /** Classes CSS supplémentaires */
    className?: string;
    /** Taille du texte */
    size?: 'sm' | 'md' | 'lg';
    /** Afficher le badge du système */
    showSystemBadge?: boolean;
}

/**
 * Affiche un grade avec conversion automatique selon la préférence utilisateur.
 * 
 * @description
 * - Compare le système d'origine avec le système préféré
 * - Si différent, convertit et affiche avec un `~` pour indiquer l'approximation
 * - Design High-Tech Lab : `font-mono`, badge discret
 * 
 * @example
 * ```tsx
 * // Grade affiché selon préférence utilisateur
 * <GradeDisplay value="7A" system="fontainebleau" />
 * // → "7A" si préférence FB, ou "~V6" si préférence V-Scale
 * 
 * // Forcer l'affichage original
 * <GradeDisplay value="7A" system="fontainebleau" forceOriginal />
 * // → "7A" toujours
 * ```
 */
export function GradeDisplay({
    value,
    system,
    forceOriginal = false,
    className,
    size = 'md',
    showSystemBadge = false,
}: GradeDisplayProps) {
    const preferredSystem = usePreferredSystem();
    const hasHydrated = useHasHydrated();

    // Pendant l'hydration, afficher le grade original pour éviter le mismatch
    if (!hasHydrated) {
        return (
            <GradeDisplayContent
                displayValue={value}
                isConverted={false}
                isApproximate={false}
                originalValue={value}
                originalSystem={system}
                className={className}
                size={size}
                showSystemBadge={showSystemBadge}
            />
        );
    }

    // Pas de conversion si même système ou forcé
    if (forceOriginal || system === preferredSystem) {
        return (
            <GradeDisplayContent
                displayValue={value}
                isConverted={false}
                isApproximate={false}
                originalValue={value}
                originalSystem={system}
                className={className}
                size={size}
                showSystemBadge={showSystemBadge}
            />
        );
    }

    // Conversion vers le système préféré
    try {
        const { value: convertedValue, isApproximate } = convertGrade(
            value,
            system,
            preferredSystem
        );

        return (
            <GradeDisplayContent
                displayValue={convertedValue}
                isConverted={true}
                isApproximate={isApproximate}
                originalValue={value}
                originalSystem={system}
                className={className}
                size={size}
                showSystemBadge={showSystemBadge}
            />
        );
    } catch {
        // Fallback si conversion échoue
        return (
            <GradeDisplayContent
                displayValue={value}
                isConverted={false}
                isApproximate={false}
                originalValue={value}
                originalSystem={system}
                className={className}
                size={size}
                showSystemBadge={showSystemBadge}
            />
        );
    }
}

/**
 * Composant interne pour le rendu du grade.
 */
interface GradeDisplayContentProps {
    displayValue: string;
    isConverted: boolean;
    isApproximate: boolean;
    originalValue: string;
    originalSystem: GradeSystem;
    className?: string;
    size: 'sm' | 'md' | 'lg';
    showSystemBadge: boolean;
}

function GradeDisplayContent({
    displayValue,
    isConverted,
    isApproximate,
    originalValue,
    originalSystem,
    className,
    size,
    showSystemBadge,
}: GradeDisplayContentProps) {
    const sizeStyles = {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg',
    };

    const badgeStyles = {
        sm: 'text-[10px] px-1',
        md: 'text-xs px-1.5',
        lg: 'text-xs px-2',
    };

    const systemLabel = originalSystem === 'fontainebleau' ? 'FB' : 'V';

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 font-mono font-semibold',
                sizeStyles[size],
                className
            )}
            title={
                isConverted
                    ? `Original: ${originalValue} (${originalSystem === 'fontainebleau' ? 'Fontainebleau' : 'V-Scale'})`
                    : undefined
            }
        >
            {/* Préfixe approximation (seulement si conversion approximative) */}
            {isConverted && isApproximate && (
                <span className="text-brand-gray-400">~</span>
            )}

            {/* Valeur du grade */}
            <span className={cn(
                isConverted ? 'text-brand-accent-cyan' : 'text-white'
            )}>
                {displayValue}
            </span>

            {/* Badge système optionnel */}
            {showSystemBadge && (
                <span
                    className={cn(
                        'rounded bg-brand-gray-700 text-brand-gray-400 font-normal',
                        badgeStyles[size]
                    )}
                >
                    {systemLabel}
                </span>
            )}
        </span>
    );
}
