import { describe, expect, it } from 'vitest'
import type { Checkin, Habit, HabitLog, ScheduleBlock } from '../data/types'
import { adaptDay, dayProgress, eventsForDate, freeWindows, isDueOn, logsByHabitDate, regularity, achievements, sleepStats } from './logic'
import { addDays, sleepMinutes, weekdayOf } from './date'

const base = { createdAt: '2026-10-01T00:00:00Z', updatedAt: '2026-10-01T00:00:00Z', deletedAt: null, syncedAt: null }
const habit = (id: string, frequency: Habit['frequency']): Habit => ({
  ...base, id, name: id, categoryId: 'c', description: '', frequency, minGoal: '', normalGoal: '', extraGoal: '', archived: false, order: 0,
})
let n = 0
const log = (habitId: string, date: string, level: HabitLog['level'], skipReason: HabitLog['skipReason'] = null): HabitLog => ({
  ...base, id: `l${n++}`, habitId, date, level, skipReason, note: '',
})

const TODAY = '2026-11-02' // понедельник

describe('date', () => {
  it('weekday Monday = 0', () => expect(weekdayOf(TODAY)).toBe(0))
  it('sleep across midnight', () => expect(sleepMinutes('23:30', '07:30')).toBe(480))
  it('addDays crosses month', () => expect(addDays('2026-10-31', 1)).toBe('2026-11-01'))
})

describe('regularity', () => {
  const h = habit('eng', { type: 'daily' })
  it('не учитывает сегодняшний день, пока он не отмечен', () => {
    const m = logsByHabitDate([log('eng', addDays(TODAY, -1), 'normal')])
    const r = regularity(h, m, TODAY, 7)
    expect(r.expected).toBe(6)
    expect(r.done).toBe(1)
  })
  it('пропуск по болезни не входит в ожидаемое', () => {
    const m = logsByHabitDate([log('eng', addDays(TODAY, -1), 'skip', 'sick'), log('eng', addDays(TODAY, -2), 'min')])
    const r = regularity(h, m, TODAY, 7)
    expect(r.expected).toBe(5)
    expect(r.done).toBe(1)
  })
  it('пропуск «нет времени» входит в ожидаемое', () => {
    const m = logsByHabitDate([log('eng', addDays(TODAY, -1), 'skip', 'no_time')])
    expect(regularity(h, m, TODAY, 7).expected).toBe(6)
  })
  it('N раз в неделю', () => {
    const w = habit('gym', { type: 'weekly', times: 3 })
    const m = logsByHabitDate([log('gym', addDays(TODAY, -1), 'normal'), log('gym', addDays(TODAY, -3), 'normal')])
    const r = regularity(w, m, TODAY, 7)
    expect(r).toMatchObject({ done: 2, expected: 3 })
  })
})

describe('isDueOn / dayProgress', () => {
  it('недельная привычка скрывается, когда цель набрана', () => {
    const w = habit('gym', { type: 'weekly', times: 1 })
    const tue = addDays(TODAY, 1)
    const m = logsByHabitDate([log('gym', TODAY, 'normal')])
    expect(isDueOn(w, tue, m)).toBe(false)
    expect(isDueOn(w, TODAY, m)).toBe(true)
  })
  it('по дням недели', () => {
    const d = habit('d', { type: 'days', days: [1] })
    expect(isDueOn(d, TODAY, new Map())).toBe(false)
    expect(isDueOn(d, addDays(TODAY, 1), new Map())).toBe(true)
  })
  it('пропуск не уменьшает прогресс дня', () => {
    const hs = [habit('a', { type: 'daily' }), habit('b', { type: 'daily' })]
    const m = logsByHabitDate([log('a', TODAY, 'min'), log('b', TODAY, 'skip', 'rest')])
    expect(dayProgress(hs, m, TODAY)).toMatchObject({ done: 1, total: 1, ratio: 1 })
  })
})

const block = (weekday: number, type: ScheduleBlock['type'], start: string | null, end: string | null = null): ScheduleBlock => ({
  ...base, id: `b${n++}`, weekday, title: type, type, start, end, note: '',
})

describe('schedule', () => {
  const blocks = [block(0, 'wake', '08:30'), block(0, 'study', '10:35', '14:00'), block(0, 'sport', '20:00')]
  it('свободные окна между занятиями', () => {
    const ev = eventsForDate(TODAY, blocks, [])
    const w = freeWindows(ev)
    expect(w.map((x) => `${x.start}-${x.end}`)).toEqual(['08:30-10:35', '14:00-20:00', '21:30-23:30'])
  })
  it('отменённое занятие освобождает время', () => {
    const study = blocks[1]
    const ev = eventsForDate(TODAY, blocks, [{ ...base, id: 'o', date: TODAY, action: 'cancel', blockId: study.id, title: '', type: 'study', start: null, end: null }])
    expect(freeWindows(ev)[0]).toMatchObject({ start: '08:30', end: '20:00' })
  })
  it('окна от текущего времени', () => {
    const w = freeWindows(eventsForDate(TODAY, blocks, []), { from: '15:00' })
    expect(w[0].start).toBe('15:00')
  })
})

describe('adaptDay', () => {
  const ch = (energy: number, wellbeing = 4): Checkin => ({ ...base, id: 'c', date: TODAY, energy, wellbeing, note: '' })
  it('без чек-ина режим неизвестен', () => expect(adaptDay(undefined, [], undefined).mode).toBe('unknown'))
  it('низкая энергия — лёгкий день', () => expect(adaptDay(ch(2), [], undefined).mode).toBe('light'))
  it('хорошая энергия — обычный день', () => expect(adaptDay(ch(4), [], undefined).mode).toBe('normal'))
  it('мало сна — лёгкий день', () => {
    const s = { ...base, id: 's', date: TODAY, bedtime: '03:00', wake: '07:00', quality: 3, note: '' }
    expect(adaptDay(ch(4), [], s).reasons).toContain('мало сна')
  })
})

describe('achievements & sleep', () => {
  it('первое выполнение даёт достижение', () => {
    const a = achievements({ logs: [log('x', TODAY, 'normal')], workouts: [], english: [], devLogs: [], sleep: [] })
    expect(a[0].title).toBe('1 выполнение привычек')
  })
  it('средний отбой через полночь считается корректно', () => {
    const mk = (date: string, bedtime: string) => ({ ...base, id: date, date, bedtime, wake: '08:00', quality: 3, note: '' })
    const s = sleepStats([mk(TODAY, '23:00'), mk(addDays(TODAY, -1), '01:00')], TODAY)!
    expect(s.avgBed).toBe('00:00')
    expect(s.onTarget).toBe(1)
  })
})
