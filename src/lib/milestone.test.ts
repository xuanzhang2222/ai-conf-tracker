import { describe, expect, it } from 'vitest'
import type { Milestone } from '../types/conference'
import { compareDeadlineMilestones, formatCountdown, formatMilestoneDate, milestoneState, selectDeadlineMilestone, selectNextMilestone, zonedLocalToUtc } from './milestone'

const source = { url: 'https://example.com/dates', label: 'Official dates', source_type: 'official_dates', verified_at: '2026-08-03T00:00:00Z' }
const instant = (id: string, at: string, action_required = true): Milestone => ({ id, label: id, type: 'paper_deadline', kind: 'instant', at, timezone: 'UTC', date_status: 'confirmed', action_required, source })

describe('selectNextMilestone', () => {
  const now = new Date('2026-08-03T10:00:00Z')

  it('优先选择正在开放且需要操作的窗口', () => {
    const open: Milestone = { id: 'rebuttal', label: 'Rebuttal', type: 'rebuttal_deadline', kind: 'window', start_at: '2026-08-01T00:00:00', end_at: '2026-08-05T00:00:00', timezone: 'UTC', date_status: 'confirmed', action_required: true, source }
    expect(selectNextMilestone([instant('paper', '2026-08-04T00:00:00'), open], now)?.id).toBe('rebuttal')
    expect(milestoneState(open, now)).toBe('open')
  })

  it('未来操作节点优先于更早的信息节点', () => {
    expect(selectNextMilestone([instant('review', '2026-08-04T00:00:00', false), instant('camera', '2026-08-05T00:00:00', true)], now)?.id).toBe('camera')
  })

  it('推测日期不会进入正式下一节点', () => {
    const estimated = { ...instant('estimate', '2026-08-04T00:00:00'), date_status: 'estimated' as const }
    expect(selectNextMilestone([estimated], now)).toBeNull()
  })
})

describe('timezone and precision', () => {
  it('正确把 AoE 转为 UTC', () => {
    expect(zonedLocalToUtc('2026-05-06T23:59:00', 'Etc/GMT+12').toISOString()).toBe('2026-05-07T11:59:00.000Z')
  })

  it('仅日期事件明确提示具体时间未公布', () => {
    const date: Milestone = { id: 'notification', label: 'Notification', type: 'notification', kind: 'date', date: '2026-09-24', date_status: 'confirmed', action_required: false, source }
    expect(formatMilestoneDate(date)).toContain('具体时间未公布')
  })

  it('倒计时精确到秒', () => {
    const deadline = instant('deadline', '2026-08-04T18:02:03')
    expect(formatCountdown(deadline, new Date('2026-08-03T10:00:00Z'))).toBe('1 天 8 小时 2 分 3 秒')
  })
})

describe('deadline list ordering', () => {
  const now = new Date('2026-08-03T10:00:00Z')
  const recentPast = instant('recent-past', '2026-08-02T00:00:00')
  const olderPast = instant('older-past', '2026-07-01T00:00:00')
  const nearFuture = instant('near-future', '2026-08-04T00:00:00')
  const farFuture = instant('far-future', '2026-09-01T00:00:00')
  const tbd: Milestone = { id: 'tbd', label: 'tbd', type: 'paper_deadline', kind: 'tbd', date_status: 'tbd', action_required: true, source }

  it('选择最近的未来截止；没有未来日期时保留待公布或最近已截止节点', () => {
    expect(selectDeadlineMilestone([farFuture, nearFuture, recentPast], now)?.id).toBe('near-future')
    expect(selectDeadlineMilestone([olderPast, tbd, recentPast], now)?.id).toBe('tbd')
    expect(selectDeadlineMilestone([olderPast, recentPast], now)?.id).toBe('recent-past')
  })

  it('投稿截止列表不被未来的回复或出版节点覆盖', () => {
    const futureResponse: Milestone = { ...farFuture, id: 'response', type: 'author_response_deadline' }
    const futureCameraReady: Milestone = { ...farFuture, id: 'camera-ready', type: 'camera_ready_deadline' }
    expect(selectDeadlineMilestone([recentPast, futureResponse, futureCameraReady], now)?.id).toBe('recent-past')
  })

  it('未来日期升序、待公布与无日期居中，并把已截止节点按最近优先放在末尾', () => {
    const values = [tbd, olderPast, farFuture, recentPast, nearFuture, null]
      .sort((a, b) => compareDeadlineMilestones(a, b, now))
      .map((item) => item?.id ?? 'missing')
    expect(values).toEqual(['near-future', 'far-future', 'tbd', 'missing', 'recent-past', 'older-past'])
  })
})
