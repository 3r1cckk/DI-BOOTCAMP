import { connect } from 'react-redux'
import { deleteTask, toggleTask } from '../actions'
import type { store } from '../store'
import type { PlannerTask } from '../types'

interface OwnProps {
  date: string
  onEdit: (task: PlannerTask) => void
}

interface TaskListProps extends OwnProps {
  tasks: PlannerTask[]
  deleteTask: typeof deleteTask
  toggleTask: typeof toggleTask
}

function TaskList({ tasks, date, onEdit, deleteTask, toggleTask }: TaskListProps) {
  const orderedTasks = [...tasks].sort((first, second) => {
    if (!first.time) return second.time ? 1 : 0
    if (!second.time) return -1
    return first.time.localeCompare(second.time)
  })

  if (tasks.length === 0) {
    return (
      <div className="day-empty">
        <span className="empty-mark" aria-hidden="true">+</span>
        <h3>Nothing planned yet</h3>
        <p>Add a task to give this day a little direction.</p>
      </div>
    )
  }

  return (
    <ul className="task-list">
      {orderedTasks.map((task) => (
        <li className={`task-card${task.completed ? ' task-complete' : ''}`} key={task.id}>
          <label className="task-check-label">
            <input
              type="checkbox"
              checked={task.completed}
              onChange={() => toggleTask(date, task.id)}
              aria-label={`${task.completed ? 'Mark' : 'Complete'} ${task.title}`}
            />
            <span className="task-checkbox" aria-hidden="true">✓</span>
          </label>
          <div className="task-copy">
            <div className="task-title-row">
              {task.time && <time className="task-time">{task.time}</time>}
              <h3>{task.title}</h3>
            </div>
            {task.notes && <p>{task.notes}</p>}
          </div>
          <div className="task-actions">
            <button className="text-action" type="button" onClick={() => onEdit(task)}>Edit</button>
            <button
              className="text-action delete-action"
              type="button"
              onClick={() => deleteTask(date, task.id)}
              aria-label={`Delete ${task.title}`}
            >
              Delete
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}

const mapStateToProps = (
  state: ReturnType<typeof store.getState>,
  ownProps: OwnProps,
) => ({
  tasks: state[ownProps.date] ?? [],
})

export default connect(mapStateToProps, { deleteTask, toggleTask })(TaskList)
