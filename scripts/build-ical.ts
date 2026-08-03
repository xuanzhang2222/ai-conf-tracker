import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { loadConferenceData, type ConferenceData } from './schema'
import { escapeIcs, icsDate, zonedLocalToUtc } from './date-utils'

type Milestone = ConferenceData['editions'][number]['tracks'][number]['milestones'][number]

function eventLines(conference: ConferenceData, year: number, milestone: Milestone): string[] {
  if (milestone.date_status === 'tbd' || milestone.date_status === 'cancelled' || milestone.date_status === 'superseded') return []
  const summary = `${conference.name} ${year} · ${milestone.label}`
  const lines = ['BEGIN:VEVENT', `UID:${conference.id}-${year}-${milestone.id}@ai-conf-tracker`, `DTSTAMP:${icsDate(new Date())}`, `SUMMARY:${escapeIcs(summary)}`, `URL:${milestone.source?.url ?? conference.editions[0].website}`]
  if (milestone.kind === 'date' && milestone.date) {
    lines.push(`DTSTART;VALUE=DATE:${milestone.date.replace(/-/g, '')}`)
  } else if (milestone.kind === 'instant' && milestone.at) {
    lines.push(`DTSTART:${icsDate(zonedLocalToUtc(milestone.at, milestone.timezone))}`)
  } else if (milestone.kind === 'window' && milestone.start_at && milestone.end_at) {
    lines.push(`DTSTART:${icsDate(zonedLocalToUtc(milestone.start_at, milestone.timezone))}`)
    lines.push(`DTEND:${icsDate(zonedLocalToUtc(milestone.end_at, milestone.timezone))}`)
  } else return []
  lines.push('END:VEVENT')
  return lines
}

function calendar(conferences: ConferenceData[]): string {
  const events = conferences.flatMap((conference) => conference.editions.flatMap((edition) => edition.tracks.flatMap((track) => track.milestones.flatMap((milestone) => eventLines(conference, edition.year, milestone)))))
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//AI Conf Tracker//ZH-CN', 'CALSCALE:GREGORIAN', ...events, 'END:VCALENDAR', ''].join('\r\n')
}

const conferences = await loadConferenceData()
const output = path.join(process.cwd(), 'public', 'ical')
await mkdir(output, { recursive: true })
await writeFile(path.join(output, 'all.ics'), calendar(conferences))
await writeFile(path.join(output, 'ccf-a.ics'), calendar(conferences.filter((item) => item.ccf.level === 'A')))
await writeFile(path.join(output, 'ccf-b.ics'), calendar(conferences.filter((item) => item.ccf.level === 'B')))
for (const conference of conferences) await writeFile(path.join(output, `${conference.id}.ics`), calendar([conference]))
console.log(`✓ 已生成 ${conferences.length + 3} 个静态日历订阅源`)
