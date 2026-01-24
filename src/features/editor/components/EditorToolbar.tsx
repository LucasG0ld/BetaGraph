'use client';

import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { SaveIndicator } from '@/features/canvas/components/SaveIndicator';
import { type SaveStatus } from '@/features/canvas/hooks/useAutoSave';
import { ChevronLeft, Share2 } from 'lucide-react';
import Link from 'next/link';

interface EditorToolbarProps {
    saveStatus: SaveStatus;
    saveError?: string | null;
    isPublishing: boolean;
    onPublish: () => void;
    isPublic?: boolean; // Pour changer le texte "Publié" vs "Publier" éventuellement
}

/**
 * Barre d'outils supérieure de l'éditeur (Navigation, Sauvegarde, Publication).
 */
export function EditorToolbar({
    saveStatus,
    saveError,
    isPublishing,
    onPublish,
    isPublic = false,
}: EditorToolbarProps) {
    return (
        <div className="absolute top-0 left-0 right-0 z-20 flex items-start justify-between p-4 pointer-events-none">
            {/* Gauche: Retour */}
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

            {/* Droite: Actions */}
            <div className="flex items-center gap-3 pointer-events-auto">

                {/* Save Status & Error */}
                <div className="flex flex-col items-end">
                    <SaveIndicator status={saveStatus} />
                    {saveError && (
                        <p className="text-xs text-red-400 mt-1 text-right bg-black/50 px-2 py-1 rounded">
                            {saveError}
                        </p>
                    )}
                </div>

                {/* Publish Button */}
                <Button
                    onClick={onPublish}
                    disabled={isPublishing || saveStatus === 'saving'}
                    size="sm"
                    className={`
                        rounded-full px-4
                        ${isPublic
                            ? 'bg-brand-accent-green/20 text-brand-accent-green border-brand-accent-green/50 hover:bg-brand-accent-green/30'
                            : 'bg-brand-accent-cyan text-brand-black hover:bg-brand-accent-cyan/90 font-semibold'
                        }
                        backdrop-blur-md border border-transparent
                    `}
                >
                    {isPublishing ? (
                        <>
                            <LoadingSpinner className="h-4 w-4 mr-2 text-current" />
                            <span>Capture...</span>
                        </>
                    ) : (
                        <>
                            <Share2 className="h-4 w-4 mr-2" />
                            <span>{isPublic ? 'Mettre à jour' : 'Publier'}</span>
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
