import { ArrowUpRight, Bell, BellOff, CalendarPlus, Check, Clock3, CircleDot, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import { topicLabels } from '../data'
import { downloadCalendar } from '../lib/ical'
import { formatCountdown, formatMilestoneDate, milestoneState, phaseForType, phaseStatus } from '../lib/milestone'
import type { ConferenceEdition, Milestone } from '../types/conference'

interface Props {
  item: ConferenceEdition
  milestone: Milestone | null
  followed: boolean
  onToggleFollow: () => void
  now: Date
}

const phaseTypes = ['投稿', '评审', '决定', '出版', '会议']

export function ConferenceCard({ item, milestone, followed, onToggleFollow, now }: Props) {
  const { conference, edition, milestones } = item
  const state = milestone ? milestoneState(milestone, now) : 'passed'
  const currentPhase = milestone ? phaseForType(milestone.type) : '会议'
  const passedCount = milestones.filter((value) => milestoneState(value, now) === 'passed').length
  const progress = milestones.length ? Math.round((passedCount / milestones.length) * 100) : 0
  const venue = edition.venue.city === 'TBD' ? '地点待公布' : `${edition.venue.city}, ${edition.venue.country}`

  return (
    <article className={`conference-card ${state === 'open' ? 'is-open' : ''}`}>
      <div className="card-topline">
        <div className="conference-identity">
          <span className={`ccf-badge ccf-${conference.ccf.level.toLowerCase()}`}>CCF-{conference.ccf.level}</span>
        </div>
        <button className={followed ? 'icon-button followed' : 'icon-button'} onClick={onToggleFollow} aria-label={followed ? `取消关注 ${conference.name}` : `关注 ${conference.name}`}>
          {followed ? <BellOff size={17} /> : <Bell size={17} />}
        </button>
      </div>
      <div className="card-title-row">
        <div><h3>{conference.name} <span>{edition.year}</span></h3><p>{conference.full_name}</p></div>
      </div>
      <div className="topic-row">{conference.topics.slice(0, 2).map((topic) => <span key={topic}>{topicLabels[topic] ?? topic}</span>)}</div>
      <div className="venue-line"><MapPin size={14} /> {venue}<span>·</span>{phaseStatus(milestones, now)}</div>

      <div className="next-milestone">
        {milestone ? <>
          <div className="milestone-heading">
            <span className={`state-dot ${state}`}><CircleDot size={13} />{state === 'open' ? '当前开放' : state === 'tbd' ? '等待公布' : '下一节点'}</span>
            <button onClick={() => downloadCalendar(conference, edition, [milestone], `${conference.id}-${edition.year}-${milestone.id}.ics`)} disabled={milestone.kind === 'tbd'} aria-label="将此节点添加到日历"><CalendarPlus size={16} /></button>
          </div>
          <strong>{milestone.label}</strong>
          <time>{formatMilestoneDate(milestone)}</time>
          <div className="countdown"><Clock3 size={16} /><span>{state === 'open' ? '距离关闭' : state === 'tbd' ? '官网尚未公布日期' : '距离节点'}</span><b>{state === 'tbd' ? 'TBD' : formatCountdown(milestone, now)}</b></div>
        </> : <div className="archived"><Check size={18} /> 本届全部节点已结束</div>}
      </div>

      <div className="mini-timeline" aria-label={`生命周期进度 ${progress}%`}>
        <div className="timeline-track"><i style={{ width: `${progress}%` }} /></div>
        <div className="timeline-labels">{phaseTypes.map((phase) => <span key={phase} className={phase === currentPhase ? 'active' : ''}>{phase}</span>)}</div>
      </div>
      <div className="card-footer">
        <span>核验 {new Date(edition.sources[0].verified_at).toLocaleDateString('zh-CN')}</span>
        <Link to={`/conference/${conference.id}/${edition.year}`}>查看完整时间线 <ArrowUpRight size={15} /></Link>
      </div>
    </article>
  )
}
