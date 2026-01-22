'use client';

import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/Card';
import { GradeDisplay } from '@/features/grading/components/GradeDisplay';
import type { Database } from '@/types/database.types';
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

type Beta = Database['public']['Tables']['betas']['Row'];
type Boulder = Database['public']['Tables']['boulders']['Row'];

export interface BoulderCardProps {
    beta: Beta & {
        boulders: Boulder | null;
    };
    index?: number;
}

export function BoulderCard({ beta, index = 0 }: BoulderCardProps) {
    const [imageLoaded, setImageLoaded] = useState(false);
    const boulder = beta.boulders;

    if (!boulder) return null;

    return (
        <Link href={`/boulder/${boulder.id}/edit?betaId=${beta.id}`}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
            >
                <Card className="h-full flex flex-col group cursor-pointer hover:border-brand-accent-cyan/50 transition-all duration-300">
                    {/* Image Container */}
                    <div className="relative h-48 w-full overflow-hidden bg-brand-gray-800">
                        <div
                            className={`absolute inset-0 bg-brand-gray-800 transition-opacity duration-500 ${imageLoaded ? 'opacity-0' : 'opacity-100 animate-pulse'
                                }`}
                        />
                        <Image
                            src={boulder.image_url}
                            alt={boulder.name}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className={`object-cover transition-opacity duration-500 group-hover:scale-105 transition-transform duration-700 ${imageLoaded ? 'opacity-100' : 'opacity-0'
                                }`}
                            onLoad={() => setImageLoaded(true)}
                        />
                        {/* Grade Overlay (Top Right) */}
                        <div className="absolute top-2 right-2">
                            <Badge variant="neon">
                                <GradeDisplay
                                    value={beta.grade_value}
                                    system={beta.grade_system}
                                    size="sm"
                                />
                            </Badge>
                        </div>
                    </div>

                    <CardHeader className="pb-2">
                        <h3 className="text-lg font-bold text-white group-hover:text-brand-accent-cyan transition-colors line-clamp-1">
                            {boulder.name}
                        </h3>
                    </CardHeader>

                    <CardContent className="flex-grow py-0">
                        <div className="flex items-center text-sm text-brand-gray-400 gap-1">
                            <MapPin className="h-3 w-3" />
                            <span className="line-clamp-1">
                                {boulder.location || 'Localisation inconnue'}
                            </span>
                        </div>
                    </CardContent>

                    <CardFooter className="pt-4 border-t border-brand-gray-700/50 mt-4">
                        <div className="flex w-full justify-between items-center text-xs text-brand-gray-500">
                            <span>
                                Modifié le{' '}
                                {new Date(beta.updated_at).toLocaleDateString()}
                            </span>
                            {beta.is_public && (
                                <Badge variant="glass" className="text-[10px] h-5 px-1.5">
                                    Public
                                </Badge>
                            )}
                        </div>
                    </CardFooter>
                </Card>
            </motion.div>
        </Link>
    );
}
