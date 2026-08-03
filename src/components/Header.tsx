import { CalendarDays, GitBranch, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { NavLink } from 'react-router-dom'

export function Header() {
  const [open, setOpen] = useState(false)
  const repository = `https://github.com/${import.meta.env.VITE_GITHUB_REPOSITORY ?? 'OWNER/ai-conf-tracker'}`
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <NavLink to="/" className="brand" aria-label="AI Conf Tracker 首页">
          <span className="brand-mark"><CalendarDays size={19} strokeWidth={2.4} /></span>
          <span>AI Conf <b>Tracker</b></span>
        </NavLink>
        <button className="menu-button" onClick={() => setOpen(!open)} aria-label="切换导航" aria-expanded={open}>
          {open ? <X size={21} /> : <Menu size={21} />}
        </button>
        <nav className={open ? 'main-nav is-open' : 'main-nav'} onClick={() => setOpen(false)}>
          <NavLink to="/" end>会议总览</NavLink>
          <NavLink to="/submissions">我的投稿</NavLink>
          <a className="github-link" href={repository} target="_blank" rel="noreferrer"><GitBranch size={16} /> GitHub</a>
        </nav>
      </div>
    </header>
  )
}
