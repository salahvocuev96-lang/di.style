import type {
  BlockType, Checkin, DevLog, EnglishSession, Habit, HabitLog, HM, ISODate,
  ScheduleBlock, ScheduleOverride, SleepLog, Workout,
} from '../data/types'
import { addDays, lastNDates, sleepMinutes, toMin, weekDates, weekdayOf, fromMin } from './date'

// ---------------- Расписание дня ----------------

export interface DayEvent {
  key: string
  blockId: string | null
  overrideId: string | null
  title: string
  type: BlockType
  start: HM | null
  end: HM | null
  cancelled: boolean
}

export function eventsForDate(date: ISODate, blocks: ScheduleBlock[], overrides: ScheduleOverride[]): DayEvent[] {
  const wd = weekdayOf(date)
  const dayOv = overrides.filter((o) => o.date === date)
  const cancelled = new Set(dayOv.filter((o) => o.action === 'cancel' && o.blockId).map((o) => o.blockId))
  const list: DayEvent[] = blocks
    .filter((b) => b.weekday === wd)
    .map((b) => ({
      key: b.id, blockId: b.id, overrideId: dayOv.find((o) => o.blockId === b.id)?.id ?? null,
      title: b.title, type: b.type, start: b.start, end: b.end, cancelled: cancelled.has(b.id),
    }))
  for (const o of dayOv.filter((o) => o.action === 'add')) {
    list.push({ key: o.id, blockId: null, overrideId: o.id, title: o.title, type: o.type, start: o.start, end: o.end, cancelled: false })
  }
  return list.sort((a, b) => (a.start ?? '99:99').localeCompare(b.start ?? '99:99'))
}

/** Длительность по умолчанию, если конец не указан. Честно помечается в UI как «≈». */
export const DEFAULT_DURATION: Record<BlockType, number> = {
  wake: 0, study: 180, sport: 90, rest: 60, work: 120, other: 60,
}

export function eventEndMin(e: { type: BlockType; start: HM | null; end: HM | null }): number | null {
  if (!e.start) return null
  if (e.end) return toMin(e.end)
  return toMin(e.start) + DEFAULT_DURATION[e.type]
}

export interface Window { start: HM; end: HM; minutes: number }

/**
 * Свободные окна между занятиями: от подъёма (или текущего времени) до целевого отбоя.
 * Окна короче minLen не показываем.
 */
export function freeWindows(events: DayEvent[], opts: { from?: HM; bedtime?: HM; minLen?: number } = {}): Window[] {
  const active = events.filter((e) => !e.cancelled)
  const wake = active.find((e) => e.type === 'wake' && e.start)?.start ?? '09:00'
  let dayStart = toMin(wake)
  if (opts.from) dayStart = Math.max(dayStart, toMin(opts.from))
  let dayEnd = toMin(opts.bedtime ?? '23:30')
  if (dayEnd < toMin(wake)) dayEnd += 1440 // отбой после полуночи
  const minLen = opts.minLen ?? 30

  const busy = active
    .filter((e) => e.type !== 'wake' && e.start)
    .map((e) => [toMin(e.start!), eventEndMin(e)!] as [number, number])
    .sort((a, b) => a[0] - b[0])

  const res: Window[] = []
  let cur = dayStart
  for (const [s, e] of busy) {
    if (s > cur && s - cur >= minLen) res.push({ start: fromMin(cur), end: fromMin(s), minutes: s - cur })
    cur = Math.max(cur, e)
  }
  if (dayEnd - cur >= minLen) res.push({ start: fromMin(cur), end: fromMin(dayEnd), minutes: dayEnd - cur })
  return res
}

/** Нагрузка дня в минутах: учёба и работа + тренировки. */
export function dayLoad(events: DayEvent[]) {
  let study = 0
  let sport = 0
  for (const e of events) {
    if (e.cancelled) continue
    const dur = e.start ? (eventEndMin(e)! - toMin(e.start)) : (e.type === 'sport' ? DEFAULT_DURATION.sport : 0)
    if (e.type === 'study' || e.type === 'work') study += dur
    if (e.type === 'sport') sport += dur
  }
  return { study, sport, hasSport: events.some((e) => !e.cancelled && e.type === 'sport') }
}

// ---------------- Адаптация дня ----------------

export type DayMode = 'light' | 'normal' | 'unknown'

export interface DayPlan {
  mode: DayMode
  reasons: string[]
  tips: string[]
}

/**
 * Адаптация под энергию и нагрузку. Никогда не повышает нагрузку —
 * только предлагает облегчить день, если есть причины.
 */
export function adaptDay(checkin: Checkin | undefined, events: DayEvent[], lastSleep: SleepLog | undefined): DayPlan {
  if (!checkin) return { mode: 'unknown', reasons: [], tips: [] }
  const load = dayLoad(events)
  const reasons: string[] = []
  if (checkin.energy <= 2) reasons.push('низкая энергия')
  if (checkin.wellbeing <= 2) reasons.push('плохое самочувствие')
  if (lastSleep && sleepMinutes(lastSleep.bedtime, lastSleep.wake) < 360) reasons.push('мало сна')
  if (checkin.energy === 3 && load.study >= 300 && load.hasSport) reasons.push('плотный день: учёба и тренировка')

  if (!reasons.length) return { mode: 'normal', reasons: [], tips: [] }
  const tips = ['Сегодня достаточно минимальных целей — это тоже выполнение.']
  if (load.hasSport) tips.push('Тренировка — по самочувствию: можно провести легче, заменить растяжкой или отдохнуть.')
  if (checkin.wellbeing <= 2) tips.push('Если болеешь — отметь пропуски причиной «болезнь», регулярность не пострадает.')
  return { mode: 'light', reasons, tips }
}

// ---------------- Привычки ----------------

export const isDone = (l?: HabitLog) => !!l && l.level !== 'skip'
export const isExcused = (l?: HabitLog) => !!l && l.level === 'skip' && (l.skipReason === 'rest' || l.skipReason === 'sick')

export function logsByHabitDate(logs: HabitLog[]) {
  const m = new Map<string, HabitLog>()
  for (const l of logs) {
    const k = `${l.habitId}|${l.date}`
    const prev = m.get(k)
    if (!prev || l.updatedAt > prev.updatedAt) m.set(k, l)
  }
  return m
}

/** Нужно ли выполнять привычку в этот день. */
export function isDueOn(h: Habit, date: ISODate, logMap: Map<string, HabitLog>): boolean {
  if (h.archived || h.createdAt.slice(0, 10) > date) return false
  const f = h.frequency
  if (f.type === 'daily') return true
  if (f.type === 'days') return f.days.includes(weekdayOf(date))
  // N раз в неделю: показываем, пока недельная цель не набрана (или если уже отмечено сегодня)
  if (logMap.has(`${h.id}|${date}`)) return true
  const doneThisWeek = weekDates(date).filter((d) => d < date && isDone(logMap.get(`${h.id}|${d}`))).length
  return doneThisWeek < f.times
}

export interface Regularity { done: number; expected: number; ratio: number }

/**
 * Регулярность за последние N дней. Пропуск по причине «отдых» или «болезнь» не входит в ожидаемое.
 * Сегодняшний день учитывается, только если уже отмечен — незаконченный день не портит статистику.
 */
export function regularity(h: Habit, logMap: Map<string, HabitLog>, today: ISODate, days = 7): Regularity {
  const dates = lastNDates(today, days).filter((d) => d >= h.createdAt.slice(0, 10))
  let done = 0
  let expected = 0
  if (h.frequency.type === 'weekly') {
    const excused = dates.filter((d) => isExcused(logMap.get(`${h.id}|${d}`))).length
    done = dates.filter((d) => isDone(logMap.get(`${h.id}|${d}`))).length
    expected = Math.max(0, Math.round((h.frequency.times * dates.length) / 7) - excused)
  } else {
    for (const d of dates) {
      const f = h.frequency
      const due = f.type === 'daily' || f.days.includes(weekdayOf(d))
      if (!due) continue
      const l = logMap.get(`${h.id}|${d}`)
      if (d === today && !l) continue
      if (isExcused(l)) continue
      expected++
      if (isDone(l)) done++
    }
  }
  return { done, expected, ratio: expected ? Math.min(1, done / expected) : 0 }
}

/** Прогресс дня по привычкам. Пропуски с причиной не уменьшают процент. */
export function dayProgress(habits: Habit[], logMap: Map<string, HabitLog>, date: ISODate) {
  const due = habits.filter((h) => isDueOn(h, date, logMap))
  let total = 0
  let done = 0
  for (const h of due) {
    const l = logMap.get(`${h.id}|${date}`)
    if (l?.level === 'skip') continue
    total++
    if (isDone(l)) done++
  }
  return { done, total, ratio: total ? done / total : 0 }
}

// ---------------- Достижения ----------------

export interface Achievement { id: string; title: string; date: ISODate; icon: string }

function milestones(id: string, icon: string, dates: ISODate[], steps: number[], label: (n: number) => string): Achievement[] {
  const sorted = [...dates].sort()
  return steps.filter((n) => sorted.length >= n).map((n) => ({ id: `${id}-${n}`, title: label(n), date: sorted[n - 1], icon }))
}

const plural = (n: number, one: string, few: string, many: string) => {
  const m10 = n % 10
  const m100 = n % 100
  if (m10 === 1 && m100 !== 11) return one
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few
  return many
}
export { plural }

export function achievements(input: {
  logs: HabitLog[]; workouts: Workout[]; english: EnglishSession[]; devLogs: DevLog[]; sleep: SleepLog[]
}): Achievement[] {
  const doneLogs = input.logs.filter((l) => l.level !== 'skip').map((l) => l.date)
  const extra = input.logs.filter((l) => l.level === 'extra').map((l) => l.date)
  const onTimeSleep = input.sleep.filter((s) => {
    const m = toMin(s.bedtime)
    return m >= 21 * 60 || m <= 30 // лёг до 00:30
  }).map((s) => s.date)
  const engDays = [...new Set(input.english.map((e) => e.date))]
  const devDays = [...new Set(input.devLogs.map((e) => e.date))]
  return [
    ...milestones('habits', 'check', doneLogs, [1, 10, 50, 100, 250, 500, 1000], (n) => `${n} ${plural(n, 'выполнение', 'выполнения', 'выполнений')} привычек`),
    ...milestones('extra', 'flame', extra, [1, 10, 50], (n) => `${n} × EXTRA`),
    ...milestones('workouts', 'dumbbell', input.workouts.map((w) => w.date), [1, 10, 25, 50, 100, 200], (n) => `${n} ${plural(n, 'тренировка', 'тренировки', 'тренировок')}`),
    ...milestones('english', 'languages', engDays, [1, 7, 30, 100, 365], (n) => `${n} ${plural(n, 'день', 'дня', 'дней')} английского`),
    ...milestones('dev', 'code', devDays, [1, 10, 30, 100], (n) => `${n} ${plural(n, 'день', 'дня', 'дней')} программирования`),
    ...milestones('sleep', 'moon', onTimeSleep, [1, 7, 30], (n) => `${n} ${plural(n, 'раз', 'раза', 'раз')} лёг вовремя`),
  ].sort((a, b) => b.date.localeCompare(a.date))
}

// ---------------- Сон ----------------

export function sleepStats(logs: SleepLog[], today: ISODate, days = 7) {
  const from = addDays(today, -days + 1)
  const week = logs.filter((l) => l.date >= from && l.date <= today)
  if (!week.length) return null
  const durations = week.map((l) => sleepMinutes(l.bedtime, l.wake))
  // Время отбоя относительно 18:00, чтобы корректно усреднять время после полуночи
  const bedRel = week.map((l) => (toMin(l.bedtime) - 18 * 60 + 1440) % 1440)
  const avgBed = fromMin(Math.round(bedRel.reduce((a, b) => a + b, 0) / week.length) + 18 * 60)
  const onTarget = bedRel.filter((m) => m <= 6 * 60).length // до 00:00
  return {
    count: week.length,
    avgDuration: Math.round(durations.reduce((a, b) => a + b, 0) / week.length),
    avgBed,
    onTarget,
  }
}
