import { useState, type FormEvent } from 'react'
import { useAppDispatch } from '../app/hooks'
import { editTask, type PlannerTask } from '../features/tasks/tasksSlice'

interface EditTaskProps {
  date: string
  task: PlannerTask
  onCancel: () => void
}

function EditTask({ date, task, onCancel }: EditTaskProps) {
  const [text, setText] = useState(task.text)
  const dispatch = useAppDispatch()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const taskText = text.trim()
    if (!taskText) return

    dispatch(editTask({ date, id: task.id, text: taskText }))
    onCancel()
  }

  return (
    <form className="edit-form" onSubmit={handleSubmit}>
      <label className="visually-hidden" htmlFor={`edit-${task.id}`}>
        Edit task
      </label>
      <input
        id={`edit-${task.id}`}
        type="text"
        value={text}
        maxLength={120}
        onChange={(event) => setText(event.target.value)}
        autoFocus
      />
      <button type="submit" disabled={!text.trim()}>
        Save
      </button>
      <button className="secondary-button" type="button" onClick={onCancel}>
        Cancel
      </button>
    </form>
  )
}

export default EditTask
