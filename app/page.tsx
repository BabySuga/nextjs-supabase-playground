import { redirect } from 'next/navigation'

// In Next.js 16 with cacheComponents, redirecting during render requires instant = false
export const instant = false

/**
 * Root page: Redirects to /tasks.
 * Route protection proxy (`proxy.ts`) ensures unauthenticated users are routed to /login.
 */
export default function HomePage() {
  redirect('/tasks')
}
