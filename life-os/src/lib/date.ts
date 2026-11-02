import type { HM, ISODate } from '../data/types'

const pad = (n: number) => String(n).padStart(2, '0')

/** Локальная дата 'YYYY-MM-DD' (без сдвига часового пояса). */
export function toISODate(d: Date = new Date()): ISODate {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function parseISODate(s: ISODate): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(s: ISODate, n: number): ISODate {
  const d = parseISODate(s)
  d.setDate(d.getDate() + n)
  return toISODate(d)
}

/** День недели: 0 = Пн … 6 = Вс */
export function weekdayOf(s: ISODate): number {
  return (parseISODate(s).getDay() + 6) % 7
}

export function startOfWeek(s: ISODate): ISODate {
  return addDays(s, -weekdayOf(s))
}

export function weekDates(s: ISODate): ISODate[] {
  const start = startOfWeek(s)
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

export function lastNDates(end: ISODate, n: number): ISODate[] {
  return Array.from({ length: n }, (_, i) => addDays(end, i - n + 1))
}

export function toMin(hm: HM): number {
  const [h, m] = hm.split(':').map(Number)
  return h * 60 + m
}

export function fromMin(min: number): HM {
  const m = ((min % 1440) + 1440) % 1440
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`
}

/** Продолжительность сна в минутах (с учётом перехода через полночь). */
export function sleepMinutes(bed: HM, wake: HM): number {
  let d = toMin(wake) - toMin(bed)
  if (d <= 0) d += 1440
  return d
}

export function formatDuration(min: number): string {
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  if (!h) return `${m} мин`
  return m ? `${h} ч ${m} мин` : `${h} ч`
}

export const WEEKDAYS = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье']
export const WEEKDAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

export function formatDateLong(s: ISODate): string {
  return parseISODate(s).toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })
}

export function formatDateShort(s: ISODate): string {
  return parseISODate(s).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

export function greeting(d = new Date()): string {
  const h = d.getHours()
  if (h < 5) return 'Доброй ночи'
  if (h < 12) return 'Доброе утро'
  if (h < 18) return 'Добрый день'
  return 'Добрый вечер'
}

export function nowHM(d = new Date()): HM {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}
