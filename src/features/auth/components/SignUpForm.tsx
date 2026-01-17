"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { signUp } from "../actions/auth.actions";
import { signUpSchema, type SignUpFormData } from "../schemas/auth.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SignUpForm() {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<SignUpFormData>({
        resolver: zodResolver(signUpSchema),
    });

    const onSubmit = (data: SignUpFormData) => {
        setError(null);
        startTransition(async () => {
            const result = await signUp(data);
            if (!result.success && result.error) {
                setError(result.error);
            }
        });
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Global error */}
            {error && (
                <div className="bg-red-500/10 border border-red-500 rounded-lg p-3 text-red-500 text-sm">
                    {error}
                </div>
            )}

            {/* Email field */}
            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    type="email"
                    placeholder="vous@exemple.com"
                    autoComplete="email"
                    error={errors.email?.message}
                    {...register("email")}
                />
                {errors.email && (
                    <p className="text-red-500 text-sm">{errors.email.message}</p>
                )}
            </div>

            {/* Username field (optional) */}
            <div className="space-y-2">
                <Label htmlFor="username">
                    Nom d&apos;utilisateur{" "}
                    <span className="text-brand-gray-400">(optionnel)</span>
                </Label>
                <Input
                    id="username"
                    type="text"
                    placeholder="grimpeur_alpha"
                    autoComplete="username"
                    error={errors.username?.message}
                    {...register("username")}
                />
                {errors.username && (
                    <p className="text-red-500 text-sm">{errors.username.message}</p>
                )}
                <p className="text-xs text-brand-gray-400">
                    3-30 caractères alphanumériques
                </p>
            </div>

            {/* Password field */}
            <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    error={errors.password?.message}
                    {...register("password")}
                />
                {errors.password && (
                    <p className="text-red-500 text-sm">{errors.password.message}</p>
                )}
                <p className="text-xs text-brand-gray-400">Minimum 8 caractères</p>
            </div>

            {/* Submit button */}
            <Button type="submit" className="w-full" isLoading={isPending}>
                Créer un compte
            </Button>

            {/* Link to login */}
            <p className="text-center text-sm text-brand-gray-300">
                Déjà inscrit ?{" "}
                <Link
                    href="/login"
                    className="text-brand-accent-cyan hover:underline font-medium"
                >
                    Se connecter
                </Link>
            </p>
        </form>
    );
}
