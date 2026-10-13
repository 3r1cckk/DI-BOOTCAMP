import type { Todo } from '../types'
import TodoItem from './TodoItem'

interface TodoListProps {
  todos: Todo[]
  onToggle: (id: string) => void
  onRemove: (id: string) => void
  emptyTitle: string
  emptyDescription: string
}

export default function TodoList({
  todos,
  onToggle,
  onRemove,
  emptyTitle,
  emptyDescription,
}: TodoListProps) {
  if (todos.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-icon" aria-hidden="true">✳</span>
        <h2>{emptyTitle}</h2>
        <p>{emptyDescription}</p>
      </div>
    )
  }

  return (
    <ul className="todo-list">
      {todos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} onToggle={onToggle} onRemove={onRemove} />
      ))}
    </ul>
  )
}
