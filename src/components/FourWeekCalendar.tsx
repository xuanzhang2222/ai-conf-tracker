import { Bell, BellOff, CalendarDays, CalendarPlus, Clock3 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { addCalendarDays, buildFourWeekDays, calendarDateKey } from '../lib/fourWeekCalendar'
import { downloadCalendar } from '../lib/ical'
import { formatCountdown, formatMilestoneDate, milestoneState, milestoneTarget } from '../lib/milestone'
import type { ConferenceEdition, Milestone } from '../types/conference'
import { MilestoneInfoButton } from './MilestoneInfoButton'

interface CalendarItem {
  item: ConferenceEdition
  milestone: Milestone | null
}

interface Props {
  items: CalendarItem[]
  followed: (item: ConferenceEdition) => boolean
  onToggleFollow: (item: ConferenceEdition) => void
  now: Date
}

const weekdays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

function rangeLabel(start: Date, end: Date) {
  const startLabel = new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' }).format(start)
  const endLabel = new Intl.DateTimeFormat('zh-CN', {
    year: start.getFullYear() === end.getFullYear() ? undefined : 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(end)
  return `${startLabel} — ${endLabel}`
}

function compactTime(milestone: Milestone, target: Date) {
  if (milestone.kind === 'date') return '日期级'
  return new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit' }).format(target)
}

export function FourWeekCalendar({ items, followed, onToggleFollow, now }: Props) {
  const days = buildFourWeekDays(now)
  const windowStart = days[0]
  const windowEnd = addCalendarDays(windowStart, 28)
  const todayKey = calendarDateKey(now)
  const datedItems = items.flatMap(({ item, milestone }) => {
    const target = milestone ? milestoneTarget(milestone, now) : null
    return milestone && target ? [{ item, milestone, target }] : []
  })
  const visibleItems = datedItems
    .filter(({ target }) => target >= windowStart && target < windowEnd)
    .sort((a, b) => a.target.getTime() - b.target.getTime() || a.item.conference.name.localeCompare(b.item.conference.name))
  const grouped = visibleItems.reduce((map, entry) => {
    const key = calendarDateKey(entry.target)
    const group = map.get(key) ?? []
    group.push(entry)
    map.set(key, group)
    return map
  }, new Map<string, typeof visibleItems>())
  const outsideCount = items.length - visibleItems.length

  return <section className="week-calendar" aria-label="当前周和未来三周的下一节点日历">
    <header className="week-calendar-toolbar">
      <div><span><CalendarDays size={15} /> FOUR-WEEK WINDOW</span><strong>{rangeLabel(windowStart, days[27])}</strong></div>
      <div><b>{visibleItems.length}</b><span>4 周内节点</span></div>
    </header>
    <div className="week-calendar-scroll">
      <div className="week-calendar-grid" role="grid" aria-label="四周日历">
        {weekdays.map((weekday, index) => <div className={`week-calendar-weekday ${index > 4 ? 'weekend' : ''}`} role="columnheader" key={weekday}>{weekday}</div>)}
        {days.map((date, index) => {
          const key = calendarDateKey(date)
          const events = grouped.get(key) ?? []
          const isToday = key === todayKey
          const isCurrentWeek = index < 7
          const isWeekend = index % 7 > 4
          return <section className={`week-calendar-day${isToday ? ' today' : ''}${isCurrentWeek ? ' current-week' : ''}${isWeekend ? ' weekend' : ''}${events.length ? ' has-events' : ''}`} role="gridcell" aria-label={`${new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' }).format(date)}，${events.length} 个节点`} key={key}>
            <div className="week-calendar-date"><time dateTime={key}><b>{date.getDate()}</b><span>{date.getDate() === 1 || index % 7 === 0 ? `${date.getMonth() + 1}月` : ''}</span></time>{isToday && <em>今天</em>}</div>
            <div className="week-calendar-events">{events.map(({ item, milestone, target }) => {
              const { conference, edition } = item
              const state = milestoneState(milestone, now)
              const detailPath = `/conference/${conference.id}/${edition.year}`
              const isFollowed = followed(item)
              return <article className={`week-calendar-event ${state}`} key={`${conference.id}-${milestone.id}`} title={formatMilestoneDate(milestone)}>
                <div className="week-calendar-event-head">
                  <Link to={detailPath}>{conference.name} <span>{edition.year}</span></Link>
                  <span className={`week-calendar-level ccf-${conference.ccf.level.toLowerCase()}`}>{conference.ccf.level}</span>
                </div>
                <Link className="week-calendar-event-body" to={detailPath}>
                  <strong>{milestone.label}</strong>
                  <span><Clock3 size={11} /> {compactTime(milestone, target)} · {formatCountdown(milestone, now)}</span>
                </Link>
                <div className="week-calendar-event-actions">
                  <MilestoneInfoButton milestone={milestone} variant="icon" />
                  <button type="button" onClick={() => downloadCalendar(conference, edition, [milestone], `${conference.id}-${edition.year}-${milestone.id}.ics`)} aria-label={`将 ${conference.name} ${milestone.label} 添加到日历`} title="添加到日历"><CalendarPlus size={13} /></button>
                  <button type="button" className={isFollowed ? 'followed' : ''} onClick={() => onToggleFollow(item)} aria-label={isFollowed ? `取消关注 ${conference.name}` : `关注 ${conference.name}`} title={isFollowed ? '取消关注' : '关注会议'}>{isFollowed ? <BellOff size={13} /> : <Bell size={13} />}</button>
                </div>
              </article>
            })}</div>
          </section>
        })}
      </div>
    </div>
    <footer><span><i /> 当前周</span><span><i /> 今天</span><p>{outsideCount > 0 ? `${outsideCount} 个会议的下一节点位于此窗口之后或尚待公布` : '所有匹配会议的下一节点均在四周窗口内'}</p></footer>
  </section>
}
