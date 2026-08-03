import rawConferences from './generated/conferences.json'
import type { Conference } from './types/conference'

export const conferences = rawConferences as Conference[]

export const topicLabels: Record<string, string> = {
  'general-ai': 'General AI',
  'machine-learning': 'Machine Learning',
  'learning-theory': 'Learning Theory',
  'representation-learning': 'Representation Learning',
  nlp: 'NLP',
  'language-models': 'Language Models',
  'computer-vision': 'Computer Vision',
  robotics: 'Robotics',
  agents: 'Agents',
  planning: 'Planning',
  'knowledge-reasoning': 'Knowledge Reasoning',
  'evolutionary-computation': 'Evolutionary Computation',
  multimedia: 'Multimedia',
  web: 'Web',
}

export const eventTypeLabels: Record<string, string> = {
  abstract_registration: '摘要注册', abstract_deadline: '摘要截止', paper_deadline: '论文截止',
  supplementary_deadline: '附录截止', code_deadline: '代码截止', data_deadline: '数据截止',
  ethics_form_deadline: '伦理表截止', conflict_registration_deadline: '利益冲突登记',
  review_release: '审稿意见发布', rebuttal_open: 'Rebuttal 开放', rebuttal_deadline: 'Rebuttal 截止',
  author_response_open: '作者回复开放', author_response_deadline: '作者回复截止',
  discussion_open: '讨论开放', discussion_deadline: '讨论截止', revision_deadline: '修订截止',
  notification: '录用通知', conditional_acceptance: '有条件录用', final_notification: '最终通知',
  withdrawal_deadline: '撤稿截止', camera_ready_deadline: 'Camera-ready', copyright_deadline: '版权截止',
  artifact_deadline: 'Artifact 截止', author_registration_deadline: '作者注册截止',
  early_registration_deadline: '早鸟注册截止', conference_start: '会议开始', conference_end: '会议结束',
  workshop_start: 'Workshop 开始', workshop_end: 'Workshop 结束',
}
