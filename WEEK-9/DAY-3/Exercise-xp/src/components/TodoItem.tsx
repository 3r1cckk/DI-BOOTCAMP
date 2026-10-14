import { useAppDispatch } from '../app/hooks'
import { removeTodo, toggleTodo, type Todo } from '../features/todos/todoSlice'

interface TodoItemProps {
  todo: Todo
}

function TodoItem({ todo }: TodoItemProps) {
  const dispatch = useAppDispatch()

  return (
    <li className={`todo-item${todo.completed ? ' is-completed' : ''}`}>
      <button
        className="todo-check"
        type="button"
        aria-label={`${todo.completed ? 'Mark as active' : 'Complete'}: ${todo.text}`}
        aria-pressed={todo.completed}
        onClick={() => dispatch(toggleTodo(todo.id))}
      >
        {todo.completed && <span aria-hidden="true">✓</span>}
      </button>
      <span className="todo-text">{todo.text}</span>
      <button
        className="remove-button"
        type="button"
        aria-label={`Remove ${todo.text}`}
        onClick={() => dispatch(removeTodo(todo.id))}
      >
        <span aria-hidden="true">×</span>
      </button>
    </li>
  )
}

export default TodoItem
