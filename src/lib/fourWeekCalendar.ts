export function startOfCalendarWeek(value: Date): Date {
  const start = new Date(value)
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7))
  return start
}

export function addCalendarDays(value: Date, days: number): Date {
  const date = new Date(value)
  date.setDate(date.getDate() + days)
  return date
}

export function calendarDateKey(value: Date): string {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
}

export function buildFourWeekDays(now: Date): Date[] {
  const start = startOfCalendarWeek(now)
  return Array.from({ length: 28 }, (_, index) => addCalendarDays(start, index))
}
