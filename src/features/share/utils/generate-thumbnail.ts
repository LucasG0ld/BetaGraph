import { supabaseBrowser } from '@/lib/supabase/client';
import Konva from 'konva';

/**
 * Génère une miniature du Stage Konva et l'uploade sur Supabase Storage.
 *
 * @description
 * Cette fonction uploade une capture WebP du stage.
 * Elle utilise une technique de clonage pour ne pas affecter l'affichage actuel (zoom/pan).
 * L'image est redimensionnée pour s'adapter (fit) dans un conteneur 1200x630 (OpenGraph) ou 
 * utilise un ratio fixe, mais selon la validation, on vise un max width 2048px ou pixelRatio dynamique.
 *
 * Pour BetaGraph, on veut surtout voir TOUT le bloc. Donc on va :
 * 1. Cloner les calques pertinents (Image, Dessins)
 * 2. Créer un Stage temporaire off-screen
 * 3. Réinitialiser le scale/position pour "Fit" le contenu
 * 4. Exporter en WebP
 *
 * @param stage - Instance du Stage Konva source
 * @param betaId - ID de la beta pour le nom du fichier
 * @param originalImageSize - Dimensions de l'image de fond (pour le ratio)
 * @returns URL publique de l'image uploadée
 */
export async function generateBetaThumbnail(
    stage: Konva.Stage,
    betaId: string,
    originalImageSize: { width: number; height: number }
): Promise<string> {
    // 1. Créer un conteneur temporaire off-screen
    const container = document.createElement('div');
    container.style.display = 'none';
    document.body.appendChild(container);

    try {
        // 2. Créer un Stage clone
        // On utilise les dimensions de l'image originale pour le stage
        // afin d'avoir un export 1:1 (ou proche) qui couvre tout le bloc.
        const width = originalImageSize.width;
        const height = originalImageSize.height;

        const cloneStage = new Konva.Stage({
            container: container,
            width: width,
            height: height,
        });

        // 3. Cloner les calques
        // On suppose que le stage a des calques d'image et de dessin.
        // On itère sur les enfants du stage source et on les clone.
        stage.getChildren().forEach((layer) => {
            const cloneLayer = layer.clone();
            cloneStage.add(cloneLayer as Konva.Layer);
        });

        // 4. Réinitialiser la vue (Reset View)
        // Les calques clonés gardent leurs transformations s'ils en ont,
        // mais le Stage source avait peut-être un scale/position global ou sur les layers.
        // Konva applique le Pan/Zoom souvent sur le Stage ou le 1er Layer.
        // Ici, on veut que le contenu (Image + Dessins) remplisse le Stage cloné (qui fait la taille de l'image).

        // Si le Pan/Zoom est géré sur le Stage source :
        // Le cloneStage est initialisé avec x=0, y=0, scale=1.
        // Si les layers clonés ont des positions relatives, on doit faire attention.
        // Dans BetaGraph (DrawingCanvas), le Zoom/Pan est généralement appliqué au Stage.
        // Donc en créant un nouveau Stage par défaut, on a "reset" le zoom.

        // S'assurer que les layers sont bien positionnés à (0,0)
        cloneStage.getChildren().forEach(layer => {
            layer.position({ x: 0, y: 0 });
            layer.scale({ x: 1, y: 1 });
        });

        // 5. Capture avec optimisation
        // On limite la taille max à 2048px de large pour ne pas exploser le poids
        const MAX_WIDTH = 2048;
        let pixelRatio = 1;

        if (width > MAX_WIDTH) {
            pixelRatio = MAX_WIDTH / width; // Réduire si trop grand
        } else {
            // Si l'image est petite, on peut upscaler un peu, ou garder 1.
            // Pour la netteté sur écran rétina, on peut viser un minimum.
            // Disons qu'on capture à la taille native, plafonnée à 2048.
        }

        // Conversion en Blob WebP
        const dataURL = cloneStage.toDataURL({
            pixelRatio: pixelRatio,
            mimeType: 'image/webp',
            quality: 0.8,
        });

        // DataURL -> Blob
        const res = await fetch(dataURL);
        const blob = await res.blob();

        // 6. Upload vers Supabase
        const supabase = supabaseBrowser;
        const fileName = `${betaId}.webp`;
        const filePath = `${fileName}`; // bucket "thumbnails" root

        const { error: uploadError } = await supabase.storage
            .from('thumbnails')
            .upload(filePath, blob, {
                contentType: 'image/webp',
                upsert: true,
            });

        if (uploadError) throw uploadError;

        // 7. Obtenir l'URL publique
        const { data: { publicUrl } } = supabase.storage
            .from('thumbnails')
            .getPublicUrl(filePath);

        return publicUrl;

    } finally {
        // Nettoyage
        container.remove();
    }
}
