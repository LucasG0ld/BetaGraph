'use client';

/**
 * Page de test pour le Canvas.
 *
 * @description
 * Page de démonstration/test pour valider le fonctionnement
 * du Canvas Core Engine (Phase 4).
 */

import { DrawingCanvas } from '@/features/canvas/components/DrawingCanvas';

// Image de test (placeholder)
const TEST_IMAGE_URL = 'https://images.unsplash.com/photo-1522163182402-834f871fd851?w=1200';
const TEST_IMAGE_WIDTH = 1200;
const TEST_IMAGE_HEIGHT = 800;

export default function CanvasTestPage() {
    return (
        <div className="min-h-screen bg-brand-black flex flex-col">
            {/* Header */}
            <header className="p-4 border-b border-white/10">
                <h1 className="text-xl font-bold text-white">
                    🧪 Test Canvas - Phase 4
                </h1>
                <p className="text-gray-400 text-sm mt-1">
                    Testez le dessin, zoom/pan, et la toolbar
                </p>
            </header>

            {/* Canvas - hauteur fixe pour éviter les problèmes de flex */}
            <main className="flex-1 relative" style={{ minHeight: 'calc(100vh - 160px)' }}>
                <DrawingCanvas
                    imageUrl={TEST_IMAGE_URL}
                    imageWidth={TEST_IMAGE_WIDTH}
                    imageHeight={TEST_IMAGE_HEIGHT}
                    className="absolute inset-0"
                />
            </main>

            {/* Instructions */}
            <footer className="p-4 border-t border-white/10 bg-black/50">
                <div className="text-sm text-gray-400 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <span className="text-white font-medium">🖌️ Dessiner</span>
                        <p>Clic + glisser</p>
                    </div>
                    <div>
                        <span className="text-white font-medium">🔍 Zoom</span>
                        <p>Molette / Pinch</p>
                    </div>
                    <div>
                        <span className="text-white font-medium">✋ Pan</span>
                        <p>Ctrl + Glisser / 2 doigts</p>
                    </div>
                    <div>
                        <span className="text-white font-medium">↩️ Undo</span>
                        <p>Bouton toolbar</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
