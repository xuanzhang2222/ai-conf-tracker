import { ExternalLink, MailOpen, X } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Milestone } from '../types/conference'

interface Props {
  milestone: Milestone
  variant?: 'label' | 'icon'
}

const kindLabels = {
  organizer_email: '主办方邮件',
  official_notice: '官方通知',
}

export function MilestoneInfoButton({ milestone, variant = 'label' }: Props) {
  const [open, setOpen] = useState(false)
  const titleId = useId()
  const closeButton = useRef<HTMLButtonElement>(null)
  const information = milestone.related_information ?? []

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false) }
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', closeOnEscape)
    closeButton.current?.focus()
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  if (!information.length) return null

  return <>
    <button type="button" className={`milestone-info-trigger ${variant}`} onClick={() => setOpen(true)} aria-label={`查看 ${milestone.label} 的相关信息`}>
      <MailOpen size={variant === 'icon' ? 16 : 13} />{variant === 'label' && <span>相关信息</span>}
    </button>
    {open && createPortal(
      <div className="milestone-info-backdrop" onMouseDown={() => setOpen(false)}>
        <section className="milestone-info-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId} onMouseDown={(event) => event.stopPropagation()}>
          <header>
            <div><span>NODE CONTEXT</span><h2 id={titleId}>{milestone.label} · 相关信息</h2></div>
            <button ref={closeButton} type="button" onClick={() => setOpen(false)} aria-label="关闭相关信息"><X size={19} /></button>
          </header>
          <div className="milestone-info-entries">
            {information.map((entry, index) => <article key={`${entry.title}-${index}`}>
              <div className="milestone-info-source"><MailOpen size={14} /><b>{kindLabels[entry.kind]}</b><span>{entry.source_label}</span></div>
              <h3>{entry.title}</h3>
              <p className="milestone-info-summary">{entry.summary}</p>
              <div className="milestone-info-message">{entry.content}</div>
              {!!entry.links?.length && <div className="milestone-info-links"><b>邮件中的相关链接</b>{entry.links.map((link) => <a href={link.url} target="_blank" rel="noreferrer" key={link.url}>{link.label}<ExternalLink size={13} /></a>)}</div>}
            </article>)}
          </div>
        </section>
      </div>,
      document.body,
    )}
  </>
}
