import { useCallback, useState } from 'react'
import CategorySelector, {
  type CategoryFilter,
} from './components/CategorySelector'
import TaskComposer from './components/TaskComposer'
import TaskList from './components/TaskList'

function App() {
  const [selectedCategoryId, setSelectedCategoryId] =
    useState<CategoryFilter>('all')

  const handleSelectCategory = useCallback(
    (categoryId: CategoryFilter) => setSelectedCategoryId(categoryId),
    [],
  )

  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Daily Focus home">
          <span className="brand-mark" aria-hidden="true">d</span>
          <span>daily focus</span>
        </a>
        <span className="topbar-note">A LITTLE PROGRESS, EVERY DAY</span>
      </header>

      <section className="content" aria-labelledby="page-title">
        <div className="intro">
          <p className="eyebrow">Make room for what matters</p>
          <h1 id="page-title">Today, at your pace<span>.</span></h1>
          <p className="intro-copy">
            Capture your tasks, group them into categories, and keep track of
            each small step along the way.
          </p>
        </div>

        <TaskComposer />

        <div className="workspace">
          <CategorySelector
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={handleSelectCategory}
          />
          <TaskList categoryId={selectedCategoryId} />
        </div>

        <footer className="page-footer">
          Progress is progress, no matter how small.
        </footer>
      </section>
    </main>
  )
}

export default App
