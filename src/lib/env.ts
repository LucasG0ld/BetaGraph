import { z } from 'zod';

/**
 * Environment Variables Schema - Validated at runtime
 * Follows "Fail Fast" pattern: App crashes explicitly if required vars are missing.
 *
 * Split into client-safe and server-only schemas to avoid browser validation errors.
 *
 * @see https://nextjs.org/docs/app/building-your-application/configuring/environment-variables
 */

/**
 * CLIENT-SAFE Schema
 * Only validates variables prefixed with NEXT_PUBLIC_
 * Safe to use in browser/client components
 */
const clientEnvSchema = z.object({
    NEXT_PUBLIC_SUPABASE_URL: z
        .string()
        .url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL')
        .describe('Supabase project URL (e.g., https://xxx.supabase.co or http://localhost:54321)'),

    NEXT_PUBLIC_SUPABASE_ANON_KEY: z
        .string()
        .min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY cannot be empty')
        .describe('Supabase anonymous/public key (safe to expose in browser)'),
});

/**
 * SERVER-ONLY Schema
 * Includes all client variables + server-only secrets
 * Only use on server-side (Server Actions, Route Handlers, Middleware)
 */
const serverEnvSchema = clientEnvSchema.extend({
    // ⚠️ DANGER: Service Role Key - NEVER expose to client
    // This key bypasses RLS and has full database access.
    // Only used in server-side code (Server Actions, Route Handlers).
    SUPABASE_SERVICE_ROLE_KEY: z
        .string()
        .min(1, 'SUPABASE_SERVICE_ROLE_KEY cannot be empty')
        .describe('Supabase service role key (server-side only, bypasses RLS)'),
});

/**
 * Validate client-safe environment variables
 * This validation runs in both browser and server contexts
 * 
 * NOTE: We must explicitly construct the object because Next.js replaces
 * process.env at build time, and safeParse(process.env) doesn't work correctly.
 */
const clientEnvValues = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
};

const clientParseResult = clientEnvSchema.safeParse(clientEnvValues);

if (!clientParseResult.success) {
    console.error('❌ Invalid client environment variables:');
    console.error('Values:', clientEnvValues);
    console.error('Errors:', JSON.stringify(clientParseResult.error.format(), null, 2));
    throw new Error(
        'Missing or invalid NEXT_PUBLIC_ environment variables. Check your .env.local file.'
    );
}

/**
 * Client-safe environment variables
 * Safe to import in client components
 */
export const env = clientParseResult.data;

/**
 * Server-only environment variables
 * Import this ONLY in server-side code (Server Actions, Route Handlers, Middleware)
 * 
 * @example
 * ```ts
 * // ✅ Server Action
 * 'use server';
 * import { serverEnv } from '@/lib/env';
 * const client = createClient(serverEnv.SUPABASE_SERVICE_ROLE_KEY);
 * ```
 * 
 * @example
 * ```ts
 * // ❌ Client Component - DO NOT DO THIS
 * 'use client';
 * import { serverEnv } from '@/lib/env'; // ERROR: Will crash in browser
 * ```
 */
export const serverEnv = (() => {
    // Only validate server schema on server-side
    // In browser, process.env.SUPABASE_SERVICE_ROLE_KEY is undefined
    if (typeof window !== 'undefined') {
        // Browser: return client env only (serverEnv shouldn't be used here anyway)
        return clientParseResult.data as z.infer<typeof serverEnvSchema>;
    }

    // Server: validate full schema including secrets
    const serverParseResult = serverEnvSchema.safeParse(process.env);

    if (!serverParseResult.success) {
        console.error('❌ Invalid server environment variables:');
        console.error(serverParseResult.error.format());
        throw new Error(
            'Missing or invalid server environment variables. Check your .env.local file.'
        );
    }

    return serverParseResult.data;
})();

/**
 * TypeScript types inferred from schemas
 */
export type ClientEnv = z.infer<typeof clientEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

