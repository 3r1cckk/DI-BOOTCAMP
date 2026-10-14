import { useState } from 'react'
import { useAppSelector } from '../app/hooks'
import type { PlannerTask } from '../features/tasks/tasksSlice'
import DeleteTask from './DeleteTask'
import EditTask from './EditTask'

const noTasks: PlannerTask[] = []

interface TaskRowProps {
  date: string
  task: PlannerTask
}

function TaskRow({ date, task }: TaskRowProps) {
  const [isEditing, setIsEditing] = useState(false)

  if (isEditing) {
    return <li className="task-row"><EditTask date={date} task={task} onCancel={() => setIsEditing(false)} /></li>
  }

  return (
    <li className="task-row">
      <span>{task.text}</span>
      <div className="task-actions">
        <button className="edit-button" type="button" onClick={() => setIsEditing(true)}>
          Edit
        </button>
        <DeleteTask date={date} taskId={task.id} />
      </div>
    </li>
  )
}

interface TaskListProps {
  date: string
}

function TaskList({ date }: TaskListProps) {
  const tasks = useAppSelector((state) => state.tasks.byDate[date] ?? noTasks)

  if (tasks.length === 0) {
    return (
      <div className="empty-state">
        <p>No tasks planned for this day.</p>
        <p>Add one above when you’re ready.</p>
      </div>
    )
  }

  return (
    <ul className="task-list" aria-label={`Tasks for ${date}`}>
      {tasks.map((task) => (
        <TaskRow key={task.id} date={date} task={task} />
      ))}
    </ul>
  )
}

export default TaskList
