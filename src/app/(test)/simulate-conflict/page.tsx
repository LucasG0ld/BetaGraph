'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { forceUpdateBeta } from '@/features/boulder/actions/test-actions';
import { Button } from '@/components/ui/button';

function SimulateConflictContent() {
    const searchParams = useSearchParams();
    const initialBetaId = searchParams.get('betaId') || '';

    const [betaId, setBetaId] = useState(initialBetaId);
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSimulate = async () => {
        if (!betaId) return;

        setStatus('loading');
        try {
            const result = await forceUpdateBeta(betaId);
            if (result.success) {
                setStatus('success');
                setMessage(`Mise à jour réussie ! Nouveau timestamp: ${result.updatedAt}`);
            } else {
                setStatus('error');
                setMessage(`Erreur: ${result.error}`);
            }
        } catch (err) {
            setStatus('error');
            setMessage('Erreur inattendue');
        }
    };

    return (
        <div className="p-8 max-w-md mx-auto bg-brand-gray-900 min-h-screen text-white">
            <h1 className="text-2xl font-bold mb-6 text-brand-accent-cyan">
                💥 Simulation de Conflit
            </h1>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm mb-2 text-brand-gray-400">Beta UUID</label>
                    <input
                        type="text"
                        value={betaId}
                        onChange={(e) => setBetaId(e.target.value)}
                        className="w-full bg-brand-black border border-brand-gray-700 p-2 rounded text-white font-mono"
                        placeholder="Ex: c18e770f-..."
                    />
                </div>

                <Button
                    onClick={handleSimulate}
                    isLoading={status === 'loading'}
                    className="w-full"
                    variant="danger"
                >
                    Forcer Mise à jour Serveur
                </Button>

                {message && (
                    <div className={`p-4 rounded ${status === 'success' ? 'bg-green-900/50 text-green-200' : 'bg-red-900/50 text-red-200'}`}>
                        {message}
                    </div>
                )}

                <div className="mt-8 text-sm text-brand-gray-500">
                    <h3 className="font-bold mb-2">Instructions de Test :</h3>
                    <ol className="list-decimal pl-4 space-y-2">
                        <li>Ouvrez une Beta dans le Canvas (nouvel onglet)</li>
                        <li>Copiez l'ID de la Beta ici</li>
                        <li>Faites une modification LOCALE dans le Canvas (dessinez quelque chose)</li>
                        <li>Cliquez sur le bouton ci-dessus pour simuler une modif concurrente</li>
                        <li>Retournez sur le Canvas et <strong>Rafraîchissez la page</strong></li>
                        <li>La modale de conflit devrait apparaître</li>
                    </ol>
                </div>
            </div>
        </div>
    );
}

export default function SimulateConflictPage() {
    return (
        <Suspense fallback={<div>Chargement...</div>}>
            <SimulateConflictContent />
        </Suspense>
    );
}
