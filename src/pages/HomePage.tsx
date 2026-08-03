import { ArrowRight, CalendarClock, CalendarRange, CheckCircle2, CircleDot, Clock3, Globe2, ListFilter, Radio, Rows3 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ConferenceCard } from '../components/ConferenceCard'
import { FilterBar, type Filters } from '../components/FilterBar'
import { conferences, topicLabels } from '../data'
import { formatCountdown, formatMilestoneDate, latestEditions, milestoneStart, milestoneState, selectNextMilestone } from '../lib/milestone'
import { useSubmissions } from '../lib/storage'
import type { ConferenceEdition } from '../types/conference'

type View = 'next' | 'deadlines' | 'calendar'
type CalendarMode = 'month' | 'timeline' | 'list'
const submissionTypes = new Set(['abstract_registration', 'abstract_deadline', 'paper_deadline', 'supplementary_deadline'])
const defaultFilters: Filters = { search: '', level: 'all', topic: 'all', eventType: 'all', openOnly: false, futureOnly: false, followedOnly: false }

export function HomePage() {
  const [view, setView] = useState<View>('next')
  const [calendarMode, setCalendarMode] = useState<CalendarMode>('timeline')
  const [filters, setFilters] = useState<Filters>(defaultFilters)
  const [now, setNow] = useState(() => new Date())
  const { records, toggleFollow } = useSubmissions()
  useEffect(() => { const timer = window.setInterval(() => setNow(new Date()), 1_000); return () => window.clearInterval(timer) }, [])

  const entries = useMemo(() => latestEditions(conferences), [])
  const followed = (item: ConferenceEdition) => records.some((record) => record.conference === item.conference.id && record.year === item.edition.year && record.followed)
  const filtered = entries.filter((item) => {
    const haystack = `${item.conference.name} ${item.conference.full_name} ${item.conference.topics.map((id) => topicLabels[id] ?? id).join(' ')}`.toLowerCase()
    if (filters.search && !haystack.includes(filters.search.toLowerCase())) return false
    if (filters.level !== 'all' && item.conference.ccf.level !== filters.level) return false
    if (filters.topic !== 'all' && !item.conference.topics.includes(filters.topic)) return false
    if (filters.eventType !== 'all' && !item.milestones.some((milestone) => milestone.type === filters.eventType)) return false
    if (filters.openOnly && !item.milestones.some((milestone) => milestoneState(milestone, now) === 'open')) return false
    if (filters.futureOnly && !item.milestones.some((milestone) => ['upcoming', 'open'].includes(milestoneState(milestone, now)))) return false
    if (filters.followedOnly && !followed(item)) return false
    return true
  })

  const selected = (item: ConferenceEdition) => {
    const byEvent = filters.eventType === 'all' ? item.milestones : item.milestones.filter((milestone) => milestone.type === filters.eventType)
    return selectNextMilestone(view === 'deadlines' ? byEvent.filter((milestone) => submissionTypes.has(milestone.type)) : byEvent, now)
  }
  const ordered = [...filtered].sort((a, b) => {
    const left = selected(a); const right = selected(b)
    return (left ? milestoneStart(left)?.getTime() ?? Infinity : Infinity) - (right ? milestoneStart(right)?.getTime() ?? Infinity : Infinity)
  })
  const upcomingEvents = entries.flatMap((item) => item.milestones.map((milestone) => ({ item, milestone }))).filter(({ milestone }) => ['upcoming', 'open'].includes(milestoneState(milestone, now))).sort((a, b) => (milestoneStart(a.milestone)?.getTime() ?? Infinity) - (milestoneStart(b.milestone)?.getTime() ?? Infinity))
  const featured = upcomingEvents[0]
  const confirmedCount = entries.flatMap((item) => item.milestones).filter((milestone) => milestone.date_status === 'confirmed').length
  const withinThirtyDays = upcomingEvents.filter(({ milestone }) => { const date = milestoneStart(milestone); return date && date.getTime() - now.getTime() <= 30 * 86_400_000 }).length
  const agenda = filtered.flatMap((item) => item.milestones
    .filter((milestone) => filters.eventType === 'all' || milestone.type === filters.eventType)
    .filter((milestone) => milestone.kind !== 'tbd')
    .filter((milestone) => !filters.futureOnly || ['upcoming', 'open'].includes(milestoneState(milestone, now)))
    .map((milestone) => ({ item, milestone, date: milestoneStart(milestone)! })))
    .filter((value) => value.date).sort((a, b) => a.date.getTime() - b.date.getTime())
  const agendaGroups = agenda.reduce((groups, entry) => {
    const key = new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long' }).format(entry.date)
    const group = groups.get(key) ?? []
    group.push(entry)
    groups.set(key, group)
    return groups
  }, new Map<string, typeof agenda>())

  return <>
    <section className="hero-section"><div className="shell hero-grid">
      <div className="hero-copy">
        <div className="eyebrow"><Radio size={14} /> 投稿全生命周期追踪</div>
        <h1>下一场重要节点，<br /><em>提前看见。</em></h1>
        <p>专注 CCF-A/B 人工智能会议。从摘要注册到 Rebuttal、录用通知与 Camera-ready，一个时间线持续追踪。</p>
        <div className="hero-stats"><div><b>23</b><span>精选会议</span></div><div><b>{confirmedCount}</b><span>已确认节点</span></div><div><b>{withinThirtyDays}</b><span>30 天内节点</span></div></div>
      </div>
      <div className="hero-signal">
        <div className="signal-header"><span><CircleDot size={15} /> 最近节点</span><span className="live-pill">LIVE</span></div>
        {featured ? <><div className="signal-conf"><span className={`ccf-badge ccf-${featured.item.conference.ccf.level.toLowerCase()}`}>CCF-{featured.item.conference.ccf.level}</span><span>{featured.item.conference.name} {featured.item.edition.year}</span></div><h2>{featured.milestone.label}</h2><p>{formatMilestoneDate(featured.milestone)}</p><div className="signal-countdown"><Clock3 size={18} /><span>剩余</span><strong>{formatCountdown(featured.milestone, now)}</strong></div><Link to={`/conference/${featured.item.conference.id}/${featured.item.edition.year}`}>查看完整时间线 <ArrowRight size={16} /></Link></> : <div className="empty-signal"><CheckCircle2 size={28} /> 暂无即将到来的已确认节点</div>}
        <div className="signal-footer"><Globe2 size={14} /> 已转换为 {Intl.DateTimeFormat().resolvedOptions().timeZone}</div>
      </div>
    </div></section>

    <main className="shell main-content">
      <div className="section-heading"><div><span className="section-kicker">CONFERENCE BOARD</span><h2>会议生命周期</h2><p>日期以官方来源为准，下一节点会随时间自动切换。</p></div><div className="view-tabs" role="tablist" aria-label="首页视图"><button className={view === 'next' ? 'active' : ''} onClick={() => setView('next')}><CalendarClock size={16} /> 下一节点</button><button className={view === 'deadlines' ? 'active' : ''} onClick={() => setView('deadlines')}><ListFilter size={16} /> 投稿截止</button><button className={view === 'calendar' ? 'active' : ''} onClick={() => setView('calendar')}><CalendarRange size={16} /> 完整日历</button></div></div>
      <FilterBar value={filters} onChange={setFilters} resultCount={filtered.length} />
      {view !== 'calendar' ? <><div className="board-caption"><span>{view === 'next' ? '按最近有效节点排序' : '仅摘要、论文与附录截止'}</span><span>本地时间 · 自动更新</span></div><div className="conference-grid">{ordered.map((item) => <ConferenceCard key={item.conference.id} item={item} milestone={selected(item)} followed={followed(item)} onToggleFollow={() => toggleFollow(item.conference.id, item.edition.year)} now={now} />)}</div></> : <section className="calendar-board">
        <div className="calendar-toolbar"><div><b>{agenda.length}</b> 个已公布节点</div><div className="calendar-modes"><button className={calendarMode === 'month' ? 'active' : ''} onClick={() => setCalendarMode('month')}>月视图</button><button className={calendarMode === 'timeline' ? 'active' : ''} onClick={() => setCalendarMode('timeline')}>时间线</button><button className={calendarMode === 'list' ? 'active' : ''} onClick={() => setCalendarMode('list')}><Rows3 size={14} /> 列表</button></div></div>
        <div className={`agenda agenda-${calendarMode}`}>{[...agendaGroups.entries()].map(([month, events]) => <section className="agenda-month" key={month}><h3>{month}<span>{events.length} 个节点</span></h3><div className="agenda-events">{events.map(({ item, milestone, date }) => <Link to={`/conference/${item.conference.id}/${item.edition.year}`} className={`agenda-event ${milestoneState(milestone, now)}`} key={`${item.conference.id}-${milestone.id}`}><time><b>{date.getDate().toString().padStart(2, '0')}</b><span>{new Intl.DateTimeFormat('zh-CN', { weekday: 'short' }).format(date)}</span></time><i /><div><strong>{item.conference.name} {item.edition.year}</strong><span>{milestone.label}</span></div><span className={`ccf-badge ccf-${item.conference.ccf.level.toLowerCase()}`}>CCF-{item.conference.ccf.level}</span></Link>)}</div></section>)}</div>
      </section>}
      {filtered.length === 0 && <div className="empty-state"><ListFilter size={28} /><h3>没有匹配的会议</h3><p>试试减少筛选条件或清除搜索词。</p><button className="primary-button" onClick={() => setFilters(defaultFilters)}>重置筛选</button></div>}
    </main>

    <section className="trust-strip"><div className="shell trust-grid"><div><span className="trust-icon"><Radio size={20} /></span><div><b>自动发现官网变化</b><p>每天对官方页面正文做哈希比对，变化时自动创建 Issue。</p></div></div><div><span className="trust-icon"><CheckCircle2 size={20} /></span><div><b>人工确认正式日期</b><p>抓取程序只负责发现，不会自动覆盖已经发布的数据。</p></div></div><div><span className="trust-icon"><Globe2 size={20} /></span><div><b>时区透明可追溯</b><p>同时保留原始时区、本地时间、来源与最后核验日期。</p></div></div></div></section>
  </>
}
