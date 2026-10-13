import { useState } from 'react'
import { connect } from 'react-redux'
import { addTodo, removeTodo, toggleTodo } from './actions'
import TodoForm from './components/TodoForm'
import TodoList from './components/TodoList'
import type { Todo } from './types'
import type { store } from './store'

type Filter = 'all' | 'active' | 'completed'

interface StateProps {
  todos: Todo[]
}

interface DispatchProps {
  addTodo: (text: string) => void
  toggleTodo: (id: string) => void
  removeTodo: (id: string) => void
}

type AppProps = StateProps & DispatchProps

function TodoApp({ todos, addTodo, toggleTodo, removeTodo }: AppProps) {
  const [filter, setFilter] = useState<Filter>('all')
  const completedCount = todos.filter((todo) => todo.completed).length
  const activeCount = todos.length - completedCount
  const visibleTodos = todos.filter((todo) => {
    if (filter === 'active') return !todo.completed
    if (filter === 'completed') return todo.completed
    return true
  })

  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Daily home">
          <span className="brand-mark">d.</span>
          <span>daily<span className="brand-period">.</span></span>
        </a>
        <span className="topbar-note"><span className="status-dot" /> A little progress, every day</span>
      </header>

      <section className="todo-card" aria-labelledby="page-title">
        <div className="card-heading">
          <div>
            <p className="eyebrow">YOUR SPACE, YOUR PACE</p>
            <h1 id="page-title">Make room<br />for <span>what matters.</span></h1>
          </div>
          <div className="date-badge" aria-label={`${todos.length} tasks`}>
            <span className="date-number">{String(todos.length).padStart(2, '0')}</span>
            <span className="date-label">TASKS</span>
          </div>
        </div>

        <TodoForm onAdd={addTodo} />

        <div className="list-toolbar">
          <div className="list-title">
            <h2>Today’s list</h2>
            <span className="task-count">{activeCount} left</span>
          </div>
          <div className="filters" role="group" aria-label="Filter tasks">
            {(['all', 'active', 'completed'] as const).map((option) => (
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

        <TodoList
          todos={visibleTodos}
          onToggle={toggleTodo}
          onRemove={removeTodo}
          emptyTitle={filter === 'all' ? 'Nothing on the list' : `No ${filter} tasks`}
          emptyDescription={
            filter === 'all'
              ? 'Add a task above and make today count.'
              : 'Try a different filter or add a new task.'
          }
        />

        <footer className="card-footer">
          <span>{completedCount > 0 ? `${completedCount} done — nice work.` : 'Small steps add up.'}</span>
          <span className="keyboard-hint"><kbd>↵</kbd> to add a task</span>
        </footer>
      </section>

      <p className="page-caption">A clear mind starts with a clear list.</p>
    </main>
  )
}

const mapStateToProps = (state: ReturnType<typeof store.getState>): StateProps => ({
  todos: state,
})

const mapDispatchToProps = {
  addTodo,
  toggleTodo,
  removeTodo,
}

export default connect(mapStateToProps, mapDispatchToProps)(TodoApp)
