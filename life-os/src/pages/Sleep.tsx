import { useEffect, useState } from 'react'
import { Moon, Pencil, Plus, Trash2 } from 'lucide-react'
import { useRows, create, update, remove } from '../data/repo'
import type { Habit, SleepLog } from '../data/types'
import { useNow } from '../lib/hooks'
import { formatDateLong, formatDuration, lastNDates, sleepMinutes, toMin, WEEKDAYS_SHORT, weekdayOf } from '../lib/date'
import { sleepStats } from '../lib/logic'
import { Button, Card, Empty, Field, IconButton, PageHeader, Rating, Sheet, cx, confirmAction } from '../components/ui'
import { LinkHabitToggle, autoMarkHabit, linkedHabit } from '../components/habits'
import { toast } from '../components/Layout'

// Время отбоя относительно 18:00 → можно сравнивать «23:30» и «01:00»
const rel = (hm: string) => (toMin(hm) - 18 * 60 + 1440) % 1440
const TARGET_FROM = rel('23:30')
const TARGET_TO = rel('00:00')

export function bedLevel(bed: string): 'extra' | 'normal' | 'min' | null {
  const r = rel(bed)
  if (r <= TARGET_FROM) return 'extra'
  if (r <= TARGET_TO) return 'normal'
  if (r <= rel('01:00')) return 'min'
  return null
}

export default function Sleep() {
  const { date: today } = useNow()
  const logs = useRows<SleepLog>('sleepLogs')
  const [form, setForm] = useState<SleepLog | 'new' | null>(null)
  if (!logs) return null

  const stats = sleepStats(logs, today, 7)
  const sorted = [...logs].sort((a, b) => b.date.localeCompare(a.date))
  const last14 = lastNDates(today, 14).map((d) => ({ d, l: logs.find((x) => x.date === d) }))
  const hasToday = logs.some((l) => l.date === today)

  // Визуализация: шкала с 21:00 до 12:00, полоса сна для каждой ночи
  const SCALE_START = 21 * 60
  const SCALE_LEN = 15 * 60
  const pos = (hm: string) => (((toMin(hm) - SCALE_START + 1440) % 1440) / SCALE_LEN) * 100

  return (
    <div>
      <PageHeader title="Сон" subtitle="Цель — постепенно сдвигать отбой к 23:30–00:00. Без резких изменений."
        action={<Button variant="primary" size="sm" onClick={() => setForm('new')}><Plus size={16} /><span className="hidden sm:inline">Записать</span></Button>} />

      {!hasToday && (
        <button onClick={() => setForm('new')} className="card w-full p-4 mb-4 flex items-center gap-3 text-left hover:border-line-strong animate-fade-up">
          <Moon size={20} className="text-accent" />
          <span className="flex-1"><b className="font-semibold">Как спал этой ночью?</b><span className="block text-sm text-muted">Запиши время отбоя и подъёма — 15 секунд.</span></span>
          <Plus size={18} className="text-muted" />
        </button>
      )}

      <div className="grid grid-cols-3 gap-3 mb-4 sm:mb-5">
        <Card><p className="text-xs text-muted">Средний сон</p><p className="text-xl sm:text-2xl font-bold tabular mt-1">{stats ? formatDuration(stats.avgDuration) : '—'}</p></Card>
        <Card><p className="text-xs text-muted">Средний отбой</p><p className="text-xl sm:text-2xl font-bold tabular mt-1">{stats?.avgBed ?? '—'}</p></Card>
        <Card><p className="text-xs text-muted">До 00:00</p><p className="text-xl sm:text-2xl font-bold tabular mt-1">{stats ? `${stats.onTarget}/${stats.count}` : '—'}</p></Card>
      </div>

      <Card title="Последние 14 ночей" className="mb-4 sm:mb-5">
        <div className="relative">
          <div className="absolute top-0 bottom-0 bg-good/[0.07] border-x border-good/20 rounded" style={{ left: `${pos('23:30')}%`, width: `${pos('00:00') - pos('23:30')}%` }} />
          <div className="space-y-1.5 relative">
            {last14.map(({ d, l }) => (
              <div key={d} className="flex items-center gap-2">
                <span className={cx('w-12 text-[11px] shrink-0 tabular', d === today ? 'text-ink font-semibold' : 'text-faint')}>{WEEKDAYS_SHORT[weekdayOf(d)]} {d.slice(8)}</span>
                <div className="relative flex-1 h-4 rounded bg-white/[0.03]">
                  {l && (
                    <div className="absolute top-0 h-full rounded bg-gradient-accent opacity-80" title={`${l.bedtime}–${l.wake}`}
                      style={{ left: `${pos(l.bedtime)}%`, width: `${Math.max(2, Math.min(100 - pos(l.bedtime), (sleepMinutes(l.bedtime, l.wake) / SCALE_LEN) * 100))}%` }} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-between text-[10px] text-faint mt-2 pl-14 tabular">
          <span>21:00</span><span>00:00</span><span>03:00</span><span>06:00</span><span>09:00</span><span>12:00</span>
        </div>
        <p className="text-[11px] text-faint mt-2">Зелёная зона — целевой отбой 23:30–00:00.</p>
      </Card>

      <Card title="История">
        {sorted.length ? (
          <ul className="divide-y divide-line">
            {sorted.slice(0, 60).map((l) => {
              const lvl = bedLevel(l.bedtime)
              return (
                <li key={l.id} className="flex items-center gap-3 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium tabular">{l.bedtime} → {l.wake} <span className="text-faint font-normal">· {formatDuration(sleepMinutes(l.bedtime, l.wake))}</span></p>
                    <p className="text-xs text-muted capitalize">{formatDateLong(l.date)}{l.note ? ` · ${l.note}` : ''}</p>
                  </div>
                  {lvl && lvl !== 'min' && <span className="text-[11px] text-good">в цели</span>}
                  <IconButton label="Изменить" onClick={() => setForm(l)}><Pencil size={15} /></IconButton>
                </li>
              )
            })}
          </ul>
        ) : <Empty icon={<Moon size={20} />} title="Записей пока нет" />}
      </Card>

      <SleepForm open={form !== null} log={form === 'new' ? undefined : form ?? undefined} today={today} onClose={() => setForm(null)} />
    </div>
  )
}

function SleepForm({ open, log, today, onClose }: { open: boolean; log?: SleepLog; today: string; onClose: () => void }) {
  const habits = useRows<Habit>('habits')
  const habit = linkedHabit(habits, 'cat-sleep')
  const [f, setF] = useState({ date: today, bedtime: '00:00', wake: '08:30', quality: 3, note: '' })
  const [mark, setMark] = useState(true)
  useEffect(() => {
    if (open) { setF(log ? { date: log.date, bedtime: log.bedtime, wake: log.wake, quality: log.quality, note: log.note } : { date: today, bedtime: '00:00', wake: '08:30', quality: 3, note: '' }); setMark(!log) }
  }, [open, log, today])
  const lvl = bedLevel(f.bedtime)

  const save = async () => {
    if (log) await update<SleepLog>('sleepLogs', log.id, f)
    else await create<SleepLog>('sleepLogs', f)
    // Привычку «сон вовремя» отмечаем за вечер, когда лёг (день до пробуждения, если лёг после полуночи — тоже он)
    if (mark && habit && lvl) {
      const d = new Date(f.date + 'T00:00:00')
      d.setDate(d.getDate() - 1)
      const pad = (n: number) => String(n).padStart(2, '0')
      await autoMarkHabit(habit.id, `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, lvl)
    }
    toast('Сон записан')
    onClose()
  }
  const del = async () => {
    if (!log || !confirmAction('Удалить запись сна?')) return
    await remove('sleepLogs', log.id)
    onClose()
  }

  return (
    <Sheet open={open} onClose={onClose} title={log ? 'Изменить запись' : 'Запись сна'}>
      <Field label="Дата пробуждения"><input type="date" className="input" value={f.date} max={today} onChange={(e) => setF({ ...f, date: e.target.value || today })} /></Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Лёг спать"><input type="time" className="input" value={f.bedtime} onChange={(e) => setF({ ...f, bedtime: e.target.value || '00:00' })} /></Field>
        <Field label="Проснулся"><input type="time" className="input" value={f.wake} onChange={(e) => setF({ ...f, wake: e.target.value || '08:00' })} /></Field>
      </div>
      <p className="text-sm text-muted -mt-1 mb-4">Сон: <b className="text-ink">{formatDuration(sleepMinutes(f.bedtime, f.wake))}</b>
        {lvl === 'extra' && <span className="text-good"> · отбой в цели</span>}
        {lvl === 'normal' && <span className="text-good"> · отбой в цели</span>}
        {lvl === 'min' && <span className="text-accent-2"> · близко к цели</span>}
      </p>
      <Field label="Качество сна"><Rating value={f.quality} onChange={(v) => setF({ ...f, quality: v })} labels={['плохо', 'отлично']} /></Field>
      <Field label="Заметка"><input className="input" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} placeholder="Необязательно" /></Field>
      {lvl && <LinkHabitToggle habit={habit} checked={mark} onChange={setMark} />}
      <div className="flex gap-2">
        {log && <Button variant="danger" onClick={del} aria-label="Удалить"><Trash2 size={16} /></Button>}
        <Button variant="ghost" className="flex-1" onClick={onClose}>Отмена</Button>
        <Button variant="primary" className="flex-1" onClick={save}>Сохранить</Button>
      </div>
    </Sheet>
  )
}
