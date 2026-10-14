import { fromDateKey, shiftDate, toDateKey } from '../utils/dates'

interface DatePickerProps {
  selectedDate: string
  onDateChange: (date: string) => void
}

function DatePicker({ selectedDate, onDateChange }: DatePickerProps) {
  const today = toDateKey(new Date())
  const isToday = selectedDate === today

  return (
    <section className="date-section" aria-label="Choose a day">
      <div className="date-navigation">
        <button
          className="day-button"
          type="button"
          aria-label="Previous day"
          onClick={() => onDateChange(shiftDate(selectedDate, -1))}
        >
          ←
        </button>
        <div>
          <p className="date-label">{isToday ? 'Today' : 'Selected day'}</p>
          <h2>{new Intl.DateTimeFormat(undefined, { weekday: 'long' }).format(fromDateKey(selectedDate))}</h2>
        </div>
        <button
          className="day-button"
          type="button"
          aria-label="Next day"
          onClick={() => onDateChange(shiftDate(selectedDate, 1))}
        >
          →
        </button>
      </div>
      <div className="date-tools">
        <input
          aria-label="Select date"
          type="date"
          value={selectedDate}
          onChange={(event) => {
            if (event.target.value) onDateChange(event.target.value)
          }}
        />
        {!isToday && (
          <button className="text-button" type="button" onClick={() => onDateChange(today)}>
            Go to today
          </button>
        )}
      </div>
    </section>
  )
}

export default DatePicker
