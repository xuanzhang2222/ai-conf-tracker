import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { loadConferenceData } from './schema'

const conferences = await loadConferenceData()
const output = path.join(process.cwd(), 'src', 'generated')
await mkdir(output, { recursive: true })
await writeFile(path.join(output, 'conferences.json'), `${JSON.stringify(conferences, null, 2)}\n`)
console.log(`✓ 已生成前端数据：${conferences.length} 个会议`)
