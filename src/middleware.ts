import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { env } from '@/lib/env';

/**
 * Supabase Session Middleware
 *
 * Handles automatic session refresh for all protected routes.
 * This ensures the user's session is always fresh and valid.
 *
 * @see https://supabase.com/docs/guides/auth/server-side/nextjs
 */
export const updateSession = async (request: NextRequest) => {
    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabase = createServerClient(
        env.NEXT_PUBLIC_SUPABASE_URL,
        env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // IMPORTANT: Do NOT remove this line.
    // Calling getUser() triggers the session refresh if needed.
    // This is required to keep the session valid.
    await supabase.auth.getUser();

    return supabaseResponse;
};

/**
 * Next.js Middleware Entry Point
 *
 * Refreshes user sessions on every request to protected routes.
 */
export const middleware = async (request: NextRequest) => {
    return await updateSession(request);
};

/**
 * Middleware Matcher Configuration
 *
 * Excludes:
 * - Static files (_next/static, _next/image)
 * - Favicon and other static assets
 * - Auth routes (to prevent redirect loops)
 * - API routes (handled separately)
 */
export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - images and static assets
         * - Auth routes (sign-in, sign-up, reset-password)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|sign-in|sign-up|reset-password).*)',
    ],
};
