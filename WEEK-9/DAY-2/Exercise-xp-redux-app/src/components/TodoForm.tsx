import { useState, type FormEvent } from 'react'

interface TodoFormProps {
  onAdd: (text: string) => void
}

export default function TodoForm({ onAdd }: TodoFormProps) {
  const [text, setText] = useState('')
  const trimmedText = text.trim()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!trimmedText) return

    onAdd(trimmedText)
    setText('')
  }

  return (
    <form className="todo-form" onSubmit={handleSubmit}>
      <label className="sr-only" htmlFor="new-todo">
        Add a task
      </label>
      <span className="form-plus" aria-hidden="true">+</span>
      <input
        id="new-todo"
        type="text"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="What needs to get done?"
        autoComplete="off"
      />
      <button className="add-button" type="submit" disabled={!trimmedText}>
        Add task <span aria-hidden="true">↗</span>
      </button>
    </form>
  )
}
