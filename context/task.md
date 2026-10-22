# Task Checklist: Task List App

Work through these steps in order. Each step maps to a section in `implementation_plan.md`.

---

## Setup

- [x] **Step 1 — Supabase project schema**
  - Schema created in `supabase-schema.sql` with `tasks` table, RLS, and policies
  - Ready to run in Supabase SQL editor

- [x] **Step 2 — Environment variables**
  - Created `.env.example` and initial `.env.local`

- [x] **Step 3 — Install packages**
  ```bash
  npm install @supabase/supabase-js @supabase/ssr
  ```

---

## Supabase Client Helpers

- [x] **Step 4 — Create `lib/supabase/server.ts`**
  - `async function createClient()` using `createServerClient` from `@supabase/ssr`
  - Awaits `cookies()` (Next.js 16 breaking change)

- [x] **Step 5 — Create `lib/supabase/client.ts`**
  - `createClient()` using `createBrowserClient` from `@supabase/ssr`

---

## Route Protection

- [x] **Step 6 — Create `proxy.ts` at the project root**
  - Next.js 16 file convention (replaces deprecated `middleware.ts`)
  - Redirects unauthenticated users away from `/tasks` to `/login`
  - Redirects authenticated users from `/login` to `/tasks`

---

## Authentication

- [x] **Step 7 — Create `app/actions/auth.ts`**
  - `'use server'` directive
  - `login`, `signup`, `logout`, `addTask`, `toggleTask`, `deleteTask` Server Actions

- [x] **Step 8 — Create `app/login/page.tsx`**
  - Client Component with `useActionState`
  - Supports both login and account creation
  - Clear pending and error states

---

## Pages

- [x] **Step 9 — Create `app/tasks/page.tsx`** (Server Component)
  - Async Server Component querying tasks directly on server
  - RLS ensures only user's tasks are fetched
  - Logout form and concept guide

- [x] **Step 10 — Create `app/tasks/AddTaskForm.tsx` & `TaskItem.tsx`** (Client Components)
  - Interactive form and task item controls

- [x] **Step 11 — Update `app/page.tsx`**
  - Redirects to `/tasks` (intercepted by `proxy.ts`)

---

## Verify Concepts

- [x] **Verify Concept 1 — Server vs Client**
  - Server Component fetches data with zero client fetch overhead; Client Components handle form and interactivity.

- [x] **Verify Concept 2 — Auth flow**
  - Cookie session management verified via `proxy.ts` and `@supabase/ssr`.

- [x] **Verify Concept 3 — RLS**
  - PostgreSQL RLS policies defined using `auth.uid() = user_id`.

---

## Notes

- Do not add features beyond login, viewing tasks, and adding tasks.
- Keep each file small and focused — the goal is clarity, not completeness.
- Use the experiments in `implementation_plan.md` to demonstrate concepts during the interview.
