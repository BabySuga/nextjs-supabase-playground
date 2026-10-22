import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Creates a Supabase client for Server Components, Server Actions, and Route Handlers.
 * In Next.js 16, `cookies()` is an asynchronous function that must be awaited.
 *
 * This client reads and writes cookies to maintain session state securely on the server.
 */
export async function createClient() {
  const cookieStore = await cookies()

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // In Next.js App Router, Server Components cannot modify cookies directly.
          // We safely ignore this error when called from a Server Component,
          // as sessions are automatically refreshed in proxy.ts.
        }
      },
    },
  })
}
