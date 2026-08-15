import { describe, expect, it } from 'vitest'
import { buildFourWeekDays, calendarDateKey, startOfCalendarWeek } from '../lib/fourWeekCalendar'

describe('four-week calendar', () => {
  it('starts on Monday of the current week and always returns 28 days', () => {
    const now = new Date(2026, 7, 15, 9, 30)
    const days = buildFourWeekDays(now)

    expect(days).toHaveLength(28)
    expect(calendarDateKey(days[0])).toBe('2026-08-10')
    expect(calendarDateKey(days[27])).toBe('2026-09-06')
    expect(days[0].getDay()).toBe(1)
    expect(days[27].getDay()).toBe(0)
  })

  it('normalizes the week start to local midnight', () => {
    const start = startOfCalendarWeek(new Date(2026, 7, 16, 23, 59, 59))

    expect(calendarDateKey(start)).toBe('2026-08-10')
    expect([start.getHours(), start.getMinutes(), start.getSeconds(), start.getMilliseconds()]).toEqual([0, 0, 0, 0])
  })
})
