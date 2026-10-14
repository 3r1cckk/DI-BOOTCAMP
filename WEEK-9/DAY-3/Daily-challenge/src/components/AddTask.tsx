import { useState, type FormEvent } from 'react'
import { useAppDispatch } from '../app/hooks'
import { addTask } from '../features/tasks/tasksSlice'

interface AddTaskProps {
  date: string
}

function AddTask({ date }: AddTaskProps) {
  const [text, setText] = useState('')
  const dispatch = useAppDispatch()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const taskText = text.trim()
    if (!taskText) return

    dispatch(addTask({ date, text: taskText }))
    setText('')
  }

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <label className="visually-hidden" htmlFor="new-task">
        New task
      </label>
      <input
        id="new-task"
        type="text"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Add a task for this day"
        maxLength={120}
      />
      <button type="submit" disabled={!text.trim()}>
        Add task
      </button>
    </form>
  )
}

export default AddTask
