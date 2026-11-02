import Dexie, { type EntityTable } from 'dexie'
import type {
  Category, Checkin, DevLog, EnglishSession, EnglishWord, Habit, HabitLog, Idea,
  Project, ScheduleBlock, ScheduleOverride, Setting, SleepLog, Task, Workout,
} from './types'

// Локальная база в браузере (IndexedDB). Работает без интернета.
// Имена таблиц совпадают с будущими таблицами Supabase.
export class LifeDB extends Dexie {
  categories!: EntityTable<Category, 'id'>
  scheduleBlocks!: EntityTable<ScheduleBlock, 'id'>
  scheduleOverrides!: EntityTable<ScheduleOverride, 'id'>
  habits!: EntityTable<Habit, 'id'>
  habitLogs!: EntityTable<HabitLog, 'id'>
  checkins!: EntityTable<Checkin, 'id'>
  workouts!: EntityTable<Workout, 'id'>
  projects!: EntityTable<Project, 'id'>
  tasks!: EntityTable<Task, 'id'>
  devLogs!: EntityTable<DevLog, 'id'>
  ideas!: EntityTable<Idea, 'id'>
  englishSessions!: EntityTable<EnglishSession, 'id'>
  englishWords!: EntityTable<EnglishWord, 'id'>
  sleepLogs!: EntityTable<SleepLog, 'id'>
  settings!: EntityTable<Setting, 'id'>

  constructor(name = 'life-os') {
    super(name)
    const common = 'id, updatedAt'
    this.version(1).stores({
      categories: `${common}, kind`,
      scheduleBlocks: `${common}, weekday`,
      scheduleOverrides: `${common}, date`,
      habits: `${common}, order`,
      habitLogs: `${common}, date, habitId, [habitId+date]`,
      checkins: `${common}, date`,
      workouts: `${common}, date`,
      projects: `${common}, status`,
      tasks: `${common}, projectId, plannedDate`,
      devLogs: `${common}, date, projectId`,
      ideas: `${common}, projectId`,
      englishSessions: `${common}, date`,
      englishWords: `${common}`,
      sleepLogs: `${common}, date`,
      settings: `${common}, key`,
    })
  }
}

export const db = new LifeDB()

export type TableName =
  | 'categories' | 'scheduleBlocks' | 'scheduleOverrides' | 'habits' | 'habitLogs'
  | 'checkins' | 'workouts' | 'projects' | 'tasks' | 'devLogs' | 'ideas'
  | 'englishSessions' | 'englishWords' | 'sleepLogs' | 'settings'

export const TABLES: TableName[] = [
  'categories', 'scheduleBlocks', 'scheduleOverrides', 'habits', 'habitLogs',
  'checkins', 'workouts', 'projects', 'tasks', 'devLogs', 'ideas',
  'englishSessions', 'englishWords', 'sleepLogs', 'settings',
]
