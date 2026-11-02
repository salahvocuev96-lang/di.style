import { useEffect, useState } from 'react'
import { Dumbbell, Pencil, Plus, Trash2 } from 'lucide-react'
import { useRows, create, update, remove } from '../data/repo'
import type { Habit, ScheduleBlock, Workout, WorkoutType } from '../data/types'
import { useNow } from '../lib/hooks'
import { addDays, formatDateLong, formatDuration, startOfWeek, WEEKDAYS_SHORT } from '../lib/date'
import { WORKOUT_TYPES } from '../lib/labels'
import { Bars, Button, Card, Empty, Field, IconButton, PageHeader, Pill, Rating, Sheet, confirmAction } from '../components/ui'
import { LinkHabitToggle, autoMarkHabit, linkedHabit } from '../components/habits'
import { timeLabel } from '../components/events'
import { toast } from '../components/Layout'

export default function Sport() {
  const { date: today } = useNow()
  const workouts = useRows<Workout>('workouts')
  const blocks = useRows<ScheduleBlock>('scheduleBlocks')
  const [form, setForm] = useState<Workout | 'new' | null>(null)
  if (!workouts || !blocks) return null

  const sorted = [...workouts].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
  const weekStart = startOfWeek(today)
  const thisWeek = workouts.filter((w) => w.date >= weekStart && w.date <= today)
  const month = workouts.filter((w) => w.date.slice(0, 7) === today.slice(0, 7))
  const weeks = Array.from({ length: 8 }, (_, i) => {
    const s = addDays(weekStart, -7 * (7 - i))
    const e = addDays(s, 6)
    return { s, n: workouts.filter((w) => w.date >= s && w.date <= e).length }
  })
  const maxW = Math.max(3, ...weeks.map((w) => w.n))
  const planned = blocks.filter((b) => b.type === 'sport').sort((a, b) => a.weekday - b.weekday)
  const recent = sorted.slice(0, 5)
  const avgRecovery = recent.length ? (recent.reduce((s, w) => s + w.recovery, 0) / recent.length).toFixed(1) : '—'

  return (
    <div>
      <PageHeader title="Спорт" subtitle="ММА, силовые и восстановление. Без автоматического повышения нагрузки."
        action={<Button variant="primary" size="sm" onClick={() => setForm('new')}><Plus size={16} /><span className="hidden sm:inline">Тренировка</span></Button>} />

      <div className="grid grid-cols-3 gap-3 mb-4 sm:mb-5">
        <Card><p className="text-xs text-muted">Эта неделя</p><p className="text-2xl font-bold tabular mt-1">{thisWeek.length}</p></Card>
        <Card><p className="text-xs text-muted">Этот месяц</p><p className="text-2xl font-bold tabular mt-1">{month.length}</p></Card>
        <Card><p className="text-xs text-muted truncate">Восстановление</p><p className="text-2xl font-bold tabular mt-1">{avgRecovery}<span className="text-sm text-faint">/5</span></p></Card>
      </div>

      <div className="grid lg:grid-cols-5 gap-4 sm:gap-5">
        <div className="min-w-0 lg:col-span-2 space-y-4 sm:space-y-5">
          <Card title="Тренировок по неделям">
            <Bars height={70} data={weeks.map((w, i) => ({ label: i === 7 ? 'эта' : w.s.slice(8) + '.' + w.s.slice(5, 7), value: w.n / maxW, highlight: i === 7, title: `${w.n}` }))} />
          </Card>
          <Card title="По расписанию">
            {planned.length ? (
              <ul className="space-y-2">
                {planned.map((b) => (
                  <li key={b.id} className="flex items-center gap-3 text-sm">
                    <span className="w-8 text-muted font-semibold">{WEEKDAYS_SHORT[b.weekday]}</span>
                    <span className="flex-1 min-w-0 truncate">{b.title}</span>
                    <span className="text-xs text-faint tabular">{timeLabel(b)}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted">Тренировок в расписании нет.</p>}
            <p className="text-[11px] text-faint mt-3">Силовая в выходные — по восстановлению. Изменить можно в «Расписании».</p>
          </Card>
        </div>

        <Card className="lg:col-span-3" title="История">
          {sorted.length ? (
            <ul className="space-y-2">
              {sorted.map((w) => (
                <li key={w.id} className="rounded-xl bg-surface-2 border border-line p-3">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{WORKOUT_TYPES[w.type]} <span className="text-faint font-normal">· {formatDuration(w.duration)}</span></p>
                      <p className="text-xs text-muted capitalize">{formatDateLong(w.date)}</p>
                    </div>
                    <IconButton label="Изменить" className="size-8" onClick={() => setForm(w)}><Pencil size={14} /></IconButton>
                  </div>
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    <Pill>Самочувствие {w.feeling}/5</Pill>
                    <Pill>Восстановление {w.recovery}/5</Pill>
                  </div>
                  {w.notes && <p className="text-sm text-muted mt-2 whitespace-pre-wrap">{w.notes}</p>}
                </li>
              ))}
            </ul>
          ) : <Empty icon={<Dumbbell size={20} />} title="Тренировок пока нет" action={<Button variant="primary" size="sm" onClick={() => setForm('new')}><Plus size={16} />Записать</Button>} />}
        </Card>
      </div>

      <WorkoutForm open={form !== null} workout={form === 'new' ? undefined : form ?? undefined} today={today} onClose={() => setForm(null)} />
    </div>
  )
}

type Draft = Pick<Workout, 'date' | 'type' | 'duration' | 'feeling' | 'recovery' | 'notes'>

function WorkoutForm({ open, workout, today, onClose }: { open: boolean; workout?: Workout; today: string; onClose: () => void }) {
  const habits = useRows<Habit>('habits')
  const habit = linkedHabit(habits, 'cat-sport')
  const blank = (): Draft => ({ date: today, type: 'mma', duration: 90, feeling: 3, recovery: 3, notes: '' })
  const [f, setF] = useState<Draft>(blank)
  const [mark, setMark] = useState(true)
  useEffect(() => {
    if (open) { setF(workout ? { date: workout.date, type: workout.type, duration: workout.duration, feeling: workout.feeling, recovery: workout.recovery, notes: workout.notes } : blank()); setMark(!workout) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, workout])

  const save = async () => {
    if (workout) await update<Workout>('workouts', workout.id, f)
    else await create<Workout>('workouts', f)
    if (mark && habit) await autoMarkHabit(habit.id, f.date, f.type === 'stretch' ? 'min' : 'normal')
    toast('Тренировка сохранена')
    onClose()
  }
  const del = async () => {
    if (!workout || !confirmAction('Удалить тренировку?')) return
    await remove('workouts', workout.id)
    onClose()
  }

  return (
    <Sheet open={open} onClose={onClose} title={workout ? 'Изменить тренировку' : 'Новая тренировка'}>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Тип">
          <select className="input" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value as WorkoutType, duration: e.target.value === 'mma' ? 90 : f.duration })}>
            {(Object.keys(WORKOUT_TYPES) as WorkoutType[]).map((t) => <option key={t} value={t}>{WORKOUT_TYPES[t]}</option>)}
          </select>
        </Field>
        <Field label="Дата"><input type="date" className="input" value={f.date} max={today} onChange={(e) => setF({ ...f, date: e.target.value || today })} /></Field>
      </div>
      <Field label="Продолжительность, мин"><input type="number" min={1} inputMode="numeric" className="input" value={f.duration} onChange={(e) => setF({ ...f, duration: Math.max(0, Number(e.target.value) || 0) })} /></Field>
      <Field label="Самочувствие"><Rating value={f.feeling} onChange={(v) => setF({ ...f, feeling: v })} labels={['тяжело', 'отлично']} /></Field>
      <Field label="Восстановление"><Rating value={f.recovery} onChange={(v) => setF({ ...f, recovery: v })} labels={['не восстановился', 'полностью']} /></Field>
      <Field label="Заметки"><textarea className="input min-h-20" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} placeholder="Что отрабатывал, ощущения, травмы…" /></Field>
      <LinkHabitToggle habit={habit} checked={mark} onChange={setMark} />
      <div className="flex gap-2">
        {workout && <Button variant="danger" onClick={del} aria-label="Удалить"><Trash2 size={16} /></Button>}
        <Button variant="ghost" className="flex-1" onClick={onClose}>Отмена</Button>
        <Button variant="primary" className="flex-1" disabled={!f.duration} onClick={save}>Сохранить</Button>
      </div>
    </Sheet>
  )
}
