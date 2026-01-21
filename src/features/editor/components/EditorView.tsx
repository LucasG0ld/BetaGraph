'use client';

import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { Button } from '@/components/ui/button';
import { ConflictResolutionModal } from '@/features/boulder/components/ConflictResolutionModal';
import { useLoadBeta } from '@/features/boulder/hooks/useLoadBeta';
import { CanvasToolbar } from '@/features/canvas/components/CanvasToolbar';
import { DrawingCanvas } from '@/features/canvas/components/DrawingCanvas';
import { SaveIndicator } from '@/features/canvas/components/SaveIndicator';
import { useAutoSave } from '@/features/canvas/hooks/useAutoSave';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface EditorViewProps {
    boulderId: string;
    betaId: string;
}

export function EditorView({ boulderId, betaId }: EditorViewProps) {
    const router = useRouter();

    // 1. Hooks d'orchestration
    const {
        isLoading,
        error: loadError,
        data: betaData,
        serverData,
        hasLocalUnsavedChanges,
    } = useLoadBeta(betaId);

    const {
        saveStatus,
        errorMessage: saveError,
        forceSave,
    } = useAutoSave(betaId);

    // 2. Gestion des conflits (Fusion des sources)
    const [showConflictModal, setShowConflictModal] = useState(false);

    useEffect(() => {
        // Conflit au chargement (useLoadBeta) OU à la sauvegarde (useAutoSave)
        if (serverData || saveStatus === 'conflict') {
            setShowConflictModal(true);
        }
    }, [serverData, saveStatus]);

    // --- IMAGE LOADING & DIMENSIONS ---
    const [imageDims, setImageDims] = useState<{ width: number; height: number } | null>(null);

    useEffect(() => {
        if (betaData?.boulder?.image_url) {
            const img = new Image();
            img.src = betaData.boulder.image_url;
            img.onload = () => {
                setImageDims({ width: img.naturalWidth, height: img.naturalHeight });
            };
        }
    }, [betaData?.boulder?.image_url]);

    // 3. Loading State
    if (isLoading || (betaData?.boulder?.image_url && !imageDims)) {
        return <LoadingScreen message="Chargement du bloc..." />;
    }

    // 4. Error State (Fatal)
    if (loadError || !betaData?.boulder) {
        return (
            <div className="flex h-screen w-screen flex-col items-center justify-center bg-brand-black text-white p-4 text-center">
                <h2 className="text-xl font-bold text-red-500 mb-2">
                    Erreur de chargement
                </h2>
                <p className="text-brand-gray-400 mb-6">{loadError || "Données du bloc manquantes"}</p>
                <Button
                    variant="secondary"
                    onClick={() => router.push('/dashboard')}
                >
                    Retour au tableau de bord
                </Button>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex h-full w-full flex-col overflow-hidden bg-brand-black touch-none">
            {/* --- HEADER OVERLAY (Top) --- */}
            <div className="absolute top-0 left-0 right-0 z-20 flex items-start justify-between p-4 pointer-events-none">
                {/* Back Button */}
                <Link href="/dashboard" className="pointer-events-auto">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="bg-brand-black/50 backdrop-blur-md border border-brand-gray-700/50 hover:border-brand-accent-cyan/50 text-white rounded-full pr-4 pl-3"
                    >
                        <ChevronLeft className="h-5 w-5 mr-1" />
                        <span className="text-sm font-medium hidden sm:inline">
                            Retour
                        </span>
                    </Button>
                </Link>

                {/* Save Indicator */}
                <div className="pointer-events-auto">
                    <SaveIndicator status={saveStatus} />
                    {saveError && (
                        <p className="text-xs text-red-400 mt-1 text-right bg-black/50 px-2 py-1 rounded">
                            {saveError}
                        </p>
                    )}
                </div>
            </div>

            {/* --- DRAWING CANVAS (Middle / Full) --- */}
            <div className="relative flex-1 bg-brand-gray-900">
                {imageDims && (
                    <DrawingCanvas
                        imageUrl={betaData.boulder.image_url}
                        imageWidth={imageDims.width}
                        imageHeight={imageDims.height}
                    />
                )}
            </div>

            {/* --- TOOLBAR (Bottom / Overlay) --- */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                <div className="pointer-events-auto">
                    <CanvasToolbar />
                </div>
            </div>

            {/* --- MODALS --- */}
            {showConflictModal && serverData && (
                <ConflictResolutionModal
                    localData={betaData}
                    serverData={serverData}
                    onResolve={() => {
                        setShowConflictModal(false);
                    }}
                />
            )}
        </div>
    );
}
