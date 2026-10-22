import { createBrowserClient } from '@supabase/ssr'

/**
 * Creates a Supabase client for Client Components.
 * This client runs directly in the browser and accesses session cookies via document.cookie.
 */
export function createClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
