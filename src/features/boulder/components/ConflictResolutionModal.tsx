'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { forceLoadServerData, type BetaData } from '../hooks/useLoadBeta';

/**
 * Props du composant ConflictResolutionModal.
 */
export interface ConflictResolutionModalProps {
    /** Données locales (actuellement dans le store) */
    localData: BetaData | null;
    /** Données serveur (plus récentes) */
    serverData: BetaData;
    /** Callback appelé quand l'utilisateur fait un choix */
    onResolve: (choice: 'local' | 'server') => void;
}

/**
 * Modal de résolution de conflit de synchronisation.
 *
 * @description
 * Affichée quand `useLoadBeta` détecte un conflit entre les données locales
 * et serveur. Présente les deux versions côte à côte avec des statistiques
 * (timestamp, nombre de lignes/formes) pour aider l'utilisateur à choisir.
 *
 * **UX** :
 * - Modal bloquante (pas d'annulation)
 * - Comparaison visuelle rapide (< 3s de décision)
 * - Boutons clairs : "Garder ma version" vs "Charger version Cloud"
 *
 * **Style** :
 * - High-Tech Lab (bordures cyan, fond dark)
 * - Animation Framer Motion (scale-up + fade-in)
 * - Two-column layout responsive
 *
 * @example
 * ```tsx
 * const { serverData, data } = useLoadBeta(betaId);
 *
 * if (serverData) {
 *   return (
 *     <ConflictResolutionModal
 *       localData={data}
 *       serverData={serverData}
 *       onResolve={(choice) => {
 *         if (choice === 'server') {
 *           // Server data loaded automatically
 *         } else {
 *           // Local kept, will be pushed on next save
 *         }
 *       }}
 *     />
 *   );
 * }
 * ```
 */
export function ConflictResolutionModal({
    localData,
    serverData,
    onResolve,
}: ConflictResolutionModalProps) {
    const [isResolving, setIsResolving] = useState(false);

    const handleKeepLocal = () => {
        setIsResolving(true);
        // Garder la version locale (ne rien faire, juste fermer)
        // useAutoSave poussera les données locales au prochain intervalle
        onResolve('local');
    };

    const handleLoadServer = () => {
        setIsResolving(true);
        // Charger la version serveur
        forceLoadServerData(serverData);
        onResolve('server');
    };

    // Calculer statistiques
    const localStats = localData
        ? {
            lines: localData.drawing_data.lines.length,
            shapes: localData.drawing_data.shapes.length,
            timestamp: localData.updated_at,
        }
        : { lines: 0, shapes: 0, timestamp: new Date().toISOString() };

    const serverStats = {
        lines: serverData.drawing_data.lines.length,
        shapes: serverData.drawing_data.shapes.length,
        timestamp: serverData.updated_at,
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Overlay sombre */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    aria-hidden="true"
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="relative z-10 w-full max-w-4xl"
                >
                    <div className="rounded-lg border-2 border-brand-accent-cyan bg-brand-gray-900 p-6 shadow-2xl">
                        {/* Header */}
                        <div className="mb-6 text-center">
                            <div className="mb-2 flex items-center justify-center gap-2">
                                <svg
                                    className="h-6 w-6 text-yellow-400"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                    />
                                </svg>
                                <h2 className="text-2xl font-bold text-white">
                                    Version plus récente détectée
                                </h2>
                            </div>
                            <p className="text-brand-gray-300">
                                Choisissez la version à conserver
                            </p>
                        </div>

                        {/* Comparison Grid */}
                        <div className="mb-6 grid gap-4 md:grid-cols-2">
                            {/* Version Locale */}
                            <div className="rounded-lg border-2 border-brand-accent-cyan/50 bg-brand-gray-800 p-4">
                                <div className="mb-3 flex items-center gap-2">
                                    <svg
                                        className="h-5 w-5 text-brand-accent-cyan"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                        />
                                    </svg>
                                    <h3 className="text-lg font-semibold text-brand-accent-cyan">
                                        💾 Votre version locale
                                    </h3>
                                </div>

                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-brand-gray-400">
                                            Modifiée :
                                        </span>
                                        <span className="font-medium text-white">
                                            {formatTimestamp(localStats.timestamp)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-brand-gray-400">Lignes :</span>
                                        <span className="font-medium text-brand-accent-cyan">
                                            {localStats.lines}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-brand-gray-400">Holds :</span>
                                        <span className="font-medium text-brand-accent-cyan">
                                            {localStats.shapes}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-4 rounded bg-brand-gray-700 p-3 text-xs text-brand-gray-300">
                                    <p className="mb-1 font-semibold">ℹ️ Garder cette version :</p>
                                    <p>
                                        Vos modifications seront envoyées au serveur lors de la
                                        prochaine sauvegarde automatique.
                                    </p>
                                </div>
                            </div>

                            {/* Version Serveur */}
                            <div className="rounded-lg border-2 border-brand-gray-500 bg-brand-gray-800 p-4">
                                <div className="mb-3 flex items-center gap-2">
                                    <svg
                                        className="h-5 w-5 text-brand-gray-400"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
                                        />
                                    </svg>
                                    <h3 className="text-lg font-semibold text-brand-gray-300">
                                        ☁️ Version Cloud
                                    </h3>
                                </div>

                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-brand-gray-400">
                                            Modifiée :
                                        </span>
                                        <span className="font-medium text-white">
                                            {formatTimestamp(serverStats.timestamp)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-brand-gray-400">Lignes :</span>
                                        <span className="font-medium text-brand-gray-300">
                                            {serverStats.lines}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-brand-gray-400">Holds :</span>
                                        <span className="font-medium text-brand-gray-300">
                                            {serverStats.shapes}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-4 rounded bg-brand-gray-700 p-3 text-xs text-brand-gray-300">
                                    <p className="mb-1 font-semibold">⚠️ Charger cette version :</p>
                                    <p>
                                        Vos modifications locales seront remplacées par cette
                                        version.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                            <Button
                                variant="primary"
                                size="lg"
                                onClick={handleKeepLocal}
                                disabled={isResolving}
                                isLoading={isResolving}
                                className="sm:min-w-[200px]"
                            >
                                ✅ Garder ma version
                            </Button>

                            <Button
                                variant="secondary"
                                size="lg"
                                onClick={handleLoadServer}
                                disabled={isResolving}
                                className="sm:min-w-[200px]"
                            >
                                ☁️ Charger version Cloud
                            </Button>
                        </div>

                        {/* Footer */}
                        <div className="mt-4 text-center text-xs text-brand-gray-500">
                            Cette action est nécessaire pour continuer. Vous ne pourrez pas dessiner
                            tant que le conflit n&apos;est pas résolu.
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

/**
 * Formate un timestamp ISO en format relatif lisible.
 */
function formatTimestamp(isoString: string): string {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;

    // Fallback: date formatée
    return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    });
}
