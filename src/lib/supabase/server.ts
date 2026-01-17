import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { env } from '@/lib/env';

/**
 * Supabase Server Client Factory
 *
 * Creates a new Supabase client for server-side operations.
 * Must be called inside Server Components, Server Actions, or Route Handlers.
 *
 * Features:
 * - Server-side authentication via cookies
 * - RLS policies enforced
 * - Secure cookie handling for session management
 *
 * @example
 * ```tsx
 * // In a Server Component or Server Action
 * import { createSupabaseServer } from '@/lib/supabase/server';
 *
 * const supabase = await createSupabaseServer();
 * const { data } = await supabase.from('boulders').select();
 * ```
 */
export const createSupabaseServer = async () => {
    const cookieStore = await cookies();

    return createServerClient(
        env.NEXT_PUBLIC_SUPABASE_URL,
        env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch {
                        // The `setAll` method is called from a Server Component.
                        // This can be ignored if you have middleware refreshing sessions.
                    }
                },
            },
        }
    );
};
