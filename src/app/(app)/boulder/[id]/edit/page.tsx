'use client';

import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { EditorView } from '@/features/editor/components/EditorView';
import { useParams, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function EditorPage() {
    // Next.js 15 Client Component params handling
    const params = useParams();
    const searchParams = useSearchParams();

    const [isReady, setIsReady] = useState(false);
    const boulderId = params.id as string;
    const betaId = searchParams.get('betaId');

    useEffect(() => {
        if (boulderId && betaId) {
            setIsReady(true);
        }
    }, [boulderId, betaId]);

    if (!isReady || !betaId) {
        return <LoadingScreen message="Initialisation de l'éditeur..." />;
    }

    return <EditorView betaId={betaId} />;
}
