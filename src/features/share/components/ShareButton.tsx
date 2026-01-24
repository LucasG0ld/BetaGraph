'use client';

import { Button } from '@/components/ui/button';
import { useToastStore } from '@/features/shared/store/useToastStore';
import { Share2 } from 'lucide-react';
import { useState } from 'react';

interface ShareButtonProps {
    title: string;
    text: string;
}

/**
 * Bouton de partage avec support Web Share API + Clipboard fallback.
 */
export function ShareButton({ title, text }: ShareButtonProps) {
    const addToast = useToastStore((s) => s.addToast);
    const [isLoading, setIsLoading] = useState(false);

    const handleShare = async () => {
        setIsLoading(true);
        const url = window.location.href;

        try {
            // 1. Essayer la Web Share API (Mobile natif)
            if (navigator.share) {
                await navigator.share({
                    title,
                    text,
                    url,
                });
                // Pas besoin de toast si le share natif a réussi (souvent silencieux)
            } else {
                // 2. Fallback Clipboard
                await navigator.clipboard.writeText(url);
                addToast('Lien copié dans le presse-papier !', 'success');
            }
        } catch (error) {
            // Ignorer l'erreur d'annulation utilisateur (AbortError)
            if (error instanceof Error && error.name !== 'AbortError') {
                console.error('Share failed:', error);
                addToast('Impossible de partager', 'error');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            onClick={handleShare}
            disabled={isLoading}
            variant="ghost"
            size="sm"
            className="text-brand-accent-cyan hover:bg-brand-accent-cyan/10 hover:text-brand-accent-cyan"
        >
            <Share2 className="h-5 w-5 mr-2" />
            <span className="font-medium">Partager</span>
        </Button>
    );
}
