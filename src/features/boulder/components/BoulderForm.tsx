'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createBoulderWithBeta } from '@/features/boulder/actions/create-boulder';
import { ImageDropzone } from '@/features/boulder/components/ImageDropzone';
import { useImageUpload } from '@/features/boulder/hooks/useImageUpload';
import {
    CreateBoulderWithBetaSchema,
    type CreateBoulderWithBeta,
} from '@/features/boulder/schemas/beta.schema';
import { GradeSelector } from '@/features/grading/components/GradeSelector';
import { useToastStore } from '@/features/shared/store/useToastStore';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { type SubmitHandler, Controller, useForm } from 'react-hook-form';

export function BoulderForm() {
    const router = useRouter();
    const { addToast } = useToastStore();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 1. Hook d'upload d'image
    const imageUpload = useImageUpload();
    const { imageUrl, upload, reset: resetUpload } = imageUpload;

    // 2. React Hook Form
    const form = useForm({
        resolver: zodResolver(CreateBoulderWithBetaSchema),
        defaultValues: {
            boulder: {
                name: '',
                location: '',
                image_url: '', // Sera rempli après upload
            },
            beta: {
                grade_value: '',
                grade_system: 'fontainebleau',
                is_public: false,
            },
        },
    });

    const {
        control,
        handleSubmit,
        setValue,
        formState: { errors },
    } = form;

    // 3. Sync image URL avec le formulaire
    useEffect(() => {
        if (imageUrl) {
            setValue('boulder.image_url', imageUrl, { shouldValidate: true });
        } else {
            setValue('boulder.image_url', '', { shouldValidate: true });
        }
    }, [imageUrl, setValue]);

    // 4. Gestion de la soumission
    const onSubmit: SubmitHandler<CreateBoulderWithBeta> = async (data) => {
        setIsSubmitting(true);
        try {
            const result = await createBoulderWithBeta(data);

            if (result.success) {
                addToast('Bloc créé avec succès !', 'success');
                // Redirection vers l'éditeur avec la beta ID
                router.push(
                    `/boulder/${result.data.boulder_id}/edit?betaId=${result.data.beta_id}`
                );
            } else {
                addToast(result.error, 'error');
                setIsSubmitting(false);
            }
        } catch {
            addToast("Une erreur inattendue s'est produite.", 'error');
            setIsSubmitting(false);
        }
    };

    const handleReset = () => {
        resetUpload();
        form.reset();
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-2xl mx-auto">
            {/* ZONE 1 : UPLOAD (Toujours visible au début) */}
            <div className="space-y-4">
                <Label className="text-lg font-bold text-white">
                    Image du bloc
                </Label>
                <ImageDropzone
                    onFileSelect={upload}
                    isProcessing={imageUpload.isProcessing}
                    isUploading={imageUpload.isUploading}
                    error={imageUpload.error}
                    imageUrl={imageUrl}
                    onReset={handleReset}
                />
                {errors.boulder?.image_url && (
                    <p className="text-sm text-red-500">
                        {errors.boulder.image_url.message}
                    </p>
                )}
            </div>

            {/* ZONE 2 : MÉTADONNÉES (Apparition progressive) */}
            {imageUrl && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="space-y-6 bg-brand-gray-900/30 p-6 rounded-xl border border-brand-gray-800"
                >
                    <div className="space-y-4">
                        {/* NOM */}
                        <div className="space-y-2">
                            <Label htmlFor="boulder.name">Nom du bloc</Label>
                            <Input
                                id="boulder.name"
                                placeholder="Ex: La Poupée"
                                {...form.register('boulder.name')}
                                className="bg-brand-gray-800 border-brand-gray-700 focus:border-brand-accent-cyan transition-colors"
                            />
                            {errors.boulder?.name && (
                                <p className="text-sm text-red-500">
                                    {errors.boulder.name.message}
                                </p>
                            )}
                        </div>

                        {/* LIEU */}
                        <div className="space-y-2">
                            <Label htmlFor="boulder.location">Lieu (Secteur)</Label>
                            <Input
                                id="boulder.location"
                                placeholder="Ex: Rocher Canon"
                                {...form.register('boulder.location')}
                                className="bg-brand-gray-800 border-brand-gray-700 focus:border-brand-accent-cyan transition-colors"
                            />
                            {errors.boulder?.location && (
                                <p className="text-sm text-red-500">
                                    {errors.boulder.location.message}
                                </p>
                            )}
                        </div>

                        {/* COTATION */}
                        <div className="space-y-2">
                            <Controller
                                control={control}
                                name="beta"
                                render={({ field: { value, onChange } }) => (
                                    <GradeSelector
                                        value={value.grade_value}
                                        system={value.grade_system}
                                        onChange={(newGrade, newSystem) => {
                                            onChange({
                                                ...value,
                                                grade_value: newGrade,
                                                grade_system: newSystem,
                                            });
                                        }}
                                        error={errors.beta?.grade_value?.message}
                                    />
                                )}
                            />
                        </div>
                    </div>

                    {/* ACTIONS */}
                    <div className="pt-4 flex justify-end">
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full md:w-auto shadow-glow-cyan"
                            size="lg"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Création...
                                </>
                            ) : (
                                <>
                                    Créer et tracer
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </>
                            )}
                        </Button>
                    </div>
                </motion.div>
            )}
        </form>
    );
}
