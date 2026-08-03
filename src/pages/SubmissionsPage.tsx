import { ArrowRight, Download, FileJson, Inbox, ShieldCheck, Trash2, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { conferences } from '../data'
import { submissionStatusLabels, useSubmissions, writeRecords, type SubmissionRecord } from '../lib/storage'

export function SubmissionsPage() {
  const { records, remove } = useSubmissions()
  const fileRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState('')
  const exportJson = () => { const url = URL.createObjectURL(new Blob([JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), records }, null, 2)], { type: 'application/json' })); const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'ai-conf-tracker-backup.json'; anchor.click(); URL.revokeObjectURL(url) }
  const importJson = async (file?: File) => { if (!file) return; try { const parsed = JSON.parse(await file.text()) as { records?: SubmissionRecord[] } | SubmissionRecord[]; const next = Array.isArray(parsed) ? parsed : parsed.records; if (!Array.isArray(next)) throw new Error('无 records 数组'); writeRecords(next); setMessage(`已导入 ${next.length} 条记录`) } catch { setMessage('导入失败：文件格式不正确') } }
  return <main className="shell submissions-page">
    <div className="page-heading"><div><span className="section-kicker">PRIVATE WORKSPACE</span><h1>我的投稿</h1><p>集中管理论文进度、内部节点和私人备注。</p></div><div className="backup-actions"><button onClick={exportJson}><Download size={16} /> 导出 JSON</button><button onClick={() => fileRef.current?.click()}><Upload size={16} /> 导入 JSON</button><input ref={fileRef} type="file" accept="application/json" hidden onChange={(event) => importJson(event.target.files?.[0])} /></div></div>
    <div className="privacy-notice"><ShieldCheck size={20} /><div><b>个人投稿数据仅保存在当前浏览器中</b><p>不会上传到 GitHub 或任何服务器。清理浏览器数据后可能丢失，请定期导出 JSON 备份。</p></div></div>
    {message && <div className="toast-message">{message}</div>}
    {records.length ? <div className="submission-list">{records.map((record) => { const conference = conferences.find((item) => item.id === record.conference); if (!conference) return null; return <article className="submission-row" key={`${record.conference}-${record.year}-${record.track}`}><div className="submission-logo">{conference.name.slice(0, 2)}</div><div className="submission-main"><div><h2>{conference.name} {record.year}</h2><span className={`status-pill submission-${record.status}`}>{submissionStatusLabels[record.status]}</span>{record.followed && <span className="follow-chip">已关注</span>}</div><p>{record.paperAlias || '尚未填写论文简称'} · {record.track === 'main' ? 'Main Track' : record.track}</p>{record.notes && <small>{record.notes}</small>}</div><div className="submission-id"><span>投稿编号</span><b>{record.submissionId || '—'}</b></div><div className="submission-row-actions"><Link to={`/conference/${record.conference}/${record.year}`}>编辑 <ArrowRight size={15} /></Link><button onClick={() => remove(record.conference, record.year, record.track)} aria-label={`删除 ${conference.name} 记录`}><Trash2 size={16} /></button></div></article> })}</div> : <div className="empty-state submissions-empty"><Inbox size={34} /><h2>还没有投稿记录</h2><p>在任意会议详情页填写论文简称和投稿状态，这里就会形成你的个人工作台。</p><Link className="primary-button" to="/">浏览会议 <ArrowRight size={16} /></Link></div>}
    <section className="backup-guide"><FileJson size={23} /><div><h3>跨设备迁移</h3><p>先在旧设备导出 JSON，再在新设备导入。相同会议记录会以备份内容为准。</p></div></section>
  </main>
}
