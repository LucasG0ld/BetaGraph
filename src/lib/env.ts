import { z } from 'zod/v4';

/**
 * Environment Variables Schema - Validated at runtime
 * Follows "Fail Fast" pattern: App crashes explicitly if required vars are missing.
 *
 * @see https://nextjs.org/docs/app/building-your-application/configuring/environment-variables
 */
const envSchema = z.object({
    // Supabase Configuration
    // URL can be standard Supabase cloud OR local (supabase CLI / Docker)
    NEXT_PUBLIC_SUPABASE_URL: z
        .url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL')
        .describe('Supabase project URL (e.g., https://xxx.supabase.co or http://localhost:54321)'),

    NEXT_PUBLIC_SUPABASE_ANON_KEY: z
        .string()
        .min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY cannot be empty')
        .describe('Supabase anonymous/public key (safe to expose in browser)'),

    // ⚠️ DANGER: Service Role Key - NEVER expose to client
    // This key bypasses RLS and has full database access.
    // Only used in server-side code (Server Actions, Route Handlers).
    SUPABASE_SERVICE_ROLE_KEY: z
        .string()
        .min(1, 'SUPABASE_SERVICE_ROLE_KEY cannot be empty')
        .optional()
        .describe('Supabase service role key (server-side only, bypasses RLS)'),
});

/**
 * Validated environment variables.
 * If validation fails, the application will crash at startup with a clear error message.
 */
const parseResult = envSchema.safeParse(process.env);

if (!parseResult.success) {
    console.error('❌ Invalid environment variables:');
    console.error(parseResult.error.format());
    throw new Error(
        'Missing or invalid environment variables. Check your .env.local file.'
    );
}

export const env = parseResult.data;

/**
 * TypeScript type inferred from the Zod schema.
 * Use this for type-safe access to environment variables.
 */
export type Env = z.infer<typeof envSchema>;
