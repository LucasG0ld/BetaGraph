import { type SaveStatus } from '../hooks/useAutoSave';

/**
 * Props du composant SaveIndicator.
 */
export interface SaveIndicatorProps {
    /** Statut actuel de la sauvegarde */
    status: SaveStatus;
    /** Classe CSS additionnelle (optionnel) */
    className?: string;
}

/**
 * Indicateur visuel de l'état de sauvegarde automatique.
 *
 * @description
 * Affiche une icône et un label selon le statut :
 * - **idle** : Rien (masqué)
 * - **saving** : Spinner + "Sauvegarde..."
 * - **saved** : Checkmark vert + "Sauvegardé"
 * - **error** : Croix rouge + "Erreur"
 * - **conflict** : Alerte jaune + "Conflit"
 *
 * Design :
 * - Position fixe en bas à droite (ou selon className)
 * - Animation fade-in/fade-out
 * - Icônes SVG inline (pas de dépendance externe)
 *
 * @example
 * ```typescript
 * function CanvasEditor() {
 *   const { saveStatus } = useAutoSave(betaId);
 *   return <SaveIndicator status={saveStatus} />;
 * }
 * ```
 */
export function SaveIndicator({ status, className = '' }: SaveIndicatorProps) {
    // Ne rien afficher si idle
    if (status === 'idle') {
        return null;
    }

    // Configuration selon le statut
    const config = getStatusConfig(status);

    return (
        <div
            className={`
                fixed bottom-4 right-4 z-50
                flex items-center gap-2
                px-4 py-2 rounded-lg shadow-lg
                ${config.bgColor} ${config.textColor}
                animate-fade-in
                ${className}
            `}
            role="status"
            aria-live="polite"
            aria-label={config.label}
        >
            {/* Icône */}
            <div className="flex-shrink-0">{config.icon}</div>

            {/* Label */}
            <span className="text-sm font-medium">{config.label}</span>
        </div>
    );
}

/**
 * Configuration visuelle selon le statut.
 */
function getStatusConfig(status: SaveStatus) {
    switch (status) {
        case 'saving':
            return {
                icon: <SpinnerIcon />,
                label: 'Sauvegarde...',
                bgColor: 'bg-blue-500 dark:bg-blue-600',
                textColor: 'text-white',
            };

        case 'saved':
            return {
                icon: <CheckIcon />,
                label: 'Sauvegardé',
                bgColor: 'bg-green-500 dark:bg-green-600',
                textColor: 'text-white',
            };

        case 'error':
            return {
                icon: <ErrorIcon />,
                label: 'Erreur de sauvegarde',
                bgColor: 'bg-red-500 dark:bg-red-600',
                textColor: 'text-white',
            };

        case 'conflict':
            return {
                icon: <AlertIcon />,
                label: 'Conflit détecté',
                bgColor: 'bg-yellow-500 dark:bg-yellow-600',
                textColor: 'text-white',
            };

        default:
            return {
                icon: null,
                label: '',
                bgColor: 'bg-gray-500',
                textColor: 'text-white',
            };
    }
}

// ============================================================================
// ICÔNES SVG
// ============================================================================

/**
 * Icône spinner (animation rotation).
 */
function SpinnerIcon() {
    return (
        <svg
            className="animate-spin h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
            <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
            ></circle>
            <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
        </svg>
    );
}

/**
 * Icône checkmark (validation).
 */
function CheckIcon() {
    return (
        <svg
            className="h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
        >
            <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
            />
        </svg>
    );
}

/**
 * Icône erreur (croix).
 */
function ErrorIcon() {
    return (
        <svg
            className="h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
        >
            <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
            />
        </svg>
    );
}

/**
 * Icône alerte (triangle avec point d'exclamation).
 */
function AlertIcon() {
    return (
        <svg
            className="h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
        >
            <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
            />
        </svg>
    );
}
