'use client';

import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { Button } from '@/components/ui/button';
import { ConflictResolutionModal } from '@/features/boulder/components/ConflictResolutionModal';
import { useLoadBeta } from '@/features/boulder/hooks/useLoadBeta';
import { CanvasToolbar } from '@/features/canvas/components/CanvasToolbar';
import { DrawingCanvas } from '@/features/canvas/components/DrawingCanvas';
import { useAutoSave } from '@/features/canvas/hooks/useAutoSave';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { generateBetaThumbnail } from '@/features/share/utils/generate-thumbnail';
import { publishBeta } from '@/features/boulder/actions/publish-beta';
import { EditorToolbar } from './EditorToolbar';
import { useToastStore } from '@/features/shared/store/useToastStore';
import type Konva from 'konva';

// ... imports ...

interface EditorViewProps {
    betaId: string;
}

export function EditorView({ betaId }: Omit<EditorViewProps, 'boulderId'>) {
    const router = useRouter();
    const addToast = useToastStore((s) => s.addToast);

    // Canvas Ref for Thumbnail Generation
    const stageRef = useRef<Konva.Stage>(null);

    // 1. Hooks d'orchestration
    const {
        isLoading,
        error: loadError,
        data: betaData,
        serverData,
    } = useLoadBeta(betaId);

    const {
        saveStatus,
        errorMessage: saveError,
    } = useAutoSave(betaId);

    // 2. Gestion des conflits (Fusion des sources)
    const [showConflictModal, setShowConflictModal] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);

    useEffect(() => {
        // Conflit au chargement (useLoadBeta) OU à la sauvegarde (useAutoSave)
        if (serverData || saveStatus === 'conflict') {
            setShowConflictModal(true);
        }
    }, [serverData, saveStatus]);

    // --- PUBLISH ACTION ---
    const handlePublish = async () => {
        if (!stageRef.current || !betaData?.boulder || !imageDims) return;

        try {
            setIsPublishing(true);

            // 1. Capture & Upload
            const thumbnailUrl = await generateBetaThumbnail(
                stageRef.current,
                betaId,
                imageDims
            );

            // 2. Server Action
            const result = await publishBeta(betaId, thumbnailUrl);

            if (result.error) {
                addToast(result.error || 'Erreur de publication', 'error');
            } else {
                addToast('Votre beta est maintenant visible publiquement.', 'success');
            }
        } catch (error) {
            console.error('Publish error:', error);
            addToast('Impossible de générer la miniature ou de publier.', 'error');
        } finally {
            setIsPublishing(false);
        }
    };

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
            {/* --- HEADER TOOLBAR --- */}
            <EditorToolbar
                saveStatus={saveStatus}
                saveError={saveError}
                isPublishing={isPublishing}
                onPublish={handlePublish}
            // isPublic={betaData.is_public} // Si on avait acces a is_public dans betaData
            />

            {/* --- DRAWING CANVAS (Middle / Full) --- */}
            <div className="relative flex-1 bg-brand-gray-900">
                {imageDims && (
                    <DrawingCanvas
                        ref={stageRef}
                        imageUrl={betaData.boulder.image_url}
                        imageWidth={imageDims.width}
                        imageHeight={imageDims.height}
                        className="w-full h-full"
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
