import { connect } from 'react-redux'
import { formatDay, toDateKey } from '../dateUtils'
import type { store } from '../store'

interface CalendarProps {
  selectedDate: string
  onSelectDate: (date: string) => void
  tasksByDay: ReturnType<typeof store.getState>
}

function Calendar({ selectedDate, onSelectDate, tasksByDay }: CalendarProps) {
  const selected = new Date(`${selectedDate}T00:00:00`)
  const weekday = (selected.getDay() + 6) % 7
  const monday = new Date(selected)
  monday.setDate(selected.getDate() - weekday)
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + index)
    return date
  })

  return (
    <section className="calendar-panel" aria-label="Choose a day">
      <div className="calendar-heading">
        <div>
          <p className="eyebrow">THIS WEEK</p>
          <h2>{formatDay(selectedDate)}</h2>
        </div>
        <label className="date-picker-label">
          <span>Pick a date</span>
          <input
            type="date"
            aria-label="Choose a date"
            value={selectedDate}
            onChange={(event) => {
              if (event.target.value) onSelectDate(event.target.value)
            }}
          />
        </label>
      </div>
      <div className="week-strip" role="group" aria-label="Days this week">
        {days.map((date) => {
          const dateKey = toDateKey(date)
          const count = tasksByDay[dateKey]?.length ?? 0
          const isSelected = dateKey === selectedDate
          return (
            <button
              className={`week-day${isSelected ? ' is-selected' : ''}`}
              key={dateKey}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelectDate(dateKey)}
            >
              <span className="week-day-name">{date.toLocaleDateString('en', { weekday: 'short' })}</span>
              <span className="week-day-number">{date.getDate()}</span>
              <span className={`week-day-marker${count > 0 ? ' has-tasks' : ''}`} aria-hidden="true" />
            </button>
          )
        })}
      </div>
    </section>
  )
}

const mapStateToProps = (state: ReturnType<typeof store.getState>) => ({
  tasksByDay: state,
})

export default connect(mapStateToProps)(Calendar)
