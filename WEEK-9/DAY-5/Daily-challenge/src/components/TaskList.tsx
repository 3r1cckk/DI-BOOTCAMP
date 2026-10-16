import {
  memo,
  useCallback,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import {
  selectCategoryById,
  selectCompletedTasks,
  selectTasksByCategory,
} from '../features/tasks/tasksSelectors'
import {
  deleteTask,
  editTask,
  toggleTaskCompletion,
  updateTaskProgress,
  type Task,
} from '../features/tasks/tasksSlice'

interface TaskRowProps {
  task: Task
  onEdit: (id: string, title: string) => void
  onToggleCompletion: (id: string) => void
  onDelete: (id: string) => void
  onUpdateProgress: (id: string, progress: number) => void
}

const TaskRow = memo(function TaskRow({
  task,
  onEdit,
  onToggleCompletion,
  onDelete,
  onUpdateProgress,
}: TaskRowProps) {
  const category = useAppSelector((state) =>
    selectCategoryById(state, task.categoryId),
  )
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(task.title)

  const handleSave = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      const trimmedTitle = title.trim()
      if (!trimmedTitle) return

      onEdit(task.id, trimmedTitle)
      setIsEditing(false)
    },
    [onEdit, task.id, title],
  )

  const handleToggle = useCallback(
    () => onToggleCompletion(task.id),
    [onToggleCompletion, task.id],
  )

  const handleDelete = useCallback(
    () => onDelete(task.id),
    [onDelete, task.id],
  )

  const handleProgressChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onUpdateProgress(task.id, Number(event.target.value))
    },
    [onUpdateProgress, task.id],
  )

  return (
    <li className={`task-card${task.completed ? ' is-complete' : ''}`}>
      <button
        className="completion-button"
        type="button"
        aria-label={task.completed ? `Mark ${task.title} incomplete` : `Complete ${task.title}`}
        aria-pressed={task.completed}
        onClick={handleToggle}
      >
        {task.completed ? '✓' : ''}
      </button>

      <div className="task-main">
        {isEditing ? (
          <form className="task-edit-form" onSubmit={handleSave}>
            <label className="visually-hidden" htmlFor={`edit-${task.id}`}>
              Edit task name
            </label>
            <input
              id={`edit-${task.id}`}
              autoFocus
              maxLength={100}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
            <button className="text-button" type="submit">Save</button>
            <button
              className="text-button subtle-button"
              type="button"
              onClick={() => {
                setTitle(task.title)
                setIsEditing(false)
              }}
            >
              Cancel
            </button>
          </form>
        ) : (
          <div className="task-title-line">
            <h3>{task.title}</h3>
            <span
              className="task-category"
              style={{ color: category?.color }}
            >
              {category?.name ?? 'Uncategorized'}
            </span>
          </div>
        )}

        <div className="task-progress">
          <div className="progress-track" aria-hidden="true">
            <span style={{ width: `${task.progress}%` }} />
          </div>
          <label className="progress-control">
            <span className="visually-hidden">Progress for {task.title}</span>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={task.progress}
              aria-valuetext={`${task.progress}% complete`}
              onChange={handleProgressChange}
            />
            <span>{task.progress}%</span>
          </label>
        </div>
      </div>

      <div className="task-actions">
        <button
          className="icon-button"
          type="button"
          aria-label={`Edit ${task.title}`}
          onClick={() => {
            setTitle(task.title)
            setIsEditing(true)
          }}
        >
          ✎
        </button>
        <button
          className="icon-button"
          type="button"
          aria-label={`Delete ${task.title}`}
          onClick={handleDelete}
        >
          ×
        </button>
      </div>
    </li>
  )
})

interface TaskListProps {
  categoryId: string
}

function TaskList({ categoryId }: TaskListProps) {
  const dispatch = useAppDispatch()
  const tasks = useAppSelector((state) =>
    selectTasksByCategory(state, categoryId),
  )
  const completedCount = useAppSelector(selectCompletedTasks)

  const handleEdit = useCallback(
    (id: string, title: string) => dispatch(editTask({ id, title })),
    [dispatch],
  )

  const handleToggleCompletion = useCallback(
    (id: string) => dispatch(toggleTaskCompletion(id)),
    [dispatch],
  )

  const handleDelete = useCallback(
    (id: string) => dispatch(deleteTask(id)),
    [dispatch],
  )

  const handleUpdateProgress = useCallback(
    (id: string, progress: number) =>
      dispatch(updateTaskProgress({ id, progress })),
    [dispatch],
  )

  return (
    <section className="tasks-panel" aria-labelledby="task-list-heading">
      <div className="task-list-heading">
        <div>
          <p className="eyebrow">Small steps add up</p>
          <h2 id="task-list-heading">Today’s tasks</h2>
        </div>
        <span className="completed-count">
          <strong>{completedCount}</strong> completed
        </span>
      </div>

      {tasks.length > 0 ? (
        <ul className="task-list">
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onEdit={handleEdit}
              onToggleCompletion={handleToggleCompletion}
              onDelete={handleDelete}
              onUpdateProgress={handleUpdateProgress}
            />
          ))}
        </ul>
      ) : (
        <p className="empty-state">No tasks here yet. Add a task to get started.</p>
      )}
    </section>
  )
}

export default TaskList
