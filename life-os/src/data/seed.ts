import { db } from './db'
import type { BlockType, Category, Habit, ScheduleBlock } from './types'

// Начальные данные создаются один раз. ID фиксированные — при будущей синхронизации
// двух устройств стартовые записи не задвоятся.

// Дата создания = момент первого запуска, чтобы статистика не считала «пропуски» до начала пользования.
let T = new Date().toISOString()
const base = (id: string) => ({ id, createdAt: T, updatedAt: T, deletedAt: null, syncedAt: null })

export const SEED_CATEGORIES: [string, string, string, string][] = [
  ['sport', 'Спорт', '#f97316', 'dumbbell'],
  ['code', 'Программирование', '#a78bfa', 'code'],
  ['english', 'Английский', '#22d3ee', 'languages'],
  ['edu', 'Образование', '#60a5fa', 'graduation-cap'],
  ['food', 'Питание', '#4ade80', 'apple'],
  ['sleep', 'Сон', '#818cf8', 'moon'],
  ['growth', 'Личное развитие', '#f472b6', 'sparkles'],
]

const SCHEDULE: [number, string, BlockType, string | null, string | null][] = [
  [0, 'Подъём', 'wake', '08:30', null],
  [0, 'Учёба', 'study', '10:35', null],
  [0, 'ММА', 'sport', '20:00', null],
  [1, 'Подъём', 'wake', '08:30', null],
  [1, 'Учёба', 'study', '10:35', null],
  [2, 'Гибкое утро', 'rest', null, null],
  [2, 'История (дистанционно)', 'study', '17:30', null],
  [2, 'Силовая тренировка', 'sport', null, null],
  [3, 'Учёба', 'study', '09:00', '12:05'],
  [4, 'Учёба (дистанционно)', 'study', '09:00', '12:05'],
  [4, 'ММА', 'sport', '20:00', null],
  [5, 'Подъём', 'wake', '07:00', null],
  [5, 'Учёба', 'study', '09:00', '14:05'],
  [6, 'Свободный день', 'rest', null, null],
  [6, 'Силовая (если восстановился, или в субботу)', 'sport', null, null],
]

const HABITS: Omit<Habit, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'syncedAt'>[] = [
  { name: 'Английский', categoryId: 'cat-english', description: 'Цель — 20–30 минут в день', frequency: { type: 'daily' }, minGoal: '10 минут', normalGoal: '20–30 минут', extraGoal: '45+ минут', archived: false, order: 0 },
  { name: 'Программирование', categoryId: 'cat-code', description: 'Практика: код, проекты, уроки', frequency: { type: 'daily' }, minGoal: '15 минут кода', normalGoal: '1 час', extraGoal: '2+ часа', archived: false, order: 1 },
  { name: 'Тренировка', categoryId: 'cat-sport', description: 'ММА или силовая', frequency: { type: 'weekly', times: 3 }, minGoal: 'Разминка / растяжка', normalGoal: 'Полная тренировка', extraGoal: 'Тренировка + доп. работа', archived: false, order: 2 },
  { name: 'Сон вовремя', categoryId: 'cat-sleep', description: 'Постепенно сдвигать отбой к 23:30–00:00', frequency: { type: 'daily' }, minGoal: 'Лечь до 01:00', normalGoal: 'Лечь до 00:00', extraGoal: 'Лечь до 23:30', archived: false, order: 3 },
  { name: 'Нормальное питание', categoryId: 'cat-food', description: 'Без жёстких ограничений', frequency: { type: 'daily' }, minGoal: '1 полноценный приём пищи', normalGoal: '3 приёма пищи', extraGoal: 'Приготовил сам', archived: false, order: 4 },
]

export async function seedIfEmpty() {
  const seeded = await db.settings.where('key').equals('seeded').first()
  if (seeded) return
  T = new Date().toISOString()
  await db.transaction('rw', [db.categories, db.scheduleBlocks, db.habits, db.settings], async () => {
    await db.categories.bulkPut(
      SEED_CATEGORIES.map(([k, name, color, icon]): Category => ({ ...base(`cat-${k}`), name, color, icon, kind: 'habit' })),
    )
    await db.scheduleBlocks.bulkPut(
      SCHEDULE.map(([weekday, title, type, start, end], i): ScheduleBlock => ({ ...base(`blk-${i}`), weekday, title, type, start, end, note: '' })),
    )
    await db.habits.bulkPut(HABITS.map((h, i): Habit => ({ ...base(`hab-${i}`), ...h })))
    await db.settings.put({ ...base('set-seeded'), key: 'seeded', value: true })
  })
}
