import { loadConferenceData } from './schema'

try {
  const conferences = await loadConferenceData()
  const editions = conferences.reduce((sum, item) => sum + item.editions.length, 0)
  const milestones = conferences.flatMap((item) => item.editions).flatMap((item) => item.tracks).flatMap((item) => item.milestones).length
  console.log(`✓ 数据校验通过：${conferences.length} 个会议，${editions} 届，${milestones} 个生命周期节点`)
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
}
