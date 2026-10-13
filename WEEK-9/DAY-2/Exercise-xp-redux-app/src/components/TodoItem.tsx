import type { Todo } from '../types'

interface TodoItemProps {
  todo: Todo
  onToggle: (id: string) => void
  onRemove: (id: string) => void
}

export default function TodoItem({ todo, onToggle, onRemove }: TodoItemProps) {
  return (
    <li className={`todo-item${todo.completed ? ' is-complete' : ''}`}>
      <label className="todo-label">
        <input
          className="todo-checkbox"
          type="checkbox"
          checked={todo.completed}
          onChange={() => onToggle(todo.id)}
        />
        <span className="custom-checkbox" aria-hidden="true">
          <svg viewBox="0 0 16 16" focusable="false">
            <path d="m3 8 3.2 3.2L13 4.5" />
          </svg>
        </span>
        <span className="todo-text">{todo.text}</span>
      </label>
      <button
        className="remove-button"
        type="button"
        aria-label={`Remove ${todo.text}`}
        onClick={() => onRemove(todo.id)}
      >
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <path d="M4.5 5.5h11m-9.5 0 .7 10h6.6l.7-10M8 5.5V4h4v1.5m-3 3v4m2-4v4" />
        </svg>
      </button>
    </li>
  )
}
