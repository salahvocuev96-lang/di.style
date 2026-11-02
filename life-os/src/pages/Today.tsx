import { useMemo, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Battery, Check, ChevronDown, Clock, Feather, Plus, Trophy, ArrowRight, CalendarX2, CalendarCheck2, Circle, CheckCircle2,
  Dumbbell, Code, Languages, Moon, Flame,
} from 'lucide-react'
import { useRows, create, update, remove } from '../data/repo'
import type {
  Category, Checkin, DevLog, EnglishSession, Habit, HabitLog, ScheduleBlock, ScheduleOverride, SleepLog, Task, Workout,
} from '../data/types'
import { useNow } from '../lib/hooks'
import { addDays, formatDateLong, greeting, toMin, weekDates, WEEKDAYS_SHORT, formatDuration, formatDateShort } from '../lib/date'
import {
  achievements, adaptDay, dayProgress, eventEndMin, eventsForDate, freeWindows, isDueOn, logsByHabitDate, regularity, type DayEvent,
} from '../lib/logic'
import { Bars, Button, Card, Empty, IconButton, Rating, Ring, cx } from '../components/ui'
import { HabitCheck } from '../components/habits'
import { EventRow } from '../components/events'
import { toast } from '../components/Layout'

const ACH_ICONS = { check: CheckCircle2, flame: Flame, dumbbell: Dumbbell, languages: Languages, code: Code, moon: Moon } as const

export default function Today() {
  const { date: today, time } = useNow()
  const habits = useRows<Habit>('habits')
  const logs = useRows<HabitLog>('habitLogs')
  const cats = useRows<Category>('categories')
  const blocks = useRows<ScheduleBlock>('scheduleBlocks')
  const overrides = useRows<ScheduleOverride>('scheduleOverrides')
  const checkins = useRows<Checkin>('checkins')
  const sleep = useRows<SleepLog>('sleepLogs')
  const tasks = useRows<Task>('tasks')
  const workouts = useRows<Workout>('workouts')
  const english = useRows<EnglishSession>('englishSessions')
  const devLogs = useRows<DevLog>('devLogs')

  const logMap = useMemo(() => logsByHabitDate(logs ?? []), [logs])
  const events = useMemo(() => eventsForDate(today, blocks ?? [], overrides ?? []), [today, blocks, overrides])
  const tomorrowEvents = useMemo(() => eventsForDate(addDays(today, 1), blocks ?? [], overrides ?? []).filter((e) => !e.cancelled && e.type !== 'wake'), [today, blocks, overrides])
  const checkin = checkins?.filter((c) => c.date === today).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]
  const lastSleep = sleep?.filter((s) => s.date === today)[0]
  const plan = adaptDay(checkin, events, lastSleep)
  const light = plan.mode === 'light'

  const activeHabits = (habits ?? []).filter((h) => !h.archived).sort((a, b) => a.order - b.order)
  const dueHabits = activeHabits.filter((h) => isDueOn(h, today, logMap))
  const progress = dayProgress(activeHabits, logMap, today)
  const week = weekDates(today).map((d, i) => {
    const p = dayProgress(activeHabits, logMap, d)
    return { label: WEEKDAYS_SHORT[i], value: d > today ? 0 : p.ratio, highlight: d === today, title: `${p.done}/${p.total}` }
  })
  const weekDone = weekDates(today).filter((d) => d <= today).reduce((s, d) => s + dayProgress(activeHabits, logMap, d).done, 0)
  const windows = freeWindows(events, { from: time })
  const ach = achievements({ logs: logs ?? [], workouts: workouts ?? [], english: english ?? [], devLogs: devLogs ?? [], sleep: sleep ?? [] }).slice(0, 4)
  const catMap = new Map((cats ?? []).map((c) => [c.id, c]))

  const loading = !habits || !logs || !blocks || !checkins
  if (loading) return <div className="text-muted">Загрузка…</div>

  return (
    <div className="space-y-4 sm:space-y-5">
      <header className="mb-2">
        <p className="text-sm text-muted capitalize">{formatDateLong(today)}</p>
        <h1 className="text-[28px] sm:text-4xl font-bold tracking-tight mt-1">{greeting()} <span className="text-gradient">👋</span></h1>
      </header>

      <CheckinCard key={today} today={today} checkin={checkin} />

      {light && (
        <div className="card p-4 border-accent-2/25 bg-accent-2/[0.05] animate-fade-up">
          <div className="flex items-center gap-2 font-semibold text-accent-2"><Feather size={18} /> Лёгкий день</div>
          <p className="text-sm text-muted mt-1">Причина: {plan.reasons.join(', ')}.</p>
          <ul className="mt-2 space-y-1">
            {plan.tips.map((t) => <li key={t} className="text-sm flex gap-2"><span className="text-accent-2">•</span>{t}</li>)}
          </ul>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
        <Card>
          <div className="flex items-center gap-4">
            <Ring value={progress.ratio} size={84} stroke={8}>
              <span className="text-lg font-bold tabular">{Math.round(progress.ratio * 100)}%</span>
            </Ring>
            <div>
              <p className="text-sm text-muted">Прогресс дня</p>
              <p className="text-2xl font-bold tabular mt-0.5">{progress.done} <span className="text-faint text-lg">/ {progress.total}</span></p>
              <p className="text-xs text-faint mt-1">{progress.total === 0 ? 'На сегодня привычек нет' : progress.done === progress.total ? 'Всё на сегодня сделано' : 'Привычек выполнено'}</p>
            </div>
          </div>
        </Card>
        <Card title="Неделя" action={<span className="text-xs text-muted tabular">{weekDone} {weekDone === 1 ? 'отметка' : 'отметок'}</span>}>
          <Bars data={week} height={60} />
        </Card>
      </div>

      <div className="grid lg:grid-cols-5 gap-4 sm:gap-5">
        <Card className="lg:col-span-3" title="Привычки на сегодня" action={<Link to="/habits" className="text-xs text-muted hover:text-ink inline-flex items-center gap-1">Все <ArrowRight size={13} /></Link>}>
          {dueHabits.length ? (
            <div className="space-y-2">
              {dueHabits.map((h) => (
                <HabitCheck key={h.id} habit={h} category={catMap.get(h.categoryId)} log={logMap.get(`${h.id}|${today}`)} date={today} reg={regularity(h, logMap, today)} light={light} />
              ))}
            </div>
          ) : (
            <Empty icon={<CheckCircle2 size={20} />} title="На сегодня привычек нет" action={<Link to="/habits"><Button size="sm">Добавить привычку</Button></Link>} />
          )}
        </Card>

        <div className="min-w-0 lg:col-span-2 space-y-4 sm:space-y-5">
          <ScheduleToday today={today} time={time} events={events} tomorrow={tomorrowEvents} />
          <Card title={<span className="inline-flex items-center gap-2"><Clock size={16} className="text-accent-2" />Свободные окна</span>}>
            {windows.length ? (
              <div className="flex flex-wrap gap-2">
                {windows.map((w) => (
                  <div key={w.start} className="px-3 py-2 rounded-xl bg-surface-2 border border-line">
                    <p className="text-sm font-semibold tabular">{w.start}–{w.end}</p>
                    <p className="text-[11px] text-faint">{formatDuration(w.minutes)}</p>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-muted">До отбоя (23:30) свободных окон больше 30 минут нет.</p>}
            <p className="text-[11px] text-faint mt-3">Подбери в окно английский (20–30 мин) или код — без жёсткого времени.</p>
          </Card>
        </div>
      </div>

      <TasksToday today={today} tasks={tasks ?? []} />

      <Card title={<span className="inline-flex items-center gap-2"><Trophy size={16} className="text-warn" />Последние достижения</span>}>
        {ach.length ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {ach.map((a) => {
              const I = ACH_ICONS[a.icon as keyof typeof ACH_ICONS] ?? Trophy
              return (
                <div key={a.id} className="rounded-2xl bg-surface-2 border border-line p-3">
                  <I size={18} className="text-warn" />
                  <p className="text-sm font-semibold mt-2 leading-tight">{a.title}</p>
                  <p className="text-[11px] text-faint mt-1">{formatDateShort(a.date)}</p>
                </div>
              )
            })}
          </div>
        ) : <p className="text-sm text-muted">Отметь первую привычку — и здесь появится первое достижение.</p>}
      </Card>
    </div>
  )
}

function CheckinCard({ today, checkin }: { today: string; checkin?: Checkin }) {
  const [editing, setEditing] = useState(!checkin)
  const [energy, setEnergy] = useState(checkin?.energy ?? 0)
  const [well, setWell] = useState(checkin?.wellbeing ?? 0)
  useEffect(() => {
    if (checkin) { setEnergy(checkin.energy); setWell(checkin.wellbeing); setEditing(false) }
  }, [checkin])

  const save = async () => {
    if (checkin) await update<Checkin>('checkins', checkin.id, { energy, wellbeing: well })
    else await create<Checkin>('checkins', { date: today, energy, wellbeing: well, note: '' })
    setEditing(false)
    toast('Чек-ин сохранён')
  }

  if (!editing && checkin) {
    return (
      <div className="card px-4 py-3 flex items-center gap-3 animate-fade-up">
        <Battery size={18} className="text-accent" />
        <p className="text-sm flex-1">Энергия <b className="tabular">{checkin.energy}/5</b> · Самочувствие <b className="tabular">{checkin.wellbeing}/5</b></p>
        <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>Изменить</Button>
      </div>
    )
  }
  return (
    <Card title={<span className="inline-flex items-center gap-2"><Battery size={16} className="text-accent" />Как ты сегодня?</span>}>
      <p className="text-xs text-muted -mt-1 mb-3">10 секунд — и план дня подстроится под твоё состояние.</p>
      <div className="grid sm:grid-cols-2 gap-4">
        <div><p className="text-sm mb-2">Энергия</p><Rating value={energy} onChange={setEnergy} labels={['нет сил', 'полон сил']} /></div>
        <div><p className="text-sm mb-2">Самочувствие</p><Rating value={well} onChange={setWell} labels={['плохо', 'отлично']} /></div>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        {checkin && <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>Отмена</Button>}
        <Button variant="primary" size="sm" disabled={!energy || !well} onClick={save}><Check size={16} />Сохранить</Button>
      </div>
    </Card>
  )
}

function ScheduleToday({ today, time, events, tomorrow }: { today: string; time: string; events: DayEvent[]; tomorrow: DayEvent[] }) {
  const nowMin = toMin(time)
  const list = events.filter((e) => e.type !== 'wake')
  const toggle = async (e: DayEvent) => {
    if (e.blockId && !e.cancelled) {
      await create<ScheduleOverride>('scheduleOverrides', { date: today, action: 'cancel', blockId: e.blockId, title: e.title, type: e.type, start: e.start, end: e.end })
      toast('Отменено на сегодня')
    } else if (e.overrideId) {
      await remove('scheduleOverrides', e.overrideId)
      toast(e.cancelled ? 'Возвращено в план' : 'Удалено')
    }
  }
  return (
    <Card title="Расписание" action={<Link to="/schedule" className="text-xs text-muted hover:text-ink inline-flex items-center gap-1">Неделя <ArrowRight size={13} /></Link>}>
      {list.length ? (
        <div className="divide-y divide-line -my-1">
          {list.map((e) => {
            const active = !!e.start && !e.cancelled && nowMin >= toMin(e.start) && nowMin < eventEndMin(e)!
            return (
              <EventRow key={e.key} e={e} active={active} right={
                <IconButton label={e.cancelled ? 'Вернуть' : e.blockId ? 'Отменить на сегодня' : 'Удалить'} onClick={() => toggle(e)}>
                  {e.cancelled ? <CalendarCheck2 size={16} /> : <CalendarX2 size={16} />}
                </IconButton>
              } />
            )
          })}
        </div>
      ) : <p className="text-sm text-muted">Сегодня ничего не запланировано — свободный день.</p>}
      {tomorrow.length > 0 && (
        <p className="text-xs text-faint mt-3 pt-3 border-t border-line">
          Завтра: {tomorrow.slice(0, 3).map((e) => `${e.title}${e.start ? ' ' + e.start : ''}`).join(' · ')}
        </p>
      )}
    </Card>
  )
}

function TasksToday({ today, tasks }: { today: string; tasks: Task[] }) {
  const [text, setText] = useState('')
  const [showOld, setShowOld] = useState(false)
  const todays = tasks.filter((t) => t.plannedDate === today).sort((a, b) => Number(a.done) - Number(b.done) || a.priority - b.priority)
  // Невыполненные задачи прошлых дней не копятся как «просрочка» — их можно перенести или снять дату
  const earlier = tasks.filter((t) => !t.done && t.plannedDate && t.plannedDate < today)

  const add = async () => {
    const title = text.trim()
    if (!title) return
    await create<Task>('tasks', { title, projectId: null, done: false, doneAt: null, priority: 2, plannedDate: today, deadline: null })
    setText('')
  }
  const toggle = (t: Task) => update<Task>('tasks', t.id, { done: !t.done, doneAt: t.done ? null : new Date().toISOString() })

  return (
    <Card title="Задачи на сегодня" action={<Link to="/projects" className="text-xs text-muted hover:text-ink inline-flex items-center gap-1">Проекты <ArrowRight size={13} /></Link>}>
      <form onSubmit={(e) => { e.preventDefault(); add() }} className="flex gap-2 mb-3">
        <input className="input" placeholder="Быстро добавить задачу на сегодня…" value={text} onChange={(e) => setText(e.target.value)} />
        <Button variant="primary" type="submit" disabled={!text.trim()} aria-label="Добавить" className="shrink-0 w-11 px-0"><Plus size={18} /></Button>
      </form>
      {todays.length ? (
        <ul className="space-y-1">
          {todays.map((t) => (
            <li key={t.id} className="flex items-center gap-2 group">
              <button onClick={() => toggle(t)} className="flex items-center gap-3 flex-1 min-w-0 py-2 text-left" aria-label={t.done ? 'Вернуть' : 'Выполнено'}>
                {t.done ? <CheckCircle2 size={20} className="text-good shrink-0" /> : <Circle size={20} className={cx('shrink-0', t.priority === 1 ? 'text-bad' : 'text-faint')} />}
                <span className={cx('text-sm truncate', t.done && 'line-through text-faint')}>{t.title}</span>
              </button>
              {!t.done && (
                <Button size="sm" variant="ghost" onClick={async () => { await update<Task>('tasks', t.id, { plannedDate: addDays(today, 1) }); toast('Перенесено на завтра') }}>Завтра</Button>
              )}
            </li>
          ))}
        </ul>
      ) : <p className="text-sm text-muted">Задач на сегодня нет. Это нормально.</p>}

      {earlier.length > 0 && (
        <div className="mt-3 pt-3 border-t border-line">
          <button onClick={() => setShowOld((v) => !v)} className="text-xs text-muted hover:text-ink inline-flex items-center gap-1">
            Не дошли руки раньше: {earlier.length} <ChevronDown size={14} className={cx('transition', showOld && 'rotate-180')} />
          </button>
          {showOld && (
            <ul className="mt-2 space-y-1">
              {earlier.map((t) => (
                <li key={t.id} className="flex items-center gap-2 text-sm">
                  <span className="flex-1 min-w-0 truncate text-muted">{t.title}</span>
                  <Button size="sm" variant="ghost" onClick={() => update<Task>('tasks', t.id, { plannedDate: today })}>Сегодня</Button>
                  <Button size="sm" variant="ghost" onClick={() => update<Task>('tasks', t.id, { plannedDate: null })}>Без даты</Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Card>
  )
}
