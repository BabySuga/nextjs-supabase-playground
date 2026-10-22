import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/actions/auth'
import AddTaskForm from './AddTaskForm'
import TaskItem from './TaskItem'

interface Task {
  id: string
  user_id: string
  title: string
  is_completed: boolean
  created_at: string
}

// In Next.js 16 with cacheComponents, route segments accessing dynamic runtime data
// (like cookies() and auth checks) specify instant = false to allow server-rendered blocking navigation.
export const instant = false

export default async function TasksPage() {
  const supabase = await createClient()

  // 1. Authenticate user from session cookie
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 2. Query tasks directly from Supabase PostgreSQL
  // NOTE: Thanks to Row Level Security (RLS), this query only returns
  // rows where `auth.uid() = user_id` inside PostgreSQL.
  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false })

  const taskList: Task[] = tasks || []

  return (
    <div className="container">
      {/* Top Header */}
      <header className="header">
        <div className="header-top">
          <div>
            <h1 className="brand-title">Task Board</h1>
            <div className="badges-row">
              <span className="badge badge-server">
                Server Component (Direct DB Fetch)
              </span>
              <span className="badge badge-rls">
                RLS: auth.uid() = {user.id.slice(0, 8)}...
              </span>
            </div>
          </div>

          {/* User profile & Logout */}
          <div className="user-badge">
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                {user.email}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                UUID: <code>{user.id}</code>
              </div>
            </div>

            <form action={logout}>
              <button
                type="submit"
                className="btn btn-outline"
                id="logout-btn"
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Task Card */}
      <main className="card">
        <div className="card-header">
          <h2 className="card-title">My Tasks</h2>
          <p className="card-description">
            Tasks below are fetched on the server at request time and secured by PostgreSQL RLS.
          </p>
        </div>

        {/* Database query error banner if table is missing or connection fails */}
        {error && (
          <div className="alert alert-error" role="alert">
            <strong>Database Error:</strong> {error.message}.
            {error.message.includes('relation "public.tasks" does not exist') && (
              <p style={{ marginTop: '0.5rem' }}>
                💡 Have you run <code>supabase-schema.sql</code> in your Supabase SQL Editor?
              </p>
            )}
          </div>
        )}

        {/* Add Task Form (Client Component) */}
        <AddTaskForm />

        {/* Task List */}
        {taskList.length === 0 ? (
          <div className="task-empty">
            <p>No tasks yet. Add your first task above!</p>
          </div>
        ) : (
          <ul className="task-list" id="task-list">
            {taskList.map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}
          </ul>
        )}
      </main>

      {/* Educational Concept Guide */}
      <section className="concept-box" aria-labelledby="concepts-heading">
        <h2 id="concepts-heading" style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)' }}>
          🎓 Concepts Demonstrated in this Playground
        </h2>

        <div className="concept-grid">
          {/* Concept 1 */}
          <div className="concept-item">
            <div className="badges-row" style={{ marginBottom: '0.5rem' }}>
              <span className="badge badge-server">Concept 1</span>
            </div>
            <h3>Server vs Client Components</h3>
            <p>
              <code>app/tasks/page.tsx</code> is a <strong>Server Component</strong>.
              It queries Supabase directly on the server — eliminating client waterfall fetches and loading spinners.
              Meanwhile, <code>AddTaskForm.tsx</code> is a <strong>Client Component</strong> that manages interactive form state with React 19&apos;s <code>useActionState</code>.
            </p>
          </div>

          {/* Concept 2 */}
          <div className="concept-item">
            <div className="badges-row" style={{ marginBottom: '0.5rem' }}>
              <span className="badge badge-client">Concept 2</span>
            </div>
            <h3>Cookie-Based Supabase Auth</h3>
            <p>
              Supabase Auth sessions are stored in HTTP-only cookies via <code>@supabase/ssr</code>.
              The <code>proxy.ts</code> file intercepts incoming requests and verifies tokens before pages render, while Server Actions (in <code>app/actions/auth.ts</code>) safely mutate data.
            </p>
          </div>

          {/* Concept 3 */}
          <div className="concept-item">
            <div className="badges-row" style={{ marginBottom: '0.5rem' }}>
              <span className="badge badge-rls">Concept 3</span>
            </div>
            <h3>PostgreSQL Row Level Security</h3>
            <p>
              Security is enforced in PostgreSQL, not JavaScript:
              <br />
              <code>USING (auth.uid() = user_id)</code>
              <br />
              Even if code queries <code>select(&apos;*&apos;)</code>, PostgreSQL guarantees you only receive rows belonging to your authenticated user ID.
            </p>
          </div>
        </div>

        {/* Experiment walkthrough */}
        <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <strong style={{ color: 'var(--text-main)' }}>🧪 Try the RLS Experiment:</strong>
          <ol style={{ paddingLeft: '1.25rem', marginTop: '0.35rem', lineHeight: '1.6' }}>
            <li>Log into two different browser profiles/incognito windows with two accounts.</li>
            <li>Add distinct tasks in each account.</li>
            <li>In Supabase SQL Editor run: <code>ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;</code></li>
            <li>Refresh this page: You will now see tasks from BOTH accounts!</li>
            <li>Re-enable: <code>ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;</code> — only your own tasks appear again!</li>
          </ol>
        </div>
      </section>
    </div>
  )
}
