import { ArrowLeft, Bell, BellOff, CalendarArrowDown, ExternalLink, Flag, GitBranch, MapPin, Save, ShieldCheck } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Timeline } from '../components/Timeline'
import { conferences, topicLabels } from '../data'
import { downloadCalendar } from '../lib/ical'
import { formatCountdown, formatMilestoneDate, phaseStatus, selectNextMilestone } from '../lib/milestone'
import { submissionStatusLabels, useSubmissions, type SubmissionRecord, type SubmissionStatus } from '../lib/storage'

export function ConferencePage() {
  const { id, year } = useParams()
  const conference = conferences.find((item) => item.id === id)
  const edition = conference?.editions.find((item) => item.year === Number(year))
  const milestones = useMemo(() => edition?.tracks.flatMap((track) => track.milestones) ?? [], [edition])
  const next = selectNextMilestone(milestones)
  const { records, upsert, toggleFollow } = useSubmissions()
  const stored = records.find((item) => item.conference === id && item.year === Number(year) && item.track === 'main')
  const blank: SubmissionRecord = { conference: id ?? '', year: Number(year), track: 'main', status: 'planning', paperAlias: '', submissionId: '', notes: '', followed: false }
  const [draft, setDraft] = useState<SubmissionRecord>(stored ?? blank)
  const [saved, setSaved] = useState(false)
  useEffect(() => { if (stored) setDraft(stored) }, [stored])

  if (!conference || !edition) return <main className="shell not-found"><h1>没有找到这届会议</h1><Link to="/">返回会议总览</Link></main>
  const followed = stored?.followed ?? false
  const venue = edition.venue.city === 'TBD' ? '地点待公布' : `${edition.venue.city}, ${edition.venue.country}`
  const repository = `https://github.com/${import.meta.env.VITE_GITHUB_REPOSITORY ?? 'OWNER/ai-conf-tracker'}`
  const save = () => { upsert({ ...draft, followed }); setSaved(true); window.setTimeout(() => setSaved(false), 1800) }

  return <main>
    <section className="detail-hero"><div className="shell">
      <Link className="back-link" to="/"><ArrowLeft size={16} /> 返回会议总览</Link>
      <div className="detail-grid">
        <div>
          <div className="detail-badges"><span className={`ccf-badge ccf-${conference.ccf.level.toLowerCase()}`}>CCF-{conference.ccf.level}</span>{conference.ccf.curated_extra && <span className="extra-badge">精选扩展 · {conference.ccf.category}</span>}<span>{edition.year}</span></div>
          <h1>{conference.name} <em>{edition.year}</em></h1><h2>{conference.full_name}</h2><p>{conference.description}</p>
          <div className="topic-row">{conference.topics.map((topic) => <span key={topic}>{topicLabels[topic] ?? topic}</span>)}</div>
          <div className="detail-meta"><span><MapPin size={15} /> {venue}</span><a href={edition.website} target="_blank" rel="noreferrer">访问官方网站 <ExternalLink size={13} /></a></div>
        </div>
        <div className="detail-next"><span className="section-kicker">CURRENT STATUS</span><h3>{phaseStatus(milestones)}</h3>{next ? <><b>{next.label}</b><time>{formatMilestoneDate(next)}</time><div className="big-countdown">{next.kind === 'tbd' ? 'TBD' : formatCountdown(next)}</div></> : <p>本届所有节点已结束。</p>}<div className="detail-actions"><button onClick={() => downloadCalendar(conference, edition, milestones, `${conference.id}-${edition.year}.ics`)}><CalendarArrowDown size={16} /> 下载全部节点</button><button className={followed ? 'followed' : ''} onClick={() => toggleFollow(conference.id, edition.year)}>{followed ? <BellOff size={16} /> : <Bell size={16} />}{followed ? '已关注' : '关注会议'}</button></div></div>
      </div>
    </div></section>
    <div className="shell detail-content">
      <section className="timeline-panel"><div className="panel-heading"><div><span className="section-kicker">MAIN TRACK</span><h2>完整生命周期</h2><p>已完成节点保留展示，所有时间按当前设备时区转换。</p></div><span className="timezone-chip">{Intl.DateTimeFormat().resolvedOptions().timeZone}</span></div><Timeline conference={conference} edition={edition} milestones={milestones} /></section>
      <aside className="detail-sidebar">
        <section className="submission-editor"><div className="side-heading"><span><Flag size={17} /></span><div><h3>我的投稿</h3><p>仅保存在当前浏览器</p></div></div><label>论文简称<input value={draft.paperAlias} onChange={(event) => setDraft({ ...draft, paperAlias: event.target.value })} placeholder="例如：RCL" /></label><label>投稿状态<select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as SubmissionStatus })}>{Object.entries(submissionStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>投稿编号<input value={draft.submissionId} onChange={(event) => setDraft({ ...draft, submissionId: event.target.value })} placeholder="可选" /></label><label>内部截止日期<input type="date" value={draft.internalDeadline ?? ''} onChange={(event) => setDraft({ ...draft, internalDeadline: event.target.value })} /></label><label>私人备注<textarea value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} placeholder="实验、合作者、待办…" rows={4} /></label><button className="primary-button full-button" onClick={save}><Save size={16} /> {saved ? '已保存在本机' : '保存投稿记录'}</button></section>
        <section className="source-card"><div className="side-heading"><span><ShieldCheck size={17} /></span><div><h3>数据来源</h3><p>{edition.sources.length} 个官方来源</p></div></div>{edition.sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer"><span><b>{source.label}</b><small>核验于 {new Date(source.verified_at).toLocaleDateString('zh-CN')}</small></span><ExternalLink size={14} /></a>)}<a className="report-link" href={`${repository}/issues/new?template=date-correction.yml&title=${encodeURIComponent(`[Date Correction] ${conference.name} ${edition.year}`)}`} target="_blank" rel="noreferrer"><GitBranch size={15} /> 报告日期错误</a></section>
      </aside>
    </div>
  </main>
}
