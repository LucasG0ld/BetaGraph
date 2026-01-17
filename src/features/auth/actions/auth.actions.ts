"use server";

import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import {
    signInSchema,
    signUpSchema,
    type SignInFormData,
    type SignUpFormData,
} from "../schemas/auth.schema";

// Action result type
type ActionResult = {
    success: boolean;
    error?: string;
};

export async function signIn(data: SignInFormData): Promise<ActionResult> {
    // Validate with Zod
    const parsed = signInSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0].message };
    }

    const supabase = await createSupabaseServer();

    const { error } = await supabase.auth.signInWithPassword({
        email: parsed.data.email,
        password: parsed.data.password,
    });

    if (error) {
        return { success: false, error: error.message };
    }

    redirect("/"); // Redirect on success
}

export async function signUp(data: SignUpFormData): Promise<ActionResult> {
    // Validate with Zod
    const parsed = signUpSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0].message };
    }

    const supabase = await createSupabaseServer();

    // Sign up with username in metadata (triggers profile creation)
    const { error } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: {
            data: {
                username: parsed.data.username || undefined,
            },
        },
    });

    if (error) {
        return { success: false, error: error.message };
    }

    redirect("/login?success=true"); // Redirect to login with success message
}
