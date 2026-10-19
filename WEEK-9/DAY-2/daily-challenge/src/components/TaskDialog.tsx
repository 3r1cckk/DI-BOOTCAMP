import { useState, type FormEvent } from 'react'
import type { PlannerTask, TaskDetails } from '../types'

interface TaskDialogProps {
  task?: PlannerTask
  onSave: (details: TaskDetails) => void
  onClose: () => void
}

export default function TaskDialog({ task, onSave, onClose }: TaskDialogProps) {
  const [title, setTitle] = useState(task?.title ?? '')
  const [time, setTime] = useState(task?.time ?? '')
  const [notes, setNotes] = useState(task?.notes ?? '')
  const [submitted, setSubmitted] = useState(false)
  const titleError = submitted && title.trim().length === 0

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
    const cleanTitle = title.trim()
    if (!cleanTitle) return
    onSave({ title: cleanTitle, time, notes: notes.trim() })
  }

  return (
    <div
      className="dialog-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section className="task-dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
        <div className="dialog-heading">
          <div>
            <p className="eyebrow">{task ? 'UPDATE YOUR PLAN' : 'MAKE A PLAN'}</p>
            <h2 id="dialog-title">{task ? 'Edit task' : 'New task'}</h2>
          </div>
          <button className="dialog-close" type="button" aria-label="Close dialog" onClick={onClose}>×</button>
        </div>
        <form className="task-form" onSubmit={handleSubmit} noValidate>
          <label htmlFor="task-title">Task name</label>
          <input
            id="task-title"
            autoFocus
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={100}
            placeholder="What do you need to do?"
            aria-invalid={titleError}
            aria-describedby={titleError ? 'title-error' : undefined}
          />
          {titleError && <span className="field-error" id="title-error">Enter a task name to continue.</span>}
          <div className="form-row">
            <div className="form-field">
              <label htmlFor="task-time">Time <span>(optional)</span></label>
              <input id="task-time" type="time" value={time} onChange={(event) => setTime(event.target.value)} />
            </div>
            <div className="form-field">
              <label htmlFor="task-notes">Notes <span>(optional)</span></label>
              <input
                id="task-notes"
                type="text"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                maxLength={500}
                placeholder="Add a detail"
              />
            </div>
          </div>
          <div className="dialog-actions">
            <button className="secondary-button" type="button" onClick={onClose}>Cancel</button>
            <button className="primary-button" type="submit">{task ? 'Save changes' : 'Add to day'}</button>
          </div>
        </form>
      </section>
    </div>
  )
}
