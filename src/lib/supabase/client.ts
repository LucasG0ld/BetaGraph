import { createBrowserClient } from '@supabase/ssr';
import { env } from '@/lib/env';

/**
 * Supabase Browser Client
 *
 * Use this client for client-side operations in React components.
 * This client is safe to use in 'use client' components.
 *
 * Features:
 * - Automatic session management
 * - Cookie-based authentication
 * - RLS policies enforced via anon key
 *
 * @example
 * ```tsx
 * 'use client';
 * import { supabaseBrowser } from '@/lib/supabase/client';
 *
 * const { data, error } = await supabaseBrowser.from('boulders').select();
 * ```
 */
export const supabaseBrowser = createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
