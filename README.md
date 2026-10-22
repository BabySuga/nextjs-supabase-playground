# Next.js + Supabase Playground

A beginner-friendly, minimal playground built with Next.js App Router (16.4+), TypeScript, plain CSS, `@supabase/supabase-js`, and `@supabase/ssr`.

It demonstrates three core full-stack architectural concepts:
1. **Server Components vs Client Components** (direct server data fetching vs interactive form state).
2. **Supabase Auth with HTTP-only Cookies** (using `@supabase/ssr` and Next.js 16 `proxy.ts`).
3. **PostgreSQL Row Level Security (RLS)** using `auth.uid() = user_id`.

---

## 🚀 Quick Start

### 1. Configure Environment Variables
Copy `.env.example` to `.env.local` if you haven't already:
```bash
cp .env.example .env.local
```

Open `.env.local` and insert your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

> **Security Warning:** NEVER expose or add the `service_role` secret key to client code or `.env.local`. Only use the public `anon` key.

### 2. Supabase Dashboard Setup
1. Log in to [Supabase](https://supabase.com/dashboard) and create a new project.
2. Go to the **SQL Editor** tab from the left sidebar.
3. Open [`supabase-schema.sql`](./supabase-schema.sql) in this repository, paste the SQL statements into the SQL editor, and click **Run**.
4. Retrieve your keys from **Project Settings → API**:
   - Copy **Project URL**
   - Copy **anon public** key
5. *(Optional for local testing)*: In **Authentication → Providers → Email**, you can disable **"Confirm email"** to allow immediate logins without waiting for confirmation emails.

### 3. Install Dependencies
```bash
npm install
```

### 4. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Stopping the Server
Press `Ctrl + C` in the terminal where `npm run dev` is running.

---

## 🛠️ Architecture & Concepts

### 1. Server Components vs Client Components
- [`app/tasks/page.tsx`](file:///home/lintangad/Projects/nextjs-supabase-playground/app/tasks/page.tsx): **Server Component**. Fetches user session and task data directly on the server before streaming HTML. Zero client-side `useEffect`, no network waterfalls, no loading spinners.
- [`app/tasks/AddTaskForm.tsx`](file:///home/lintangad/Projects/nextjs-supabase-playground/app/tasks/AddTaskForm.tsx): **Client Component**. Manages interactive input state and pending button feedback via React 19's `useActionState`, then invokes Server Actions in `app/actions/auth.ts`.
- [`app/tasks/TaskItem.tsx`](file:///home/lintangad/Projects/nextjs-supabase-playground/app/tasks/TaskItem.tsx): **Client Component**. Handles task toggling and deletion using React transitions.

### 2. Supabase Auth with Cookies (`@supabase/ssr`)
- [`lib/supabase/server.ts`](file:///home/lintangad/Projects/nextjs-supabase-playground/lib/supabase/server.ts): Uses `createServerClient` and `cookies()` (awaited in Next.js 16) to read and write session cookies.
- [`lib/supabase/client.ts`](file:///home/lintangad/Projects/nextjs-supabase-playground/lib/supabase/client.ts): Uses `createBrowserClient` for client-side interactions.
- [`proxy.ts`](file:///home/lintangad/Projects/nextjs-supabase-playground/proxy.ts): Next.js 16 proxy convention (replaces deprecated `middleware.ts`). Refreshes expired sessions and enforces route guards (`/tasks` requires an active session).
- [`app/actions/auth.ts`](file:///home/lintangad/Projects/nextjs-supabase-playground/app/actions/auth.ts): Server Actions for `login`, `signup`, `logout`, `addTask`, `toggleTask`, and `deleteTask`.

### 3. PostgreSQL Row Level Security (RLS)
The `tasks` table has RLS enabled with policies:
```sql
CREATE POLICY "Users can view own tasks" ON public.tasks
  FOR SELECT USING (auth.uid() = user_id);
```
Even if the client executes `supabase.from('tasks').select('*')`, PostgreSQL extracts the authenticated user's ID from the JWT (`auth.uid()`) and guarantees only their rows are returned.

### 🧪 RLS Demonstration Experiment
1. Create Account A and add tasks.
2. Open an Incognito window, create Account B, and add different tasks.
3. In Supabase SQL Editor run: `ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;`
4. Refresh both browsers: Both users will now see all tasks from everyone!
5. In SQL Editor run: `ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;`
6. Refresh both browsers: Isolation is restored immediately without changing any application code.
