"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { signIn } from "../actions/auth.actions";
import { signInSchema, type SignInFormData } from "../schemas/auth.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SignInForm() {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<SignInFormData>({
        resolver: zodResolver(signInSchema),
    });

    const onSubmit = (data: SignInFormData) => {
        setError(null);
        startTransition(async () => {
            const result = await signIn(data);
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

            {/* Password field */}
            <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    error={errors.password?.message}
                    {...register("password")}
                />
                {errors.password && (
                    <p className="text-red-500 text-sm">{errors.password.message}</p>
                )}
            </div>

            {/* Submit button */}
            <Button type="submit" className="w-full" isLoading={isPending}>
                Se connecter
            </Button>

            {/* Link to signup */}
            <p className="text-center text-sm text-brand-gray-300">
                Pas encore de compte ?{" "}
                <Link
                    href="/register"
                    className="text-brand-accent-cyan hover:underline font-medium"
                >
                    S&apos;inscrire
                </Link>
            </p>
        </form>
    );
}
