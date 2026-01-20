'use client';

import { useState } from 'react';
import { GradeSelector } from '@/features/grading/components/GradeSelector';
import { GradeDisplay } from '@/features/grading/components/GradeDisplay';
import { GradeSystemToggle } from '@/features/grading/components/GradeSystemToggle';
import { type GradeSystem } from '@/features/grading/constants/grades';
import { useGradingPreferenceSync } from '@/features/grading/hooks/useGradingPreferenceSync';

export default function GradingTestPage() {
    // État local pour le test du sélecteur
    const [selectedGrade, setSelectedGrade] = useState<{ value: string; system: GradeSystem }>({
        value: '7A',
        system: 'fontainebleau',
    });

    // État local pour le test du toggle
    const [toggleSystem, setToggleSystem] = useState<GradeSystem>('fontainebleau');

    // Hook de préférence globale
    const { preferredSystem, setPreferredSystem, isSyncing } = useGradingPreferenceSync();

    return (
        <div className="min-h-screen bg-brand-black text-white p-8 space-y-12">
            <h1 className="text-3xl font-bold text-brand-accent-cyan mb-8">
                Phase 6 Validation : Grading System
            </h1>

            {/* Section 1 : Grade Selector */}
            <section className="space-y-4">
                <h2 className="text-xl font-bold border-b border-brand-gray-700 pb-2">
                    1. Grade Selector (Local State)
                </h2>
                <div className="bg-brand-gray-900 p-6 rounded-xl border border-brand-gray-700 max-w-md">
                    <GradeSelector
                        value={selectedGrade.value}
                        system={selectedGrade.system}
                        onChange={(value, system) => setSelectedGrade({ value, system })}
                    />
                    <div className="mt-4 p-3 bg-brand-black rounded font-mono text-sm">
                        Calculated State: {JSON.stringify(selectedGrade)}
                    </div>
                </div>
            </section>

            {/* Section 2 : Grade Display & Conversion */}
            <section className="space-y-4">
                <h2 className="text-xl font-bold border-b border-brand-gray-700 pb-2">
                    2. Grade Display (Auto-Conversion)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Controls */}
                    <div className="space-y-4">
                        <div className="bg-brand-gray-900 p-4 rounded-lg">
                            <label className="block text-sm text-brand-gray-400 mb-2">
                                Préférence Globale (Zustand Store)
                            </label>
                            <GradeSystemToggle
                                value={preferredSystem}
                                onChange={setPreferredSystem}
                            />
                            {isSyncing && <span className="ml-2 text-xs text-brand-accent-cyan animate-pulse">Syncing...</span>}
                        </div>
                    </div>

                    {/* Display Examples */}
                    <div className="bg-brand-gray-900 p-6 rounded-xl border border-brand-gray-700 space-y-4">
                        <div className="flex justify-between items-center">
                            <span>7A (Fontainebleau) :</span>
                            <GradeDisplay value="7A" system="fontainebleau" size="lg" showSystemBadge />
                        </div>
                        <div className="flex justify-between items-center">
                            <span>V6 (V-Scale) :</span>
                            <GradeDisplay value="V6" system="v_scale" size="lg" showSystemBadge />
                        </div>
                        <div className="flex justify-between items-center">
                            <span>6A+ (Approx &rarr; V3) :</span>
                            <GradeDisplay value="6A+" system="fontainebleau" size="lg" showSystemBadge />
                        </div>
                    </div>
                </div>
            </section>

            {/* Section 3 : Component Isolation */}
            <section className="space-y-4">
                <h2 className="text-xl font-bold border-b border-brand-gray-700 pb-2">
                    3. GradeSystemToggle (Isolated)
                </h2>
                <div className="bg-brand-gray-900 p-6 rounded-xl border border-brand-gray-700 max-w-sm">
                    <GradeSystemToggle
                        value={toggleSystem}
                        onChange={setToggleSystem}
                    />
                    <div className="mt-2 text-sm text-brand-gray-400">
                        Selected: {toggleSystem}
                    </div>
                </div>
            </section>
        </div>
    );
}
