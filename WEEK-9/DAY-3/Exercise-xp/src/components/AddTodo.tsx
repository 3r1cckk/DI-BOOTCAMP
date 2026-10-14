import { useState, type FormEvent } from 'react'
import { useAppDispatch } from '../app/hooks'
import { addTodo } from '../features/todos/todoSlice'

function AddTodo() {
  const [text, setText] = useState('')
  const dispatch = useAppDispatch()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedText = text.trim()
    if (!trimmedText) return

    dispatch(addTodo(trimmedText))
    setText('')
  }

  return (
    <form className="add-form" onSubmit={handleSubmit}>
      <label className="visually-hidden" htmlFor="new-todo">
        Task
      </label>
      <input
        id="new-todo"
        type="text"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Add a task..."
        maxLength={120}
        autoComplete="off"
      />
      <button className="add-button" type="submit" disabled={!text.trim()}>
        Add
      </button>
    </form>
  )
}

export default AddTodo
