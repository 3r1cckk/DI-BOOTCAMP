const dateFormatter = new Intl.DateTimeFormat('en', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
})

const monthFormatter = new Intl.DateTimeFormat('en', {
  month: 'long',
  year: 'numeric',
})

export function toDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatDay(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number)
  return dateFormatter.format(new Date(year, month - 1, day))
}

export function formatMonth(date: Date): string {
  return monthFormatter.format(date)
}
