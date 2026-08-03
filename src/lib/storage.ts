import { useCallback, useEffect, useState } from 'react'

export type SubmissionStatus = 'planning' | 'preparing' | 'submitted' | 'reviewing' | 'rebuttal' | 'rebuttal-submitted' | 'waiting' | 'accepted' | 'rejected' | 'withdrawn'

export interface SubmissionRecord {
  conference: string
  year: number
  track: string
  status: SubmissionStatus
  paperAlias: string
  submissionId: string
  notes: string
  followed: boolean
  internalDeadline?: string
}

const STORAGE_KEY = 'ai-conf-tracker.submissions.v1'
const CHANGE_EVENT = 'ai-conf-tracker:change'

export function readRecords(): SubmissionRecord[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as SubmissionRecord[] } catch { return [] }
}

export function writeRecords(records: SubmissionRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

export function useSubmissions() {
  const [records, setRecords] = useState<SubmissionRecord[]>(() => readRecords())
  useEffect(() => {
    const sync = () => setRecords(readRecords())
    window.addEventListener(CHANGE_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => { window.removeEventListener(CHANGE_EVENT, sync); window.removeEventListener('storage', sync) }
  }, [])
  const upsert = useCallback((record: SubmissionRecord) => {
    const current = readRecords()
    const index = current.findIndex((item) => item.conference === record.conference && item.year === record.year && item.track === record.track)
    if (index >= 0) current[index] = record
    else current.push(record)
    writeRecords(current)
  }, [])
  const remove = useCallback((conference: string, year: number, track: string) => {
    writeRecords(readRecords().filter((item) => !(item.conference === conference && item.year === year && item.track === track)))
  }, [])
  const toggleFollow = useCallback((conference: string, year: number) => {
    const current = readRecords()
    const index = current.findIndex((item) => item.conference === conference && item.year === year && item.track === 'main')
    if (index >= 0) current[index] = { ...current[index], followed: !current[index].followed }
    else current.push({ conference, year, track: 'main', status: 'planning', paperAlias: '', submissionId: '', notes: '', followed: true })
    writeRecords(current)
  }, [])
  return { records, upsert, remove, toggleFollow }
}

export const submissionStatusLabels: Record<SubmissionStatus, string> = {
  planning: '计划投稿', preparing: '正在准备', submitted: '已提交', reviewing: '等待评审',
  rebuttal: '准备 Rebuttal', 'rebuttal-submitted': 'Rebuttal 已提交', waiting: '等待结果',
  accepted: '录用', rejected: '拒稿', withdrawn: '撤稿',
}
