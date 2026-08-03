import { Route, Routes } from 'react-router-dom'
import { Header } from './components/Header'
import { ConferencePage } from './pages/ConferencePage'
import { HomePage } from './pages/HomePage'
import { SubmissionsPage } from './pages/SubmissionsPage'

function App() {
  return <div className="app-shell">
    <Header />
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/conference/:id/:year" element={<ConferencePage />} />
      <Route path="/submissions" element={<SubmissionsPage />} />
    </Routes>
    <footer className="site-footer"><div className="shell"><div><b>AI Conf Tracker</b><span>面向研究者的会议投稿全生命周期追踪</span></div><p>数据来自会议官方页面 · 日期变更需人工确认 · CCF 目录版本 2026</p></div></footer>
  </div>
}

export default App
