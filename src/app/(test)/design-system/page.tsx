'use client';

import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/Card';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { Toaster } from '@/components/ui/Toast';
import { useToastStore } from '@/features/shared/store/useToastStore';

export default function DesignSystemPage() {
    const { addToast, updateToast } = useToastStore();

    const handleSimulation = () => {
        const id = addToast("Traitement de l'image en cours...", "info", 10000);

        setTimeout(() => {
            updateToast(id, { message: "Compression WebP terminée", type: "success", duration: 3000 });
        }, 2000);
    };

    return (
        <div className="min-h-screen bg-brand-black text-white p-8 space-y-12">
            <Toaster />

            <header className="border-b border-brand-gray-800 pb-8">
                <h1 className="text-4xl font-bold text-brand-accent-cyan tracking-tight mb-2">
                    DESIGN SYSTEM <span className="text-brand-gray-700">v1.0</span>
                </h1>
                <p className="text-brand-gray-400">Fondations visuelles &quot;High-Tech Lab&quot;</p>
            </header>

            {/* BADGES */}
            <section className="space-y-4">
                <h2 className="text-xl font-mono text-brand-gray-500 uppercase tracking-widest">01. Badges</h2>
                <div className="flex flex-wrap gap-4 p-6 border border-brand-gray-800 rounded-xl bg-brand-gray-900/50">
                    <Badge variant="default">Default</Badge>
                    <Badge variant="solid">Solid Cyan</Badge>
                    <Badge variant="outline">Outline Cyan</Badge>
                    <Badge variant="neon">Neon Glow</Badge>
                    <Badge variant="glass">Glass Effect</Badge>
                    <Badge variant="error">Error State</Badge>
                </div>
            </section>

            {/* CARDS */}
            <section className="space-y-4">
                <h2 className="text-xl font-mono text-brand-gray-500 uppercase tracking-widest">02. Cards</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* Standard Card */}
                    <Card>
                        <div className="relative h-48 w-full bg-brand-gray-800">
                            {/* Placeholder pattern */}
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-brand-gray-700 to-brand-gray-900" />
                        </div>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <h3 className="font-bold text-lg">La Poupée</h3>
                                <Badge variant="neon">7A</Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-brand-gray-400">Fontainebleau, France</p>
                        </CardContent>
                        <CardFooter>
                            <span className="text-xs text-brand-gray-500">Par Lucas G.</span>
                        </CardFooter>
                    </Card>

                    {/* Image Card (Mock) */}
                    <Card className="group cursor-pointer">
                        <div className="relative h-full min-h-[300px] w-full">
                            <div className="absolute inset-0 bg-gradient-to-t from-brand-black via-transparent to-transparent z-10" />
                            <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
                                <Badge variant="outline" className="mb-2">Phase 7</Badge>
                                <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-brand-accent-cyan transition-colors">
                                    Project BetaGraph
                                </h3>
                                <p className="text-brand-gray-300 text-sm">Design System Validation</p>
                            </div>
                        </div>
                    </Card>

                    {/* Loading Card */}
                    <Card isLoading className="h-[300px]" />
                </div>
            </section>

            {/* TOASTS */}
            <section className="space-y-4">
                <h2 className="text-xl font-mono text-brand-gray-500 uppercase tracking-widest">03. Notifications</h2>
                <div className="flex items-center gap-4 p-6 border border-brand-gray-800 rounded-xl bg-brand-gray-900/50">
                    <button
                        onClick={() => addToast("Information système standard", "info")}
                        className="px-4 py-2 bg-brand-gray-800 rounded hover:bg-brand-gray-700 transition"
                    >
                        Info Toast
                    </button>
                    <button
                        onClick={() => addToast("Opération réussie !", "success")}
                        className="px-4 py-2 bg-brand-accent-cyan/10 text-brand-accent-cyan border border-brand-accent-cyan/20 rounded hover:bg-brand-accent-cyan/20 transition"
                    >
                        Success Toast
                    </button>
                    <button
                        onClick={() => addToast("Erreur critique détectée", "error")}
                        className="px-4 py-2 bg-brand-accent-pink/10 text-brand-accent-pink border border-brand-accent-pink/20 rounded hover:bg-brand-accent-pink/20 transition"
                    >
                        Error Toast
                    </button>
                    <button
                        onClick={handleSimulation}
                        className="px-4 py-2 bg-white text-black font-bold rounded hover:bg-white/90 transition shadow-glow-cyan"
                    >
                        Simuler Update (2s)
                    </button>
                </div>
            </section>

            {/* LOADING */}
            <section className="space-y-4">
                <h2 className="text-xl font-mono text-brand-gray-500 uppercase tracking-widest">04. Loaders</h2>
                <div className="flex justify-center p-12 border border-brand-gray-800 rounded-xl bg-brand-black">
                    <LoadingScreen />
                </div>
            </section>
        </div>
    );
}
