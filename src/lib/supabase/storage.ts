import { supabaseBrowser } from './client';

/**
 * Upload une image de bloc d'escalade vers le Storage Supabase.
 *
 * @description
 * Téléverse un Blob d'image (WebP ou JPEG) vers le bucket `boulders` avec :
 * - **Sécurité** : Vérification de la session utilisateur (RLS)
 * - **Unicité** : Génération d'un UUID v4 cryptographique
 * - **Organisation** : Stockage dans `{userId}/{uuid}.{format}`
 * - **Performance** : URL publique immédiate (pas de signed URL)
 *
 * **Workflow** :
 * 1. Vérifier la session utilisateur authentifiée
 * 2. Générer un identifiant unique (UUID v4)
 * 3. Construire le chemin de stockage
 * 4. Uploader le Blob vers Supabase Storage
 * 5. Récupérer et retourner l'URL publique
 *
 * **Sécurité RLS (Phase 2.3)** :
 * - Les politiques RLS garantissent que l'utilisateur ne peut uploader QUE dans son dossier
 * - Impossible d'uploader dans le dossier d'un autre utilisateur
 * - Lecture publique autorisée (bucket public)
 *
 * **Structure de stockage** :
 * ```
 * boulders/
 * ├── {userId-1}/
 * │   ├── 550e8400-e29b-41d4-a716-446655440000.webp
 * │   └── 661f9511-f3ac-52e5-b827-557766551111.jpeg
 * └── {userId-2}/
 *     └── 772g0622-g4bd-63f6-c938-668877662222.webp
 * ```
 *
 * @param {Blob} blob - Blob image optimisé (issu de Phase 3.4)
 * @param {'webp' | 'jpeg'} format - Format de l'image (détermine l'extension et le MIME type)
 * @returns {Promise<string>} URL publique de l'image uploadée
 * @throws {Error} Si session invalide, upload échoué, ou erreur réseau
 *
 * @example
 * ```typescript
 * // Après traitement de l'image (Phase 3.4)
 * const processed = await processImageForUpload(file);
 *
 * // Upload vers Supabase
 * try {
 *   const imageUrl = await uploadBoulderImage(processed.blob, processed.format);
 *   console.log(`Image uploadée : ${imageUrl}`);
 *
 *   // Utiliser l'URL pour enregistrer en DB
 *   await createBoulder({ imageUrl, ... });
 *
 * } catch (error) {
 *   if (error instanceof Error) {
 *     alert(error.message); // Message déjà en français
 *   }
 * }
 * ```
 */
export async function uploadBoulderImage(
    blob: Blob,
    format: 'webp' | 'jpeg'
): Promise<string> {
    try {
        // ===== ÉTAPE 1 : VÉRIFICATION SESSION UTILISATEUR =====
        const supabase = supabaseBrowser;
        const {
            data: { session },
            error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
            throw new Error(
                `Erreur d'authentification : ${sessionError.message}. ` +
                'Veuillez vous reconnecter.'
            );
        }

        if (!session?.user) {
            throw new Error(
                'Vous devez être connecté pour uploader une image. ' +
                'Veuillez vous connecter ou créer un compte.'
            );
        }

        const userId = session.user.id;

        // ===== ÉTAPE 2 : GÉNÉRATION UUID UNIQUE =====
        // UUID v4 : 128 bits aléatoires cryptographiques (2^122 combinaisons)
        const uuid = crypto.randomUUID();

        // ===== ÉTAPE 3 : CONSTRUCTION DU CHEMIN =====
        // Format: {userId}/{uuid}.{format}
        // Exemple: "a1b2c3d4.../550e8400-e29b-41d4-a716-446655440000.webp"
        const filePath = `${userId}/${uuid}.${format}`;

        // ===== ÉTAPE 4 : UPLOAD VERS SUPABASE STORAGE =====
        const { data, error: uploadError } = await supabase.storage
            .from('boulders')
            .upload(filePath, blob, {
                contentType: `image/${format}`, // 'image/webp' ou 'image/jpeg'
                cacheControl: '3600', // Cache 1h (CDN)
                upsert: false, // Pas de remplacement silencieux (UUID unique)
            });

        if (uploadError) {
            // Mapping des erreurs Supabase Storage → Messages français
            switch (uploadError.message) {
                case 'The resource already exists':
                    throw new Error(
                        "Erreur technique : le fichier existe déjà. " +
                        "Réessayez l'upload."
                    );
                case 'Payload too large':
                    throw new Error(
                        "L'image est trop volumineuse. " +
                        'La taille maximale autorisée est de 2 Mo.'
                    );
                case 'Invalid mime type':
                    throw new Error(
                        'Format d\'image invalide. ' +
                        'Utilisez une image JPEG ou WebP.'
                    );
                case 'Row level security policy violated':
                    throw new Error(
                        'Permission refusée. ' +
                        'Vérifiez que vous êtes bien connecté.'
                    );
                default:
                    throw new Error(
                        `Échec de l'upload : ${uploadError.message}. ` +
                        'Vérifiez votre connexion internet et réessayez.'
                    );
            }
        }

        // ===== ÉTAPE 5 : RÉCUPÉRATION URL PUBLIQUE =====
        const {
            data: { publicUrl },
        } = supabase.storage.from('boulders').getPublicUrl(data.path);

        // Log de succès en développement
        if (process.env.NODE_ENV === 'development') {
            console.debug(
                `[Storage Upload] Succès | ` +
                `Path: ${data.path} | ` +
                `Size: ${(blob.size / 1024).toFixed(1)} Ko | ` +
                `Format: ${format.toUpperCase()} | ` +
                `URL: ${publicUrl}`
            );
        }

        return publicUrl;
    } catch (error) {
        // Gestion d'erreur globale avec contexte
        if (error instanceof Error) {
            // Si c'est déjà une Error avec message contextualisé, propager
            throw error;
        }

        // Erreur inconnue (réseau, etc.)
        throw new Error(
            "Échec de l'upload de l'image. " +
            'Vérifiez votre connexion internet et réessayez. ' +
            'Si le problème persiste, contactez le support.'
        );
    }
}
