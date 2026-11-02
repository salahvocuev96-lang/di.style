import type { BlockType, HabitLevel, ProjectStatus, SkipReason, WorkoutType } from '../data/types'

export const BLOCK_TYPES: Record<BlockType, { label: string; color: string }> = {
  wake: { label: 'Подъём', color: '#facc15' },
  study: { label: 'Учёба', color: '#60a5fa' },
  sport: { label: 'Спорт', color: '#f97316' },
  work: { label: 'Работа', color: '#a78bfa' },
  rest: { label: 'Отдых', color: '#4ade80' },
  other: { label: 'Другое', color: '#94a3b8' },
}

export const LEVELS: Record<Exclude<HabitLevel, 'skip'>, { label: string; short: string }> = {
  min: { label: 'Минимум', short: 'MIN' },
  normal: { label: 'Норма', short: 'NORM' },
  extra: { label: 'Экстра', short: 'EXTRA' },
}

export const SKIP_REASONS: Record<SkipReason, string> = {
  rest: 'Отдых',
  sick: 'Болезнь',
  no_time: 'Нет времени',
  other: 'Другое',
}

export const WORKOUT_TYPES: Record<WorkoutType, string> = {
  mma: 'ММА',
  strength: 'Силовая',
  cardio: 'Кардио',
  stretch: 'Растяжка / мобильность',
  other: 'Другое',
}

export const PROJECT_STATUS: Record<ProjectStatus, { label: string; color: string }> = {
  idea: { label: 'Идея', color: '#94a3b8' },
  active: { label: 'В работе', color: '#22d3ee' },
  paused: { label: 'Пауза', color: '#facc15' },
  done: { label: 'Готов', color: '#4ade80' },
}

export const DIRECTIONS = [
  'HTML', 'CSS', 'JavaScript', 'Claude Code', 'UI/UX Design', 'Web Development',
  '3D', 'Анимации', 'Монетизация сайтов', 'Поиск клиентов',
]

export const PALETTE = ['#f97316', '#a78bfa', '#22d3ee', '#60a5fa', '#4ade80', '#818cf8', '#f472b6', '#facc15', '#f87171', '#94a3b8']
