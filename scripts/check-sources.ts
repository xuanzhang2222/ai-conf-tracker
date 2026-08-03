import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { load } from 'cheerio'
import { loadConferenceData } from './schema'

type Snapshot = {
  hash: string
  checked_at: string
  conference_id: string
  conference: string
  label: string
  content_bytes: number
}

type SnapshotMap = Record<string, Snapshot>

const root = process.cwd()
const snapshotPath = path.join(root, 'data', 'source-snapshots.json')
const conferences = await loadConferenceData(root)
const previous: SnapshotMap = JSON.parse(await readFile(snapshotPath, 'utf8'))
const current: SnapshotMap = {}
const githubToken = process.env.GITHUB_TOKEN
const githubRepository = process.env.GITHUB_REPOSITORY
const now = new Date().toISOString()

const sources = new Map<string, { conferenceId: string; conference: string; label: string }>()
for (const conference of conferences) {
  for (const edition of conference.editions) {
    for (const source of edition.sources) {
      if (!sources.has(source.url)) sources.set(source.url, { conferenceId: conference.id, conference: `${conference.name} ${edition.year}`, label: source.label })
    }
  }
}

function normalizeHtml(html: string): string {
  const $ = load(html)
  $('script, style, noscript, svg, nav, footer, [aria-hidden="true"]').remove()
  return $('main, article, body').first().text().replace(/\s+/g, ' ').trim()
}

async function createIssue(title: string, body: string) {
  if (!githubToken || !githubRepository) {
    console.log(`  ↳ 本地运行：未创建 Issue「${title}」`)
    return
  }
  const headers = { Accept: 'application/vnd.github+json', Authorization: `Bearer ${githubToken}`, 'X-GitHub-Api-Version': '2022-11-28' }
  const openIssues = await fetch(`https://api.github.com/repos/${githubRepository}/issues?state=open&per_page=100`, { headers })
  if (!openIssues.ok) throw new Error(`读取 GitHub Issues 失败：${openIssues.status}`)
  const exists = (await openIssues.json() as Array<{ title: string }>).some((item) => item.title === title)
  if (exists) {
    console.log(`  ↳ 已有同名开放 Issue，跳过重复创建`)
    return
  }
  const response = await fetch(`https://api.github.com/repos/${githubRepository}/issues`, {
    method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, body }),
  })
  if (!response.ok) throw new Error(`创建 GitHub Issue 失败：${response.status} ${await response.text()}`)
}

async function inspect(url: string, meta: { conferenceId: string; conference: string; label: string }) {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'ai-conf-tracker-source-monitor/1.0 (+https://github.com/)' },
      redirect: 'follow', signal: AbortSignal.timeout(25_000),
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const contentType = response.headers.get('content-type') ?? ''
    const buffer = Buffer.from(await response.arrayBuffer())
    const normalized = contentType.includes('text/html') ? normalizeHtml(buffer.toString('utf8')) : buffer
    if (typeof normalized === 'string' && normalized.length < 80) throw new Error('页面正文过短，可能被拦截或依赖动态渲染')
    const hash = createHash('sha256').update(normalized).digest('hex')
    const old = previous[url]
    current[url] = { hash, checked_at: now, conference_id: meta.conferenceId, conference: meta.conference, label: meta.label, content_bytes: buffer.byteLength }

    if (!old) {
      console.log(`✓ 建立基线  ${meta.conference} · ${meta.label}`)
    } else if (old.hash !== hash) {
      console.log(`△ 发现变化  ${meta.conference} · ${meta.label}`)
      const title = `[Source Changed] ${meta.conference} · ${meta.label}`
      await createIssue(title, [
        `## 自动发现页面变化`, '', `**会议：** ${meta.conference}`, `**来源：** [${meta.label}](${url})`,
        `**检测时间：** ${now}`, '', `- Previous hash: \`${old.hash}\``, `- Current hash: \`${hash}\``,
        '', '> 请人工核对日期是否变化。监控程序不会直接覆盖正式会议数据。',
      ].join('\n'))
    } else {
      console.log(`· 无变化    ${meta.conference} · ${meta.label}`)
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.warn(`! 无法访问    ${meta.conference} · ${meta.label}: ${message}`)
    if (previous[url]) current[url] = { ...previous[url], checked_at: now }
    await createIssue(`[Source Unreachable] ${meta.conference} · ${meta.label}`, [
      `## 官方来源访问异常`, '', `**会议：** ${meta.conference}`, `**来源：** [${meta.label}](${url})`,
      `**检测时间：** ${now}`, `**错误：** ${message}`, '', '> 请人工检查 URL、反爬限制或页面迁移情况。',
    ].join('\n'))
  }
}

const queue = [...sources.entries()]
for (let index = 0; index < queue.length; index += 5) {
  await Promise.all(queue.slice(index, index + 5).map(([url, meta]) => inspect(url, meta)))
}

await writeFile(snapshotPath, `${JSON.stringify(current, null, 2)}\n`)
console.log(`\n检查完成：${sources.size} 个官方页面，快照已更新。`)
