-- ==============================================================================
-- Supabase Schema & Row Level Security (RLS) Setup
-- ==============================================================================
-- Instructions:
-- 1. Open your Supabase Dashboard: https://supabase.com/dashboard
-- 2. Select your project and navigate to the "SQL Editor" in the left sidebar.
-- 3. Click "New query", paste the contents of this file, and click "Run".
-- ==============================================================================

-- 1. Create the `tasks` table
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index user_id for faster lookups when querying a user's task list
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks (user_id);

-- 2. Enable Row Level Security (RLS)
-- CRITICAL SECURITY STEP:
-- By default, without RLS, any client holding the anon key could query `SELECT * FROM tasks`
-- and view everyone's data. Enabling RLS forces PostgreSQL to check row-level policies
-- before returning or modifying any data.
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- 3. Define RLS Policies using Supabase's `auth.uid()` helper
-- `auth.uid()` extracts the authenticated user's UUID from the incoming JWT session cookie.

-- POLICY 1: SELECT (Users can ONLY view their own tasks)
CREATE POLICY "Users can view own tasks"
  ON public.tasks
  FOR SELECT
  USING (auth.uid() = user_id);

-- POLICY 2: INSERT (Users can ONLY insert tasks with their own user_id)
CREATE POLICY "Users can insert own tasks"
  ON public.tasks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- POLICY 3: UPDATE (Users can ONLY update their own tasks)
CREATE POLICY "Users can update own tasks"
  ON public.tasks
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- POLICY 4: DELETE (Users can ONLY delete their own tasks)
CREATE POLICY "Users can delete own tasks"
  ON public.tasks
  FOR DELETE
  USING (auth.uid() = user_id);

-- ==============================================================================
-- RLS Verification Experiment (for learning / demonstration):
-- To see RLS in action during pair programming:
--   1. Log in with Account A and add a task.
--   2. Log in with Account B and add a task.
--   3. In SQL Editor run: `ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;`
--      Refresh your app: Account A will now see Account B's tasks!
--   4. Re-enable security: `ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;`
--      Refresh your app: Each account only sees their own tasks again!
-- ==============================================================================
