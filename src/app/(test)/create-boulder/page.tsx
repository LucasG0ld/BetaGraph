'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { createBoulderWithBeta } from '@/features/boulder/actions/create-boulder';

/**
 * Page de test - Création Boulder + Beta
 * 
 * Test Phase 5.1-5.2 : Schémas Zod et création atomique
 */
export default function CreateBoulderTestPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);

        const data = {
            boulder: {
                name: formData.get('name') as string,
                location: formData.get('location') as string,
                image_url: formData.get('image_url') as string,
            },
            beta: {
                grade_value: formData.get('grade_value') as string,
                grade_system: formData.get('grade_system') as 'fontainebleau' | 'v_scale',
                is_public: formData.get('is_public') === 'true',
            },
        };

        const result = await createBoulderWithBeta(data);

        if (result.success && result.data?.beta_id) {
            // Rediriger vers la page canvas avec le betaId (SANS /test/)
            router.push(`/canvas-phase5?betaId=${result.data.beta_id}`);
        } else if (result.success && !result.data?.beta_id) {
            setError('Boulder créé mais betaId manquant');
            setIsLoading(false);
        } else if (!result.success) {
            setError(result.error || 'Erreur inconnue');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-brand-gray-900 p-8">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">
                        🧪 Test Phase 5.1-5.2 : Création Boulder
                    </h1>
                    <p className="text-brand-gray-300">
                        Testez la création atomique boulder + beta avec validation Zod
                    </p>
                </div>

                {/* Formulaire */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Boulder Info */}
                    <div className="rounded-lg border-2 border-brand-accent-cyan bg-brand-gray-800 p-6">
                        <h2 className="text-xl font-semibold text-brand-accent-cyan mb-4">
                            📍 Informations Boulder
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-white mb-2">
                                    Nom du bloc *
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    defaultValue="Test Boulder Phase 5"
                                    className="w-full px-4 py-2 bg-brand-gray-700 border border-brand-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-accent-cyan"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-white mb-2">
                                    Localisation
                                </label>
                                <input
                                    type="text"
                                    name="location"
                                    defaultValue="Fontainebleau"
                                    className="w-full px-4 py-2 bg-brand-gray-700 border border-brand-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-accent-cyan"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-white mb-2">
                                    URL Image (HTTPS) *
                                </label>
                                <input
                                    type="url"
                                    name="image_url"
                                    defaultValue="https://images.unsplash.com/photo-1522163182402-834f871fd851?w=1200"
                                    className="w-full px-4 py-2 bg-brand-gray-700 border border-brand-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-accent-cyan"
                                    required
                                />
                                <p className="text-xs text-brand-gray-400 mt-1">
                                    Doit commencer par https://
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Beta Info */}
                    <div className="rounded-lg border-2 border-brand-gray-500 bg-brand-gray-800 p-6">
                        <h2 className="text-xl font-semibold text-white mb-4">
                            🎯 Cotation Beta
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-white mb-2">
                                    Système de cotation *
                                </label>
                                <select
                                    name="grade_system"
                                    className="w-full px-4 py-2 bg-brand-gray-700 border border-brand-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-accent-cyan"
                                    required
                                >
                                    <option value="fontainebleau">Fontainebleau</option>
                                    <option value="v_scale">V-Scale</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-white mb-2">
                                    Cotation *
                                </label>
                                <input
                                    type="text"
                                    name="grade_value"
                                    defaultValue="6B+"
                                    placeholder="Ex: 6B+, 7A, V4, V8"
                                    className="w-full px-4 py-2 bg-brand-gray-700 border border-brand-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-accent-cyan"
                                    required
                                />
                                <p className="text-xs text-brand-gray-400 mt-1">
                                    Fontainebleau: 3, 4, 5+, 6A, 6B+ ... | V-Scale: V0, V1, V10
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    name="is_public"
                                    value="true"
                                    className="w-4 h-4"
                                />
                                <label className="text-sm text-white">
                                    Rendre publique
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="rounded-lg border-2 border-red-500 bg-red-500/10 p-4">
                            <p className="text-red-400 font-semibold">❌ Erreur</p>
                            <p className="text-red-300 text-sm mt-1">{error}</p>
                        </div>
                    )}

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        disabled={isLoading}
                        isLoading={isLoading}
                        className="w-full"
                    >
                        {isLoading ? 'Création en cours...' : '✅ Créer Boulder + Beta'}
                    </Button>
                </form>

                {/* Test Cases */}
                <div className="mt-8 rounded-lg border border-brand-gray-600 bg-brand-gray-800 p-6">
                    <h3 className="text-lg font-semibold text-white mb-3">
                        🧪 Cas de Test
                    </h3>
                    <div className="space-y-2 text-sm text-brand-gray-300">
                        <p>✅ <strong>Valide</strong>: 6B+, 7A, V4, V10</p>
                        <p>❌ <strong>Invalide</strong>: 10Z, X5, abc</p>
                        <p>❌ <strong>URL HTTP</strong>: Sera rejetée (doit être HTTPS)</p>
                        <p>❌ <strong>Nom vide</strong>: Validation Zod echouera</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
