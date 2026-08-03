import { describe, expect, it } from 'vitest'
import type { Milestone } from '../types/conference'
import { formatMilestoneDate, milestoneState, selectNextMilestone, zonedLocalToUtc } from './milestone'

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
})
