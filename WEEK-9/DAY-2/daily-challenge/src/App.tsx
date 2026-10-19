import { useState } from 'react'
import { connect } from 'react-redux'
import { addTask, editTask } from './actions'
import Calendar from './components/Calendar'
import TaskDialog from './components/TaskDialog'
import TaskList from './components/TaskList'
import { formatDay, toDateKey } from './dateUtils'
import type { store } from './store'
import type { PlannerTask, TaskDetails } from './types'

interface StateProps {
  tasksByDay: ReturnType<typeof store.getState>
}

interface DispatchProps {
  addTask: typeof addTask
  editTask: typeof editTask
}

type AppProps = StateProps & DispatchProps

function PlannerApp({ tasksByDay, addTask, editTask }: AppProps) {
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()))
  const [dialogTask, setDialogTask] = useState<PlannerTask | null>(null)
  const [isCreatingTask, setIsCreatingTask] = useState(false)
  const tasks = tasksByDay[selectedDate] ?? []
  const completedCount = tasks.filter((task) => task.completed).length

  function saveTask(details: TaskDetails) {
    if (dialogTask) {
      editTask(selectedDate, dialogTask.id, details)
    } else {
      addTask(selectedDate, details)
    }
    setDialogTask(null)
    setIsCreatingTask(false)
  }

  return (
    <main className="planner-shell">
      <header className="site-header">
        <a className="brand" href="/" aria-label="Daybook home">
          <span className="brand-symbol">D</span>
          <span>daybook<span className="brand-period">.</span></span>
        </a>
        <span className="header-note"><span className="header-rule" /> A little structure goes a long way</span>
      </header>

      <section className="planner-layout" aria-label="Daily planner">
        <aside className="sidebar">
          <div className="sidebar-intro">
            <p className="eyebrow">YOUR TIME, WELL SPENT</p>
            <h1>Plan the day.<br /><span>Make it count.</span></h1>
          </div>
          <Calendar selectedDate={selectedDate} onSelectDate={setSelectedDate} />
          <div className="sidebar-note">
            <span className="note-mark" aria-hidden="true">“</span>
            <p>One thing at a time.<br />That’s how it all gets done.</p>
          </div>
        </aside>

        <section className="day-panel" aria-labelledby="selected-day">
          <div className="day-heading">
            <div>
              <p className="eyebrow">YOUR DAILY PLAN</p>
              <h2 id="selected-day">{formatDay(selectedDate)}</h2>
              <p className="day-summary">
                {tasks.length === 0
                  ? 'A fresh page. Make it yours.'
                  : `${completedCount} of ${tasks.length} ${tasks.length === 1 ? 'task' : 'tasks'} complete`}
              </p>
            </div>
            <button className="primary-button add-task-button" type="button" onClick={() => setIsCreatingTask(true)}>
              <span aria-hidden="true">+</span> Add task
            </button>
          </div>

          <div className="task-section-heading">
            <h3>Schedule</h3>
            <span>{String(tasks.length).padStart(2, '0')}</span>
          </div>
          <TaskList date={selectedDate} onEdit={setDialogTask} />
          <div className="day-footer">
            <span>Keep your plans simple and your focus clear.</span>
            <input
              className="date-picker"
              type="date"
              aria-label="Choose a date"
              value={selectedDate}
              onChange={(event) => {
                if (event.target.value) setSelectedDate(event.target.value)
              }}
            />
          </div>
        </section>
      </section>

      {(isCreatingTask || dialogTask) && (
        <TaskDialog
          key={dialogTask?.id ?? 'new-task'}
          task={dialogTask ?? undefined}
          onSave={saveTask}
          onClose={() => {
            setDialogTask(null)
            setIsCreatingTask(false)
          }}
        />
      )}
    </main>
  )
}

const mapStateToProps = (state: ReturnType<typeof store.getState>): StateProps => ({
  tasksByDay: state,
})

export default connect(mapStateToProps, { addTask, editTask })(PlannerApp)
