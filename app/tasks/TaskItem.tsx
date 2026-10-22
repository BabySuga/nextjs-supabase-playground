'use client'

import { useTransition } from 'react'
import { toggleTask, deleteTask } from '@/app/actions/auth'

interface TaskItemProps {
  task: {
    id: string
    title: string
    is_completed: boolean
    created_at: string
  }
}

export default function TaskItem({ task }: TaskItemProps) {
  const [isPending, startTransition] = useTransition()

  const handleToggle = () => {
    startTransition(async () => {
      await toggleTask(task.id, !task.is_completed)
    })
  }

  const handleDelete = () => {
    startTransition(async () => {
      await deleteTask(task.id)
    })
  }

  return (
    <li
      className="task-item"
      style={{
        opacity: isPending ? 0.6 : 1,
        transition: 'opacity 0.15s ease',
      }}
    >
      <div className="task-content">
        <input
          type="checkbox"
          checked={task.is_completed}
          onChange={handleToggle}
          disabled={isPending}
          className="task-checkbox"
          id={`task-check-${task.id}`}
          aria-label={`Mark "${task.title}" as ${task.is_completed ? 'incomplete' : 'complete'}`}
        />
        <span className={`task-title ${task.is_completed ? 'completed' : ''}`}>
          {task.title}
        </span>
      </div>

      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="btn btn-danger-outline"
        id={`task-delete-${task.id}`}
        title="Delete task"
      >
        Delete
      </button>
    </li>
  )
}
