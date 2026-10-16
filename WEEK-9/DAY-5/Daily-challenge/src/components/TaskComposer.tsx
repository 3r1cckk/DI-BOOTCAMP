import { useCallback, useState, type FormEvent } from 'react'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import { addTask } from '../features/tasks/tasksSlice'

function TaskComposer() {
  const dispatch = useAppDispatch()
  const categories = useAppSelector((state) => state.categories)
  const [title, setTitle] = useState('')
  const [categoryId, setCategoryId] = useState('')

  const selectedCategoryId =
    categories.find((category) => category.id === categoryId)?.id ??
    categories[0]?.id ??
    ''

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      const trimmedTitle = title.trim()
      if (!trimmedTitle || !selectedCategoryId) return

      dispatch(addTask({ title: trimmedTitle, categoryId: selectedCategoryId }))
      setTitle('')
    },
    [dispatch, selectedCategoryId, title],
  )

  return (
    <form className="task-composer" onSubmit={handleSubmit}>
      <label className="visually-hidden" htmlFor="task-title">
        Task name
      </label>
      <input
        id="task-title"
        maxLength={100}
        placeholder="What would you like to get done?"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
      />
      <label className="visually-hidden" htmlFor="task-category">
        Task category
      </label>
      <select
        id="task-category"
        value={selectedCategoryId}
        disabled={categories.length === 0}
        onChange={(event) => setCategoryId(event.target.value)}
      >
        {categories.length === 0 ? (
          <option value="">Add a category first</option>
        ) : (
          categories.map((category) => (
            <option value={category.id} key={category.id}>
              {category.name}
            </option>
          ))
        )}
      </select>
      <button className="primary-button" type="submit" disabled={!selectedCategoryId}>
        <span aria-hidden="true">+</span>
        Add task
      </button>
    </form>
  )
}

export default TaskComposer
