import { z } from "zod";

// Email validation schema
export const emailSchema = z
    .string()
    .min(1, "L'email est requis")
    .email("Email invalide");

// Password validation schema
export const passwordSchema = z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères");

// Username validation schema (optional for signup)
export const usernameSchema = z
    .string()
    .min(3, "Le nom d'utilisateur doit contenir au moins 3 caractères")
    .max(30, "Le nom d'utilisateur ne peut pas dépasser 30 caractères")
    .regex(
        /^[a-zA-Z0-9_-]+$/,
        "Seuls les caractères alphanumériques, tirets et underscores sont autorisés"
    )
    .optional();

// Complete Sign In schema
export const signInSchema = z.object({
    email: emailSchema,
    password: passwordSchema,
});

// Complete Sign Up schema
export const signUpSchema = z.object({
    email: emailSchema,
    password: passwordSchema,
    username: usernameSchema,
});

// Inferred TypeScript types
export type SignInFormData = z.infer<typeof signInSchema>;
export type SignUpFormData = z.infer<typeof signUpSchema>;
