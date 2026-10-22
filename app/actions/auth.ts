'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export interface AuthState {
  error?: string | null
  message?: string | null
}

export interface TaskActionState {
  error?: string | null
  success?: boolean
}

/**
 * Server Action: Authenticates a user with email and password.
 * Credentials are submitted directly to the server, protecting them from exposure.
 * @supabase/ssr handles setting the HTTP-only session cookie.
 */
export async function login(
  prevState: AuthState | null,
  formData: FormData
): Promise<AuthState> {
  const email = (formData.get('email') as string || '').trim()
  const password = (formData.get('password') as string || '').trim()

  if (!email || !password) {
    return { error: 'Please enter both email and password.' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  // Redirect on successful sign-in
  redirect('/tasks')
}

/**
 * Server Action: Registers a new user with Supabase Auth.
 */
export async function signup(
  prevState: AuthState | null,
  formData: FormData
): Promise<AuthState> {
  const email = (formData.get('email') as string || '').trim()
  const password = (formData.get('password') as string || '').trim()

  if (!email || !password) {
    return { error: 'Please enter both email and password.' }
  }

  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters long.' }
  }

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  // If Supabase has email confirmation disabled, a session is created immediately
  if (data?.session) {
    redirect('/tasks')
  }

  return {
    message:
      'Account created! Check your email to confirm registration (or sign in if email confirmation is disabled in your Supabase dashboard).',
  }
}

/**
 * Server Action: Signs out the current user and clears session cookies.
 */
export async function logout(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

/**
 * Server Action: Creates a new task bound to the authenticated user's ID.
 * Database RLS policy (`auth.uid() = user_id`) ensures this row belongs exclusively to the user.
 */
export async function addTask(
  prevState: TaskActionState | null,
  formData: FormData
): Promise<TaskActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const title = (formData.get('title') as string || '').trim()

  if (!title) {
    return { error: 'Please enter a task title.' }
  }

  const { error } = await supabase.from('tasks').insert({
    title,
    user_id: user.id,
  })

  if (error) {
    return { error: error.message }
  }

  // Tell Next.js to revalidate the server-rendered task page cache
  revalidatePath('/tasks')
  return { success: true }
}

/**
 * Server Action: Toggles task completion state.
 */
export async function toggleTask(taskId: string, isCompleted: boolean) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { error } = await supabase
    .from('tasks')
    .update({ is_completed: isCompleted })
    .eq('id', taskId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/tasks')
}

/**
 * Server Action: Deletes a task.
 * RLS ensures the user cannot delete any task that does not belong to them.
 */
export async function deleteTask(taskId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { error } = await supabase.from('tasks').delete().eq('id', taskId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/tasks')
}
