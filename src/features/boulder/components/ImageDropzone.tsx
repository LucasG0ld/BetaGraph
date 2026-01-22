'use client';

import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { Image as ImageIcon, Loader2, UploadCloud } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useState } from 'react';

interface ImageDropzoneProps {
    onFileSelect: (file: File) => void;
    isProcessing: boolean;
    isUploading: boolean;
    error: string | null;
    imageUrl: string | null;
    onReset: () => void;
    className?: string;
}

export function ImageDropzone({
    onFileSelect,
    isProcessing,
    isUploading,
    error,
    imageUrl,
    onReset,
    className,
}: ImageDropzoneProps) {
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!imageUrl) setIsDragOver(true);
    }, [imageUrl]);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);

        if (imageUrl || isProcessing || isUploading) return;

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            const file = files[0];
            if (file.type.startsWith('image/')) {
                onFileSelect(file);
            }
        }
    }, [imageUrl, isProcessing, isUploading, onFileSelect]);

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            onFileSelect(files[0]);
        }
    }, [onFileSelect]);

    // État actif : Chargement
    const isLoading = isProcessing || isUploading;
    const loadingText = isProcessing ? 'Optimisation...' : 'Envoi...';

    return (
        <div className={cn("w-full transition-all duration-300", className)}>
            <AnimatePresence mode="wait">
                {imageUrl ? (
                    /* ETAT 3: APERÇU (Succès) */
                    <motion.div
                        key="preview"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="relative w-full h-64 md:h-80 rounded-xl overflow-hidden bg-brand-gray-800 border border-brand-gray-700 group"
                    >
                        <Image
                            src={imageUrl}
                            alt="Aperçu du bloc"
                            fill
                            className="object-cover"
                        />
                        {/* Overlay Changement */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                                onClick={onReset}
                                className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-lg text-white font-medium hover:bg-white/20 transition-colors border border-white/20 flex items-center gap-2"
                            >
                                <ImageIcon className="w-4 h-4" />
                                Changer l&apos;image
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    /* ETAT 1 & 2: DROPZONE / LOADING */
                    <motion.div
                        key="dropzone"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={cn(
                                "relative w-full h-64 md:h-80 rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all duration-300",
                                isDragOver
                                    ? "border-brand-accent-cyan bg-brand-accent-cyan/5 shadow-glow-cyan"
                                    : "border-brand-gray-700 bg-brand-gray-900/50 hover:border-brand-gray-500",
                                error && "border-red-500 bg-red-500/5",
                                isLoading && "pointer-events-none opacity-80"
                            )}
                        >
                            <input
                                type="file"
                                id="dropzone-file"
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileChange}
                                disabled={isLoading}
                            />

                            {isLoading ? (
                                /* LOADERS */
                                <div className="flex flex-col items-center gap-4">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-brand-accent-cyan/20 blur-xl rounded-full" />
                                        <Loader2 className="w-12 h-12 text-brand-accent-cyan animate-spin relative z-10" />
                                    </div>
                                    <p className="text-brand-accent-cyan font-mono text-sm animate-pulse">
                                        {loadingText}
                                    </p>
                                </div>
                            ) : (
                                /* INSTRUCTIONS DE DROP */
                                <label
                                    htmlFor="dropzone-file"
                                    className="flex flex-col items-center gap-4 cursor-pointer w-full h-full justify-center p-6"
                                >
                                    <div className={cn(
                                        "p-4 rounded-full bg-brand-gray-800 transition-transform duration-300",
                                        isDragOver && "scale-110 bg-brand-accent-cyan/10"
                                    )}>
                                        <UploadCloud className={cn(
                                            "w-8 h-8 text-brand-gray-400 transition-colors",
                                            isDragOver && "text-brand-accent-cyan"
                                        )} />
                                    </div>
                                    <div className="text-center space-y-1">
                                        <p className="text-lg font-medium text-white">
                                            Glissez votre photo ici
                                        </p>
                                        <p className="text-sm text-brand-gray-400">
                                            ou cliquez pour parcourir
                                        </p>
                                    </div>
                                    <p className="text-xs text-brand-gray-600 mt-2">
                                        JPG, PNG, WEBP, HEIC (Max 10Mo)
                                    </p>
                                </label>
                            )}
                        </div>

                        {/* Message d'erreur externe */}
                        {error && (
                            <motion.p
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-red-400 text-sm mt-2 text-center"
                            >
                                {error}
                            </motion.p>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
