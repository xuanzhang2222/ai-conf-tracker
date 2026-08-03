import type { Conference, ConferenceEdition, Milestone } from '../types/conference'

export type MilestoneState = 'open' | 'upcoming' | 'passed' | 'tbd' | 'reference'

export function zonedLocalToUtc(value: string, timeZone = 'UTC'): Date {
  if (/Z$|[+-]\d{2}:?\d{2}$/.test(value)) return new Date(value)
  const guess = new Date(`${value}Z`)
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit',
    minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  })
  const parts = Object.fromEntries(formatter.formatToParts(guess).map((part) => [part.type, part.value]))
  const represented = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second)
  return new Date(guess.getTime() - (represented - guess.getTime()))
}

function dateOnlyValue(date: string): Date {
  return new Date(`${date}T12:00:00`)
}

export function milestoneStart(milestone: Milestone): Date | null {
  if (milestone.kind === 'instant' && milestone.at) return zonedLocalToUtc(milestone.at, milestone.timezone)
  if (milestone.kind === 'window' && milestone.start_at) return zonedLocalToUtc(milestone.start_at, milestone.timezone)
  if (milestone.kind === 'date' && milestone.date) return dateOnlyValue(milestone.date)
  return null
}

export function milestoneEnd(milestone: Milestone): Date | null {
  if (milestone.kind === 'window' && milestone.end_at) return zonedLocalToUtc(milestone.end_at, milestone.timezone)
  return milestoneStart(milestone)
}

export function milestoneState(milestone: Milestone, now = new Date()): MilestoneState {
  if (milestone.date_status === 'tbd' || milestone.kind === 'tbd') return 'tbd'
  if (milestone.date_status === 'estimated') return 'reference'
  const start = milestoneStart(milestone)
  const end = milestoneEnd(milestone)
  if (!start || !end) return 'tbd'
  if (milestone.kind === 'window' && now >= start && now < end) return 'open'
  if (now < end || (milestone.kind === 'date' && now.toDateString() === end.toDateString())) return 'upcoming'
  return 'passed'
}

export function selectNextMilestone(milestones: Milestone[], now = new Date()): Milestone | null {
  const usable = milestones.filter((item) => !['cancelled', 'superseded', 'estimated'].includes(item.date_status))
  const byTarget = (a: Milestone, b: Milestone) => (milestoneEnd(a)?.getTime() ?? Infinity) - (milestoneEnd(b)?.getTime() ?? Infinity)
  const openActions = usable.filter((item) => milestoneState(item, now) === 'open' && item.action_required).sort(byTarget)
  if (openActions.length) return openActions[0]
  const futureActions = usable.filter((item) => milestoneState(item, now) === 'upcoming' && item.action_required).sort(byTarget)
  if (futureActions.length) return futureActions[0]
  const futureInformation = usable.filter((item) => ['open', 'upcoming'].includes(milestoneState(item, now))).sort(byTarget)
  if (futureInformation.length) return futureInformation[0]
  return usable.find((item) => milestoneState(item, now) === 'tbd' && item.action_required)
    ?? usable.find((item) => milestoneState(item, now) === 'tbd')
    ?? null
}

const submissionDeadlineTypes = new Set([
  'abstract_registration', 'abstract_deadline', 'paper_deadline', 'supplementary_deadline',
  'code_deadline', 'data_deadline', 'ethics_form_deadline', 'conflict_registration_deadline',
])

export function selectDeadlineMilestone(milestones: Milestone[], now = new Date()): Milestone | null {
  const usable = milestones.filter((item) => submissionDeadlineTypes.has(item.type) && !['cancelled', 'superseded', 'estimated'].includes(item.date_status))
  const byDeadline = (a: Milestone, b: Milestone) => (milestoneEnd(a)?.getTime() ?? Infinity) - (milestoneEnd(b)?.getTime() ?? Infinity)
  const future = usable.filter((item) => ['open', 'upcoming'].includes(milestoneState(item, now))).sort(byDeadline)
  if (future.length) return future[0]
  const pending = usable.find((item) => milestoneState(item, now) === 'tbd')
  if (pending) return pending
  return usable.filter((item) => milestoneState(item, now) === 'passed').sort((a, b) => byDeadline(b, a))[0] ?? null
}

export function compareDeadlineMilestones(left: Milestone | null, right: Milestone | null, now = new Date()): number {
  const group = (milestone: Milestone | null) => {
    if (!milestone) return 1
    const state = milestoneState(milestone, now)
    if (state === 'open' || state === 'upcoming') return 0
    if (state === 'tbd') return 1
    return 2
  }
  const groupDifference = group(left) - group(right)
  if (groupDifference) return groupDifference
  if (!left || !right) return 0
  const leftTime = milestoneEnd(left)?.getTime() ?? Infinity
  const rightTime = milestoneEnd(right)?.getTime() ?? Infinity
  if (!Number.isFinite(leftTime) || !Number.isFinite(rightTime)) return 0
  return group(left) === 2 ? rightTime - leftTime : leftTime - rightTime
}

export function compareNextMilestones(left: Milestone | null, right: Milestone | null, now = new Date()): number {
  const group = (milestone: Milestone | null) => {
    if (!milestone) return 2
    const state = milestoneState(milestone, now)
    if (state === 'open' || state === 'upcoming') return 0
    if (state === 'tbd') return 1
    return 2
  }
  const groupDifference = group(left) - group(right)
  if (groupDifference) return groupDifference
  const leftTime = left ? milestoneTarget(left, now)?.getTime() ?? Infinity : Infinity
  const rightTime = right ? milestoneTarget(right, now)?.getTime() ?? Infinity : Infinity
  return leftTime - rightTime
}

export function latestEditions(items: Conference[]): ConferenceEdition[] {
  return items.map((conference) => {
    const edition = [...conference.editions].sort((a, b) => b.year - a.year)[0]
    return { conference, edition, milestones: edition.tracks.flatMap((track) => track.milestones) }
  })
}

export function milestoneTarget(milestone: Milestone, now = new Date()): Date | null {
  return milestoneState(milestone, now) === 'open' ? milestoneEnd(milestone) : milestoneStart(milestone)
}

export function formatCountdown(milestone: Milestone, now = new Date()): string {
  const target = milestoneState(milestone, now) === 'open' ? milestoneEnd(milestone) : milestoneStart(milestone)
  if (!target || milestone.kind === 'date') return milestone.kind === 'date' ? '日期级精度' : '等待官网公布'
  const diff = target.getTime() - now.getTime()
  if (diff <= 0) return '已结束'
  const days = Math.floor(diff / 86_400_000)
  const hours = Math.floor((diff % 86_400_000) / 3_600_000)
  const minutes = Math.floor((diff % 3_600_000) / 60_000)
  const seconds = Math.floor((diff % 60_000) / 1_000)
  if (days > 0) return `${days} 天 ${hours} 小时 ${minutes} 分 ${seconds} 秒`
  if (hours > 0) return `${hours} 小时 ${minutes} 分 ${seconds} 秒`
  if (minutes > 0) return `${minutes} 分 ${seconds} 秒`
  return `${Math.max(seconds, 0)} 秒`
}

export function formatMilestoneDate(milestone: Milestone, locale = 'zh-CN'): string {
  if (milestone.kind === 'tbd') return '日期待公布'
  if (milestone.kind === 'date' && milestone.date) {
    return `${new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric' }).format(dateOnlyValue(milestone.date))} · 具体时间未公布`
  }
  const date = milestone.kind === 'window' ? milestoneEnd(milestone) : milestoneStart(milestone)
  if (!date) return '日期待公布'
  const formatted = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' }).format(date)
  return `${formatted}${milestone.original_timezone ? ` · 原始 ${milestone.original_timezone}` : ''}`
}

export function phaseForType(type: string): string {
  if (/(abstract|paper|supplementary|code|data|ethics|conflict)/.test(type)) return '投稿'
  if (/(review|rebuttal|response|discussion|revision)/.test(type)) return '评审'
  if (/(notification|acceptance|withdrawal)/.test(type)) return '决定'
  if (/(camera|copyright|artifact|registration)/.test(type)) return '出版'
  return '会议'
}

export function phaseStatus(milestones: Milestone[], now = new Date()): string {
  const next = selectNextMilestone(milestones, now)
  if (!next) return '本届已归档'
  const state = milestoneState(next, now)
  if (state === 'open') return `${phaseForType(next.type)}进行中`
  if (state === 'tbd') return '等待日程公布'
  return `${phaseForType(next.type)}阶段`
}
