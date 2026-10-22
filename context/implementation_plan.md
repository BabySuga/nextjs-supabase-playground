# Implementation Plan: Task List App with Next.js + Supabase

> **Goal:** Build a minimal Task List app that concretely demonstrates three interview topics:
> 1. Server Components vs Client Components for data fetching
> 2. Supabase Auth with Next.js App Router
> 3. Row Level Security (RLS) and why it matters

---

## ⚠️ Important: This is Next.js 16.4 (Breaking Changes)

This project runs **Next.js 16.4** with **React 19**. Key differences from older versions:

- **`middleware.ts` is deprecated and renamed to `proxy.ts`**. The exported function must also be named `proxy` (not `middleware`).
- `cookies()` and `headers()` from `next/headers` are **async** — always `await` them.
- Server Components are `async` by default. Client Components require `'use client'` at the top.
- `useActionState` (React 19) replaces the old `useFormState`.

---

## Concepts Overview

### Concept 1 — Server Components vs Client Components

|                     | Server Component               | Client Component              |
|---------------------|-------------------------------|-------------------------------|
| Runs on             | Server only                    | Browser (+ server during SSR) |
| Can `await` data    | Yes, directly                  | No — use `useEffect` or SWR   |
| Can use hooks       | No                             | Yes                           |
| Sends JS to browser | No                             | Yes                           |
| Good for            | Reading data, auth checks      | Interactivity, forms, state   |

**In this app:**
- `app/tasks/page.tsx` — **Server Component** that fetches tasks directly from Supabase.
- `app/tasks/AddTaskForm.tsx` — **Client Component** for the form UI, calls a Server Action.

**Interview talking point:** "The task list is fetched on the server — no extra round-trip, no loading spinner. The add-task form needs interactivity (`useActionState`), so it is a Client Component. But the actual database write goes through a Server Action, which runs on the server."

---

### Concept 2 — Supabase Auth with App Router

Supabase Auth uses **cookie-based sessions** managed by `@supabase/ssr`. The flow:

```
User submits login form
  -> Server Action calls supabase.auth.signInWithPassword()
  -> @supabase/ssr writes session cookies via next/headers
  -> proxy.ts reads the cookie to protect /tasks
  -> Server Components call supabase.auth.getUser() to verify the user
```

Two Supabase client helpers are needed:

| Helper                                      | Where used                                    | Purpose                                  |
|---------------------------------------------|-----------------------------------------------|------------------------------------------|
| `createServerClient` (from `@supabase/ssr`) | Server Components, Server Actions, proxy.ts   | Reads/writes cookies via `next/headers`  |
| `createBrowserClient` (from `@supabase/ssr`)| Client Components                             | Reads session from `document.cookie`     |

**Interview talking point:** "Supabase Auth stores the JWT in an HTTP-only cookie. `@supabase/ssr` handles reading and refreshing that cookie in both server and client contexts. The proxy file (`proxy.ts`) does a fast, optimistic redirect before the page renders."

---

### Concept 3 — Row Level Security (RLS)

RLS is a PostgreSQL feature that enforces data access rules **inside the database**, not just in application code.

**Why it matters:** Without RLS, any authenticated user querying `SELECT * FROM tasks` would get *all* rows — not just their own. RLS makes it structurally impossible to leak another user's data, even if there is a bug in the application.

```sql
-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Users can only read their own tasks
CREATE POLICY "Users can view own tasks"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own tasks
CREATE POLICY "Users can insert own tasks"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

`auth.uid()` is a Supabase built-in that extracts the user ID from the JWT sent with the request.

**Interview experiment:** Disable RLS, log in, query tasks — see all rows. Re-enable — see only your own. This makes the concept concrete and memorable.

---

## App File Structure

```
nextjs-supabase-playground/
├── context/
│   ├── implementation_plan.md   <- this file
│   └── task.md                  <- step-by-step task checklist
├── app/
│   ├── layout.tsx               (root layout — already exists)
│   ├── page.tsx                 (redirect to /tasks or /login)
│   ├── login/
│   │   └── page.tsx             (login form — Client Component)
│   ├── tasks/
│   │   ├── page.tsx             (task list — Server Component)
│   │   └── AddTaskForm.tsx      (add task form — Client Component)
│   └── actions/
│       └── auth.ts              (Server Actions: login, logout, addTask)
├── lib/
│   └── supabase/
│       ├── server.ts            (createServerClient helper)
│       └── client.ts            (createBrowserClient helper)
├── proxy.ts                     (route protection — replaces middleware.ts)
└── .env.local
```

---

## Phase 1 — Supabase Project Setup (Supabase Dashboard)

1. Create a new Supabase project.
2. Open the **SQL Editor** and run:

```sql
CREATE TABLE tasks (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tasks"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

3. Copy **Project URL** and **anon public key** from **Project Settings → API**.

---

## Phase 2 — Install Dependencies

```bash
npm install @supabase/supabase-js @supabase/ssr
```

Create `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## Phase 3 — Supabase Client Helpers

### `lib/supabase/server.ts`

Used in Server Components, Server Actions, and `proxy.ts`.
Note: `cookies()` is async in Next.js 16.

```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
            // Server Components cannot set cookies; safe to ignore here
          }
        },
      },
    }
  )
}
```

### `lib/supabase/client.ts`

Used in Client Components only.

```ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

> **Why two helpers?** The server helper reads cookies via `next/headers` (server-only API). The browser helper reads from `document.cookie`. Mixing them up causes runtime errors.

---

## Phase 4 — Route Protection (`proxy.ts`)

> **Next.js 16.4:** The file is `proxy.ts` (not `middleware.ts`). The exported function is named `proxy`.
> In `proxy.ts`, `cookies()` from `next/headers` is NOT available — use `request.cookies` directly.

```ts
// proxy.ts — project root (same level as app/)
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getUser() also refreshes the session cookie if it has expired
  const { data: { user } } = await supabase.auth.getUser()

  if (!user && request.nextUrl.pathname.startsWith('/tasks')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && request.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/tasks', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

---

## Phase 5 — Login Page (`app/login/page.tsx`)

- `'use client'` — needs `useActionState` for error display
- Form submits to Server Action `login(prevState, formData)`
- Server Action calls `supabase.auth.signInWithPassword()`, then `redirect('/tasks')`
- Errors are returned as state and shown in the UI

**Interview talking point:** "The form UI is a Client Component for interactivity. The credential check itself is a Server Action — credentials are validated server-side, never exposed to the browser bundle."

---

## Phase 6 — Task List Page (`app/tasks/page.tsx`)

**Server Component** — no `'use client'` directive, function is `async`.

```ts
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AddTaskForm from './AddTaskForm'

export default async function TasksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <main>
      <h1>My Tasks</h1>
      <ul>
        {tasks?.map((task) => (
          <li key={task.id}>{task.title}</li>
        ))}
      </ul>
      <AddTaskForm />
    </main>
  )
}
```

**Interview talking point:** "No `useEffect`, no loading spinner, no client-side fetch. The HTML arrives with data already in it. RLS ensures this query only ever returns the current user's tasks — the database enforces it, not the app."

---

## Phase 7 — Add Task Form (`app/tasks/AddTaskForm.tsx`)

- `'use client'` — needs `useActionState` for pending/error state
- Calls Server Action `addTask(prevState, formData)`
- Server Action:
  1. Creates server Supabase client
  2. Calls `supabase.auth.getUser()` to verify identity
  3. Inserts task with `user_id` set to `user.id`
  4. Calls `revalidatePath('/tasks')` so the list refreshes

**Interview talking point:** "The form is a Client Component for the pending UI. The write is a Server Action — the JWT is read server-side, so we always know who is inserting. RLS also independently enforces that `user_id` must match `auth.uid()`, so even a crafted request cannot insert another user's data."

---

## Interview Experiments

### Experiment A — RLS Off vs On (most impactful)

1. Log in as two different accounts and add tasks to each.
2. In Supabase SQL Editor: `ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;`
3. Reload the app logged in as User A — you will see all tasks from both users.
4. Run: `ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;`
5. Reload — back to only User A's tasks.

This demonstrates concretely why RLS matters: the app code did not change, only the database policy.

### Experiment B — Where does "rendering" log appear?

1. Add `console.log('TasksPage rendering')` in `TasksPage`.
2. Reload the page — check the **terminal** (server log), not the browser console.
3. Add `console.log('AddTaskForm rendering')` in `AddTaskForm`.
4. Reload — that log appears in the **browser** console.

This makes the Server/Client boundary tangible and memorable.

### Experiment C — What does proxy.ts actually do?

1. Comment out the redirect block in `proxy.ts`.
2. Log out, then manually navigate to `/tasks`.
3. The Server Component's `supabase.auth.getUser()` check still redirects you — but it is slower and happens after the page starts rendering.
4. Restore the proxy and explain: "The proxy is a fast edge-level gate. But it is not the only guard — the Server Component and RLS both independently enforce access."

---

## Key Talking Points Summary

| Topic            | One-sentence answer                                                                                                      |
|------------------|--------------------------------------------------------------------------------------------------------------------------|
| Server vs Client | Server Components fetch data directly on the server with no JS bundle overhead; Client Components handle interactivity.  |
| Supabase Auth    | Session is stored in an HTTP-only cookie; `@supabase/ssr` reads it in both server and client contexts; `proxy.ts` provides fast route-level protection. |
| RLS              | A database-level policy that enforces row ownership inside PostgreSQL — cannot be bypassed by application code.           |
