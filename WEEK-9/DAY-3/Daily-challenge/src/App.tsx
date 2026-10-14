import { useState } from 'react'
import AddTask from './components/AddTask'
import DatePicker from './components/DatePicker'
import TaskList from './components/TaskList'
import { formatDate, toDateKey } from './utils/dates'

function App() {
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()))

  return (
    <main className="page">
      <header className="page-header">
        <p className="eyebrow">DAILY PLANNER</p>
        <h1>Plan your day</h1>
        <p className="intro">Keep your tasks in one place, one day at a time.</p>
      </header>

      <section className="planner" aria-labelledby="selected-date">
        <DatePicker selectedDate={selectedDate} onDateChange={setSelectedDate} />
        <div className="task-heading">
          <h2 id="selected-date">{formatDate(selectedDate)}</h2>
          <span>Tasks</span>
        </div>
        <AddTask date={selectedDate} />
        <TaskList date={selectedDate} />
      </section>

      <footer className="page-footer">Choose a date to see or plan another day.</footer>
    </main>
  )
}

export default App
