import { useCallback, useState, type FormEvent } from 'react'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import {
  addCategory,
  deleteCategory,
  editCategory,
} from '../features/categories/categoriesSlice'

export type CategoryFilter = 'all' | string

interface CategorySelectorProps {
  selectedCategoryId: CategoryFilter
  onSelectCategory: (categoryId: CategoryFilter) => void
}

function CategorySelector({
  selectedCategoryId,
  onSelectCategory,
}: CategorySelectorProps) {
  const dispatch = useAppDispatch()
  const categories = useAppSelector((state) => state.categories)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  const handleAddCategory = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      const name = newCategoryName.trim()
      if (!name) return

      dispatch(addCategory(name))
      setNewCategoryName('')
    },
    [dispatch, newCategoryName],
  )

  const handleSaveEdit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      const name = editingName.trim()
      if (!editingCategoryId || !name) return

      dispatch(editCategory({ id: editingCategoryId, name }))
      setEditingCategoryId(null)
      setEditingName('')
    },
    [dispatch, editingCategoryId, editingName],
  )

  const handleDeleteCategory = useCallback(
    (categoryId: string) => {
      dispatch(deleteCategory(categoryId))
      if (selectedCategoryId === categoryId) onSelectCategory('all')
    },
    [dispatch, onSelectCategory, selectedCategoryId],
  )

  return (
    <aside className="category-panel" aria-labelledby="category-heading">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Organize your day</p>
          <h2 id="category-heading">Categories</h2>
        </div>
      </div>

      <div className="category-options" role="group" aria-label="Filter by category">
        <button
          className={`category-option${selectedCategoryId === 'all' ? ' is-selected' : ''}`}
          type="button"
          aria-pressed={selectedCategoryId === 'all'}
          onClick={() => onSelectCategory('all')}
        >
          <span className="category-dot all-dot" aria-hidden="true" />
          <span>All tasks</span>
        </button>

        {categories.map((category) => (
          <div className="category-row" key={category.id}>
            {editingCategoryId === category.id ? (
              <form className="category-edit-form" onSubmit={handleSaveEdit}>
                <input
                  aria-label={`Rename ${category.name}`}
                  autoFocus
                  maxLength={32}
                  value={editingName}
                  onChange={(event) => setEditingName(event.target.value)}
                />
                <button className="icon-button" type="submit" aria-label="Save category name">
                  ✓
                </button>
                <button
                  className="icon-button"
                  type="button"
                  aria-label="Cancel category edit"
                  onClick={() => setEditingCategoryId(null)}
                >
                  ×
                </button>
              </form>
            ) : (
              <>
                <button
                  className={`category-option${selectedCategoryId === category.id ? ' is-selected' : ''}`}
                  type="button"
                  aria-pressed={selectedCategoryId === category.id}
                  onClick={() => onSelectCategory(category.id)}
                >
                  <span
                    className="category-dot"
                    style={{ backgroundColor: category.color }}
                    aria-hidden="true"
                  />
                  <span>{category.name}</span>
                </button>
                <button
                  className="icon-button category-action"
                  type="button"
                  aria-label={`Rename ${category.name}`}
                  onClick={() => {
                    setEditingCategoryId(category.id)
                    setEditingName(category.name)
                  }}
                >
                  ✎
                </button>
                <button
                  className="icon-button category-action"
                  type="button"
                  aria-label={`Delete ${category.name}`}
                  onClick={() => handleDeleteCategory(category.id)}
                >
                  ×
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      <form className="add-category-form" onSubmit={handleAddCategory}>
        <label className="visually-hidden" htmlFor="new-category">
          New category name
        </label>
        <input
          id="new-category"
          maxLength={32}
          placeholder="Add a category"
          value={newCategoryName}
          onChange={(event) => setNewCategoryName(event.target.value)}
        />
        <button className="add-category-button" type="submit" aria-label="Add category">
          +
        </button>
      </form>
    </aside>
  )
}

export default CategorySelector
