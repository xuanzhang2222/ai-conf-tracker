import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import type { Milestone } from '../types/conference'
import { MilestoneInfoButton } from './MilestoneInfoButton'

const milestone: Milestone = {
  id: 'commitment',
  label: 'EMNLP 承诺截止',
  type: 'revision_deadline',
  kind: 'date',
  date: '2026-08-02',
  date_status: 'confirmed',
  action_required: true,
  related_information: [{
    title: 'ARR 后续步骤',
    kind: 'organizer_email',
    source_label: '作者通知邮件',
    summary: '承诺截止与录用通知说明。',
    content: '请在 **2026 年 8 月 2 日** 前提交承诺。',
    links: [{ label: '提交入口', url: 'https://openreview.net/group?id=EMNLP' }],
  }],
}

afterEach(cleanup)

describe('MilestoneInfoButton', () => {
  it('打开节点相关信息，并可用 Escape 关闭', () => {
    render(<MilestoneInfoButton milestone={milestone} />)
    fireEvent.click(screen.getByRole('button', { name: '查看 EMNLP 承诺截止 的相关信息' }))
    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(screen.getByText('2026 年 8 月 2 日').tagName).toBe('STRONG')
    expect(screen.getByRole('link', { name: /提交入口/ }).getAttribute('href')).toBe('https://openreview.net/group?id=EMNLP')
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
