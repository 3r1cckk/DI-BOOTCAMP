import { useState } from 'react'
import { useAppSelector } from './app/hooks'
import AddTodo from './components/AddTodo'
import TodoList, { type TodoFilter } from './components/TodoList'

const filters: TodoFilter[] = ['all', 'active', 'completed']

function App() {
  const [filter, setFilter] = useState<TodoFilter>('all')
  const todos = useAppSelector((state) => state.todos.items)
  const completedCount = todos.filter((todo) => todo.completed).length
  const activeCount = todos.length - completedCount

  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="brand" href="/">To-do list</a>
      </header>

      <section className="todo-card" aria-labelledby="page-title">
        <div className="card-heading">
          <p className="eyebrow">Keep track of what you need to do.</p>
          <h1 id="page-title">
            My tasks<span>.</span>
          </h1>
        </div>

        <AddTodo />

        <div className="list-toolbar">
          <div className="list-heading">
            <h2>Your list</h2>
            <span className="task-count">
              {activeCount} {activeCount === 1 ? 'task' : 'tasks'} left
            </span>
          </div>
          <div className="filters" role="group" aria-label="Filter tasks">
            {filters.map((option) => (
              <button
                key={option}
                className={`filter-button${filter === option ? ' is-selected' : ''}`}
                type="button"
                aria-pressed={filter === option}
                onClick={() => setFilter(option)}
              >
                {option[0].toUpperCase() + option.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <TodoList filter={filter} />

        <footer className="card-footer">
          <span>{completedCount} completed</span>
          <span>{todos.length} total</span>
        </footer>
      </section>
    </main>
  )
}

export default App
