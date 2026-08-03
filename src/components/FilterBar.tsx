import { Filter, Search, SlidersHorizontal, X } from 'lucide-react'
import { eventTypeLabels, topicLabels } from '../data'

export interface Filters {
  search: string
  level: 'all' | 'A' | 'B'
  topic: string
  eventType: string
  openOnly: boolean
  futureOnly: boolean
  followedOnly: boolean
}

interface Props {
  value: Filters
  onChange: (filters: Filters) => void
  resultCount: number
}

export function FilterBar({ value, onChange, resultCount }: Props) {
  const set = <K extends keyof Filters>(key: K, next: Filters[K]) => onChange({ ...value, [key]: next })
  const activeCount = [value.level !== 'all', value.topic !== 'all', value.eventType !== 'all', value.openOnly, value.futureOnly, value.followedOnly].filter(Boolean).length
  return (
    <section className="filter-panel" aria-label="会议筛选">
      <div className="search-wrap">
        <Search size={18} />
        <input value={value.search} onChange={(event) => set('search', event.target.value)} placeholder="搜索会议名称或方向…" aria-label="搜索会议" />
        {value.search && <button onClick={() => set('search', '')} aria-label="清除搜索"><X size={16} /></button>}
      </div>
      <div className="select-wrap"><SlidersHorizontal size={16} /><select value={value.level} onChange={(event) => set('level', event.target.value as Filters['level'])} aria-label="CCF 等级"><option value="all">全部等级</option><option value="A">CCF-A</option><option value="B">CCF-B</option></select></div>
      <div className="select-wrap"><select value={value.topic} onChange={(event) => set('topic', event.target.value)} aria-label="会议方向"><option value="all">全部方向</option>{Object.entries(topicLabels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></div>
      <div className="select-wrap event-select"><select value={value.eventType} onChange={(event) => set('eventType', event.target.value)} aria-label="事件类型"><option value="all">全部事件</option>{Object.entries(eventTypeLabels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></div>
      <details className="more-filters">
        <summary><Filter size={16} /> 更多 {activeCount > 0 && <span>{activeCount}</span>}</summary>
        <div className="filter-popover">
          <label><input type="checkbox" checked={value.openOnly} onChange={(event) => set('openOnly', event.target.checked)} /> 仅开放中的会议</label>
          <label><input type="checkbox" checked={value.futureOnly} onChange={(event) => set('futureOnly', event.target.checked)} /> 仅显示未来事件</label>
          <label><input type="checkbox" checked={value.followedOnly} onChange={(event) => set('followedOnly', event.target.checked)} /> 仅已关注会议</label>
          <button onClick={() => onChange({ search: value.search, level: 'all', topic: 'all', eventType: 'all', openOnly: false, futureOnly: false, followedOnly: false })}>重置高级筛选</button>
        </div>
      </details>
      <span className="result-count">{resultCount} 个会议</span>
    </section>
  )
}
