import type { Conference, Edition, Milestone } from '../types/conference'
import { milestoneEnd, milestoneStart } from './milestone'

function icsDate(date: Date): string { return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '') }
function escape(value: string): string { return value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;') }

function event(conference: Conference, edition: Edition, milestone: Milestone): string[] {
  const lines = ['BEGIN:VEVENT', `UID:${conference.id}-${edition.year}-${milestone.id}@ai-conf-tracker`, `DTSTAMP:${icsDate(new Date())}`, `SUMMARY:${escape(`${conference.name} ${edition.year} · ${milestone.label}`)}`, `URL:${milestone.source?.url ?? edition.website}`]
  if (milestone.kind === 'date' && milestone.date) lines.push(`DTSTART;VALUE=DATE:${milestone.date.replace(/-/g, '')}`)
  else if (milestone.kind === 'instant' && milestoneStart(milestone)) lines.push(`DTSTART:${icsDate(milestoneStart(milestone)!)}`)
  else if (milestone.kind === 'window' && milestoneStart(milestone) && milestoneEnd(milestone)) lines.push(`DTSTART:${icsDate(milestoneStart(milestone)!)}`, `DTEND:${icsDate(milestoneEnd(milestone)!)}`)
  else return []
  return [...lines, 'END:VEVENT']
}

export function downloadCalendar(conference: Conference, edition: Edition, milestones: Milestone[], filename: string) {
  const events = milestones.flatMap((milestone) => event(conference, edition, milestone))
  const content = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//AI Conf Tracker//ZH-CN', 'CALSCALE:GREGORIAN', ...events, 'END:VCALENDAR', ''].join('\r\n')
  const url = URL.createObjectURL(new Blob([content], { type: 'text/calendar;charset=utf-8' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}
