'use client';

import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { DrawingCanvas } from '@/features/canvas/components/DrawingCanvas';
import { useCanvasStore } from '@/features/canvas/store/canvasStore';
import { GradeDisplay } from '@/features/grading/components/GradeDisplay';
import { ShareButton } from '@/features/share/components/ShareButton';
import type { Database } from '@/lib/supabase/database.types';
import type { DrawingData } from '@/lib/schemas/drawing.schema';
import { MapPin, User } from 'lucide-react';
import { useEffect, useState } from 'react';

type Beta = Database['public']['Tables']['betas']['Row'];
type Boulder = Database['public']['Tables']['boulders']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

interface PublicViewerProps {
    beta: Beta & {
        boulder: Boulder | null;
        user: Profile | null;
    };
}

/**
 * Visionneuse publique pour une Beta.
 * Charge les données dans le store Canvas en mode lecture seule.
 */
export function PublicViewer({ beta }: PublicViewerProps) {
    const loadDrawingData = useCanvasStore((s) => s.loadDrawingData);

    // État pour la taille de l'image
    const [imageDims, setImageDims] = useState<{ width: number; height: number } | null>(null);

    // Initialisation
    useEffect(() => {
        // Charger les données de dessin
        if (beta.drawing_data) {
            // Cast sécurisé car validé par Zod à l'entrée
            loadDrawingData(beta.drawing_data as unknown as DrawingData);
        }

        // Charger l'image pour obtenir les dimensions
        if (beta.boulder?.image_url) {
            const img = new Image();
            img.src = beta.boulder.image_url;
            img.onload = () => {
                setImageDims({ width: img.naturalWidth, height: img.naturalHeight });
            };
        }
    }, [beta, loadDrawingData]);

    if (!beta.boulder?.image_url || !imageDims) {
        return <LoadingScreen message="Chargement de la beta..." />;
    }

    return (
        <div className="relative flex-1 flex flex-col h-full bg-brand-gray-900">
            {/* Header Info (Overlay) */}
            <div className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-brand-black/90 to-transparent pointer-events-none">
                <div className="container mx-auto max-w-4xl flex items-start justify-between pointer-events-auto">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-white tracking-tight">
                                {beta.boulder.name}
                            </h1>
                            <GradeDisplay
                                value={beta.grade_value}
                                system={beta.grade_system}
                                className="text-lg"
                            />
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-brand-gray-400">
                            {beta.boulder.location && (
                                <div className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4" />
                                    <span>{beta.boulder.location}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                <span>Proposé par <span className="text-brand-accent-cyan">{beta.user?.username || 'Anonyme'}</span></span>
                            </div>
                        </div>
                    </div>

                    <ShareButton
                        title={`Beta pour ${beta.boulder.name}`}
                        text={`Découvre ma beta pour ${beta.boulder.name} (${beta.grade_value}) sur BetaGraph !`}
                    />
                </div>
            </div>

            {/* Canvas Read-Only */}
            <div className="flex-1 w-full relative">
                <DrawingCanvas
                    imageUrl={beta.boulder.image_url}
                    imageWidth={imageDims.width}
                    imageHeight={imageDims.height}
                    className="w-full h-full"
                    readonly={true}
                />
            </div>
        </div>
    );
}
