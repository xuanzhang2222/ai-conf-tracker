export type CcfLevel = 'A' | 'B'
export type DateStatus = 'confirmed' | 'tentative' | 'estimated' | 'tbd' | 'cancelled' | 'superseded'
export type MilestoneKind = 'instant' | 'window' | 'date' | 'tbd'

export interface Source {
  url: string
  label: string
  source_type: string
  verified_at: string
}

export interface RelatedInformation {
  title: string
  kind: 'organizer_email' | 'official_notice'
  source_label: string
  summary: string
  content: string
  links?: Array<{ label: string; url: string }>
}

export interface Milestone {
  id: string
  label: string
  type: string
  kind: MilestoneKind
  at?: string
  start_at?: string
  end_at?: string
  date?: string
  timezone?: string
  original_timezone?: string
  date_status: DateStatus
  action_required: boolean
  source?: Source
  related_information?: RelatedInformation[]
}

export interface Track {
  id: string
  name: string
  milestones: Milestone[]
}

export interface Edition {
  year: number
  website: string
  venue: { city: string; country: string; mode: 'onsite' | 'hybrid' | 'virtual' | 'tbd' }
  sources: Source[]
  tracks: Track[]
}

export interface Conference {
  id: string
  name: string
  full_name: string
  description: string
  ccf: { edition: 2026; level: CcfLevel; category: string; curated_extra: boolean }
  topics: string[]
  dblp: string
  editions: Edition[]
}

export interface ConferenceEdition {
  conference: Conference
  edition: Edition
  milestones: Milestone[]
}
