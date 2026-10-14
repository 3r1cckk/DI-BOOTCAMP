import { useAppDispatch } from '../app/hooks'
import { deleteTask } from '../features/tasks/tasksSlice'

interface DeleteTaskProps {
  date: string
  taskId: string
}

function DeleteTask({ date, taskId }: DeleteTaskProps) {
  const dispatch = useAppDispatch()

  return (
    <button
      className="delete-button"
      type="button"
      aria-label="Delete task"
      onClick={() => dispatch(deleteTask({ date, id: taskId }))}
    >
      Delete
    </button>
  )
}

export default DeleteTask
