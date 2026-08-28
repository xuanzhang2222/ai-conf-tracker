import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { parse } from 'yaml'
import { z } from 'zod'

const eventTypes = [
  'abstract_registration', 'abstract_deadline', 'paper_deadline', 'supplementary_deadline',
  'code_deadline', 'data_deadline', 'ethics_form_deadline', 'conflict_registration_deadline',
  'review_release', 'rebuttal_open', 'rebuttal_deadline', 'author_response_open',
  'author_response_deadline', 'discussion_open', 'discussion_deadline', 'revision_deadline',
  'notification', 'conditional_acceptance', 'final_notification', 'withdrawal_deadline',
  'camera_ready_deadline', 'copyright_deadline', 'artifact_deadline',
  'registration_open', 'author_registration_deadline', 'early_registration_deadline', 'standard_registration_deadline', 'conference_start',
  'conference_end', 'workshop_start', 'workshop_end',
] as const

const sourceSchema = z.object({
  url: z.string().url(),
  label: z.string().min(1),
  source_type: z.enum(['official_dates', 'official_cfp', 'submission_system', 'official_faq', 'official_announcement', 'trusted_third_party']),
  verified_at: z.string().datetime(),
})

const relatedInformationSchema = z.object({
  title: z.string().min(1),
  kind: z.enum(['organizer_email', 'official_notice']),
  source_label: z.string().min(1),
  summary: z.string().min(1),
  content: z.string().min(1),
  links: z.array(z.object({ label: z.string().min(1), url: z.string().url() })).optional(),
})

const milestoneSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  label: z.string().min(1),
  type: z.enum(eventTypes),
  kind: z.enum(['instant', 'window', 'date', 'tbd']),
  at: z.string().optional(),
  start_at: z.string().optional(),
  end_at: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  timezone: z.string().optional(),
  original_timezone: z.string().optional(),
  date_status: z.enum(['confirmed', 'tentative', 'estimated', 'tbd', 'cancelled', 'superseded']),
  action_required: z.boolean(),
  source: sourceSchema.optional(),
  related_information: z.array(relatedInformationSchema).min(1).optional(),
}).superRefine((value, ctx) => {
  const formal = value.date_status === 'confirmed' || value.date_status === 'tentative'
  if (formal && !value.source) ctx.addIssue({ code: 'custom', message: 'confirmed/tentative 事件必须提供官方来源' })
  if (value.kind === 'instant' && !value.at) ctx.addIssue({ code: 'custom', message: 'instant 事件缺少 at' })
  if (value.kind === 'window' && (!value.start_at || !value.end_at)) ctx.addIssue({ code: 'custom', message: 'window 事件缺少 start_at/end_at' })
  if (value.kind === 'date' && !value.date) ctx.addIssue({ code: 'custom', message: 'date 事件缺少 date' })
  if (value.kind !== 'date' && value.kind !== 'tbd' && !value.timezone) ctx.addIssue({ code: 'custom', message: '精确时间事件缺少 timezone' })
  if (value.timezone) {
    try { new Intl.DateTimeFormat('en', { timeZone: value.timezone }) } catch { ctx.addIssue({ code: 'custom', message: `无效时区 ${value.timezone}` }) }
  }
  if (value.kind === 'window' && value.start_at && value.end_at && value.start_at >= value.end_at) {
    ctx.addIssue({ code: 'custom', message: 'window 开始时间必须早于结束时间' })
  }
})

export const conferenceSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(2),
  full_name: z.string().min(3),
  description: z.string().min(8),
  ccf: z.object({
    edition: z.literal(2026),
    level: z.enum(['A', 'B']),
    category: z.enum(['AI', 'Graphics & Multimedia', 'Cross-disciplinary']),
    curated_extra: z.boolean(),
  }),
  topics: z.array(z.string()).min(1),
  dblp: z.string().min(1),
  editions: z.array(z.object({
    year: z.number().int().min(2024).max(2032),
    website: z.string().url(),
    venue: z.object({ city: z.string(), country: z.string(), mode: z.enum(['onsite', 'hybrid', 'virtual', 'tbd']) }),
    sources: z.array(sourceSchema).min(1),
    tracks: z.array(z.object({
      id: z.string().regex(/^[a-z0-9-]+$/),
      name: z.string().min(1),
      milestones: z.array(milestoneSchema).min(1),
    })).min(1),
  })).min(1),
})

export type ConferenceData = z.infer<typeof conferenceSchema>

export async function loadConferenceData(root = process.cwd()): Promise<ConferenceData[]> {
  const directory = path.join(root, 'data', 'conferences')
  const files = (await readdir(directory)).filter((file) => file.endsWith('.yml')).sort()
  const conferences: ConferenceData[] = []
  const errors: string[] = []

  for (const file of files) {
    const raw = parse(await readFile(path.join(directory, file), 'utf8'))
    const parsed = conferenceSchema.safeParse(raw)
    if (!parsed.success) {
      errors.push(`${file}:\n${z.prettifyError(parsed.error)}`)
      continue
    }
    conferences.push(parsed.data)
  }

  const duplicateIds = conferences.map((item) => item.id).filter((id, index, all) => all.indexOf(id) !== index)
  if (duplicateIds.length) errors.push(`会议 ID 重复: ${[...new Set(duplicateIds)].join(', ')}`)
  for (const conference of conferences) {
    for (const edition of conference.editions) {
      for (const track of edition.tracks) {
        const ids = track.milestones.map((item) => item.id)
        const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index)
        if (duplicates.length) errors.push(`${conference.id}/${edition.year}/${track.id}: 事件 ID 重复 ${duplicates.join(', ')}`)
      }
    }
  }
  if (files.length !== 17) errors.push(`应有 17 个会议文件，当前为 ${files.length}`)
  if (errors.length) throw new Error(errors.join('\n\n'))
  return conferences
}
