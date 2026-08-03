import { ArrowUpRight, Bell, BellOff, CalendarPlus, CircleDot, Clock3 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { downloadCalendar } from '../lib/ical'
import { formatCountdown, formatMilestoneDate, milestoneEnd, milestoneState } from '../lib/milestone'
import type { ConferenceEdition, Milestone } from '../types/conference'
import { MilestoneInfoButton } from './MilestoneInfoButton'

interface DeadlineItem {
  item: ConferenceEdition
  milestone: Milestone | null
}

interface Props {
  items: DeadlineItem[]
  followed: (item: ConferenceEdition) => boolean
  onToggleFollow: (item: ConferenceEdition) => void
  now: Date
}

function statusLabel(state: string) {
  if (state === 'open') return '当前开放'
  if (state === 'upcoming') return '即将截止'
  if (state === 'passed') return '已截止'
  if (state === 'tbd') return '等待公布'
  return '暂无日期'
}

export function DeadlineList({ items, followed, onToggleFollow, now }: Props) {
  return <section className="deadline-list" aria-label="投稿截止列表">
    <div className="deadline-list-head" aria-hidden="true"><span>日期</span><span>会议</span><span>投稿节点</span><span>剩余时间</span><span>操作</span></div>
    {items.map(({ item, milestone }) => {
      const { conference, edition } = item
      const state = milestone ? milestoneState(milestone, now) : 'missing'
      const target = milestone ? milestoneEnd(milestone) : null
      const isFollowed = followed(item)
      const detailPath = `/conference/${conference.id}/${edition.year}`
      const countdown = state === 'open' || state === 'upcoming'
        ? formatCountdown(milestone!, now)
        : state === 'passed' ? '已截止' : state === 'tbd' ? '官网尚未公布' : '暂无投稿日期'
      return <article className={`deadline-row ${state}`} key={conference.id}>
        <div className="deadline-date">
          <b>{target ? new Intl.DateTimeFormat('zh-CN', { month: 'short', day: 'numeric' }).format(target) : state === 'tbd' ? 'TBD' : '--'}</b>
          <span>{target ? target.getFullYear() : edition.year}</span>
        </div>
        <div className="deadline-conference">
          <div><span className={`ccf-badge ccf-${conference.ccf.level.toLowerCase()}`}>CCF-{conference.ccf.level}</span></div>
          <Link to={detailPath}>{conference.name} <span>{edition.year}</span></Link>
          <p>{conference.full_name}</p>
        </div>
        <div className="deadline-event">
          <strong>{milestone?.label ?? '暂无投稿截止数据'}</strong>
          <span>{milestone ? formatMilestoneDate(milestone) : '该届尚未记录摘要或论文截止节点'}</span>
        </div>
        <div className="deadline-status">
          <span className={`deadline-state ${state}`}><CircleDot size={13} /> {statusLabel(state)}</span>
          <strong><Clock3 size={14} /> {countdown}</strong>
        </div>
        <div className="deadline-actions">
          {milestone && <MilestoneInfoButton milestone={milestone} variant="icon" />}
          <button onClick={() => milestone && downloadCalendar(conference, edition, [milestone], `${conference.id}-${edition.year}-${milestone.id}.ics`)} disabled={!milestone || milestone.kind === 'tbd'} aria-label={`将 ${conference.name} 投稿截止添加到日历`} title="添加到日历"><CalendarPlus size={16} /></button>
          <button className={isFollowed ? 'followed' : ''} onClick={() => onToggleFollow(item)} aria-label={isFollowed ? `取消关注 ${conference.name}` : `关注 ${conference.name}`} title={isFollowed ? '取消关注' : '关注会议'}>{isFollowed ? <BellOff size={16} /> : <Bell size={16} />}</button>
          <Link to={detailPath}>详情 <ArrowUpRight size={14} /></Link>
        </div>
      </article>
    })}
  </section>
}
