import { useAppSelector } from '../app/hooks'
import TodoItem from './TodoItem'

export type TodoFilter = 'all' | 'active' | 'completed'

interface TodoListProps {
  filter: TodoFilter
}

function TodoList({ filter }: TodoListProps) {
  const todos = useAppSelector((state) => state.todos.items)
  const visibleTodos = todos.filter((todo) => {
    if (filter === 'active') return !todo.completed
    if (filter === 'completed') return todo.completed
    return true
  })

  if (visibleTodos.length === 0) {
    const isEmptyList = filter === 'all'

    return (
      <div className="empty-state">
        <span className="empty-icon" aria-hidden="true">
          {isEmptyList ? '✳' : '○'}
        </span>
        <p className="empty-title">
            {isEmptyList ? 'No tasks yet.' : `No ${filter} tasks.`}
        </p>
        <p className="empty-copy">
          {isEmptyList
              ? 'Add one above to get started.'
              : 'Choose another filter to see your tasks.'}
        </p>
      </div>
    )
  }

  return (
    <ul className="todo-list" aria-label={`${filter} tasks`}>
      {visibleTodos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
    </ul>
  )
}

export default TodoList
