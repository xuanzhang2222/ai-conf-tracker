import { CalendarPlus, Check, Circle, Clock3, ExternalLink } from 'lucide-react'
import { downloadCalendar } from '../lib/ical'
import { formatMilestoneDate, milestoneState, phaseForType } from '../lib/milestone'
import type { Conference, Edition, Milestone } from '../types/conference'
import { MilestoneInfoButton } from './MilestoneInfoButton'

interface Props { conference: Conference; edition: Edition; milestones: Milestone[]; now?: Date }
const phases = ['投稿', '评审', '决定', '出版', '会议']
const statusLabels = { confirmed: '已确认', tentative: '暂定', estimated: '根据往届推测', tbd: '日期待公布', cancelled: '已取消', superseded: '已替代' }

export function Timeline({ conference, edition, milestones, now = new Date() }: Props) {
  return <div className="full-timeline">
    {phases.map((phase) => {
      const events = milestones.filter((item) => phaseForType(item.type) === phase)
      if (!events.length) return null
      return <section className="timeline-group" key={phase}>
        <div className="phase-label"><span>{phase}</span><i /></div>
        <div className="timeline-events">
          {events.map((milestone) => {
            const state = milestoneState(milestone, now)
            return <article className={`timeline-event ${state}`} key={milestone.id}>
              <div className="event-marker">{state === 'passed' ? <Check size={14} /> : state === 'open' ? <Clock3 size={14} /> : <Circle size={12} />}</div>
              <div className="event-content">
                <div className="event-title"><h4>{milestone.label}</h4><span className={`status-pill status-${milestone.date_status}`}>{statusLabels[milestone.date_status]}</span>{milestone.action_required && <span className="action-pill">需操作</span>}<MilestoneInfoButton milestone={milestone} /></div>
                <time>{formatMilestoneDate(milestone)}</time>
                {milestone.source && <a href={milestone.source.url} target="_blank" rel="noreferrer">{milestone.source.label} <ExternalLink size={12} /></a>}
              </div>
              <button className="icon-button" onClick={() => downloadCalendar(conference, edition, [milestone], `${conference.id}-${edition.year}-${milestone.id}.ics`)} disabled={milestone.kind === 'tbd'} aria-label={`将 ${milestone.label} 添加到日历`}><CalendarPlus size={16} /></button>
            </article>
          })}
        </div>
      </section>
    })}
  </div>
}
