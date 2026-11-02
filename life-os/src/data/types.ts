// Все сущности имеют общие поля синхронизации.
// updatedAt > syncedAt (или syncedAt пуст) => запись нужно отправить в облако.
// deletedAt — «мягкое» удаление, чтобы удалённое не возвращалось при синхронизации.
export interface SyncFields {
  id: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  syncedAt: string | null
}

export type ISODate = string // 'YYYY-MM-DD'
export type HM = string // 'HH:MM'

export type CategoryKind = 'habit' | 'project'

export interface Category extends SyncFields {
  name: string
  color: string
  icon: string
  kind: CategoryKind
}

export type BlockType = 'wake' | 'study' | 'sport' | 'rest' | 'work' | 'other'

export interface ScheduleBlock extends SyncFields {
  weekday: number // 0 = Пн ... 6 = Вс
  title: string
  type: BlockType
  start: HM | null // null = гибкое время
  end: HM | null
  note: string
}

// Разовое изменение расписания на конкретную дату
export interface ScheduleOverride extends SyncFields {
  date: ISODate
  action: 'cancel' | 'add'
  blockId: string | null // для cancel
  title: string
  type: BlockType
  start: HM | null
  end: HM | null
}

export type Frequency =
  | { type: 'daily' }
  | { type: 'days'; days: number[] } // конкретные дни недели 0..6
  | { type: 'weekly'; times: number } // N раз в неделю, любые дни

export interface Habit extends SyncFields {
  name: string
  categoryId: string
  description: string
  frequency: Frequency
  minGoal: string
  normalGoal: string
  extraGoal: string
  archived: boolean
  order: number
}

export type HabitLevel = 'min' | 'normal' | 'extra' | 'skip'
export type SkipReason = 'rest' | 'sick' | 'no_time' | 'other'

export interface HabitLog extends SyncFields {
  habitId: string
  date: ISODate
  level: HabitLevel
  skipReason: SkipReason | null
  note: string
}

export interface Checkin extends SyncFields {
  date: ISODate
  energy: number // 1..5
  wellbeing: number // 1..5
  note: string
}

export type WorkoutType = 'mma' | 'strength' | 'cardio' | 'stretch' | 'other'

export interface Workout extends SyncFields {
  date: ISODate
  type: WorkoutType
  duration: number // минуты
  feeling: number // 1..5
  recovery: number // 1..5
  notes: string
}

export type ProjectStatus = 'idea' | 'active' | 'paused' | 'done'

export interface Project extends SyncFields {
  name: string
  description: string
  status: ProjectStatus
  categoryId: string | null
  deadline: ISODate | null
  notes: string
}

export interface Task extends SyncFields {
  title: string
  projectId: string | null
  done: boolean
  doneAt: string | null
  priority: 1 | 2 | 3 // 1 — высокий
  plannedDate: ISODate | null // на какой день запланирована
  deadline: ISODate | null
}

// «Что я сделал сегодня» + изученные технологии
export interface DevLog extends SyncFields {
  date: ISODate
  projectId: string | null
  text: string
  minutes: number
  tech: string[]
}

export interface Idea extends SyncFields {
  text: string
  projectId: string | null
}

export interface EnglishSession extends SyncFields {
  date: ISODate
  minutes: number
  activity: string // урок, сериал, приложение…
  note: string
}

export interface EnglishWord extends SyncFields {
  word: string
  translation: string
  example: string
  learned: boolean
}

export interface SleepLog extends SyncFields {
  date: ISODate // дата пробуждения
  bedtime: HM
  wake: HM
  quality: number // 1..5
  note: string
}

export interface Setting extends SyncFields {
  key: string
  value: unknown
}
