'use client'

import { useActionState, useRef, useEffect } from 'react'
import { addTask } from '@/app/actions/auth'

export default function AddTaskForm() {
  const formRef = useRef<HTMLFormElement>(null)
  const [state, action, isPending] = useActionState(addTask, null)

  // Reset form when task is successfully added
  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset()
    }
  }, [state])

  return (
    <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
      <div className="badges-row" style={{ marginBottom: '0.5rem' }}>
        <span className="badge badge-client">
          Client Component (Form state & micro-interactions)
        </span>
      </div>

      {state?.error && (
        <div className="alert alert-error" role="alert" style={{ marginBottom: '0.75rem' }}>
          {state.error}
        </div>
      )}

      <form ref={formRef} action={action} className="task-form-inline">
        <input
          name="title"
          type="text"
          placeholder="What do you need to do? (e.g. Test RLS policy)"
          required
          disabled={isPending}
          className="input"
          id="new-task-input"
        />
        <button
          type="submit"
          disabled={isPending}
          className="btn btn-primary"
          id="add-task-btn"
          style={{ whiteSpace: 'nowrap' }}
        >
          {isPending ? 'Adding...' : 'Add Task'}
        </button>
      </form>
    </div>
  )
}
