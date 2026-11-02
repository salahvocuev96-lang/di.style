import { useMemo, useState } from 'react'
import { Archive, ArchiveRestore, CheckCircle2, Pencil, Plus, Trash2 } from 'lucide-react'
import { useRows, update, remove } from '../data/repo'
import type { Category, Habit, HabitLog } from '../data/types'
import { useNow } from '../lib/hooks'
import { addDays, formatDateShort, lastNDates, WEEKDAYS_SHORT, weekdayOf } from '../lib/date'
import { isDueOn, logsByHabitDate, regularity } from '../lib/logic'
import { LEVELS, SKIP_REASONS } from '../lib/labels'
import { Bar, Button, Card, Empty, IconButton, PageHeader, Segmented, Sheet, cx, confirmAction } from '../components/ui'
import { CategoryIcon } from '../components/CategoryIcon'
import { HabitCheck, HabitForm, frequencyLabel } from '../components/habits'
import { toast } from '../components/Layout'

const LEVEL_COLOR: Record<string, string> = { min: 'rgb(167 139 250 / 0.45)', normal: 'rgb(167 139 250 / 0.8)', extra: '#22d3ee', skip: 'rgb(255 255 255 / 0.12)' }

export default function Habits() {
  const { date: today } = useNow()
  const habits = useRows<Habit>('habits')
  const logs = useRows<HabitLog>('habitLogs')
  const cats = useRows<Category>('categories')
  const [form, setForm] = useState<Habit | 'new' | null>(null)
  const [detail, setDetail] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [showArchived, setShowArchived] = useState(false)

  const logMap = useMemo(() => logsByHabitDate(logs ?? []), [logs])
  const habitCats = (cats ?? []).filter((c) => c.kind === 'habit')
  const catMap = new Map((cats ?? []).map((c) => [c.id, c]))
  if (!habits || !logs || !cats) return null

  const list = habits
    .filter((h) => h.archived === showArchived)
    .filter((h) => filter === 'all' || h.categoryId === filter)
    .sort((a, b) => a.order - b.order)
  const usedCats = habitCats.filter((c) => habits.some((h) => h.categoryId === c.id && h.archived === showArchived))
  const detailHabit = habits.find((h) => h.id === detail)

  return (
    <div>
      <PageHeader title="Привычки" subtitle="Регулярность важнее идеальных серий. Пропуск по причине не считается провалом."
        action={<Button variant="primary" size="sm" onClick={() => setForm('new')}><Plus size={16} /><span className="hidden sm:inline">Привычка</span></Button>} />

      <div className="flex flex-wrap gap-2 mb-4">
        <Segmented value={filter} onChange={setFilter} className="flex-1 min-w-0"
          options={[{ value: 'all', label: 'Все' }, ...usedCats.map((c) => ({ value: c.id, label: c.name }))]} />
        <Button size="sm" variant="ghost" onClick={() => { setShowArchived((v) => !v); setFilter('all') }} className="h-11">
          {showArchived ? <><CheckCircle2 size={15} />Активные</> : <><Archive size={15} />Архив</>}
        </Button>
      </div>

      {list.length ? (
        <div className="grid md:grid-cols-2 gap-3 sm:gap-4">
          {list.map((h) => {
            const cat = catMap.get(h.categoryId)
            const r7 = regularity(h, logMap, today, 7)
            const r30 = regularity(h, logMap, today, 30)
            const days = lastNDates(today, 28)
            return (
              <Card key={h.id} className="cursor-pointer hover:border-line-strong transition">
                <div onClick={() => setDetail(h.id)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setDetail(h.id)}>
                  <div className="flex items-start gap-3">
                    <CategoryIcon icon={cat?.icon ?? 'sparkles'} color={cat?.color ?? '#94a3b8'} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{h.name}</p>
                      <p className="text-xs text-muted">{cat?.name ?? 'Без категории'} · {frequencyLabel(h.frequency)}</p>
                    </div>
                    <IconButton label="Редактировать" onClick={(e) => { e.stopPropagation(); setForm(h) }}><Pencil size={15} /></IconButton>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <div className="flex justify-between text-xs mb-1.5"><span className="text-muted">7 дней</span><span className="tabular font-semibold">{r7.done}/{r7.expected}</span></div>
                      <Bar value={r7.ratio} />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1.5"><span className="text-muted">30 дней</span><span className="tabular font-semibold">{r30.done}/{r30.expected}</span></div>
                      <Bar value={r30.ratio} />
                    </div>
                  </div>
                  <div className="grid grid-cols-[repeat(28,minmax(0,1fr))] gap-[3px] mt-4" aria-label="Последние 28 дней">
                    {days.map((d) => {
                      const l = logMap.get(`${h.id}|${d}`)
                      const due = isDueOn(h, d, logMap)
                      return <span key={d} title={`${formatDateShort(d)}${l ? ' · ' + (l.level === 'skip' ? 'пропуск' : LEVELS[l.level].label) : ''}`}
                        className={cx('aspect-square rounded-[3px]', !l && (due ? 'bg-white/[0.06]' : 'bg-white/[0.025]'), d === today && 'ring-1 ring-accent/60')}
                        style={l ? { background: LEVEL_COLOR[l.level] } : undefined} />
                    })}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <Empty icon={<CheckCircle2 size={20} />} title={showArchived ? 'Архив пуст' : 'Привычек пока нет'}
            text={showArchived ? undefined : 'Начни с 2–3 привычек. Лучше маленькая, но регулярная.'}
            action={!showArchived && <Button variant="primary" size="sm" onClick={() => setForm('new')}><Plus size={16} />Создать</Button>} />
        </Card>
      )}

      <div className="flex items-center gap-3 text-[11px] text-faint mt-4 flex-wrap">
        {(['min', 'normal', 'extra', 'skip'] as const).map((l) => (
          <span key={l} className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-[3px]" style={{ background: LEVEL_COLOR[l] }} />{l === 'skip' ? 'Пропуск' : LEVELS[l].label}</span>
        ))}
      </div>

      <HabitForm open={form !== null} habit={form === 'new' ? undefined : form ?? undefined} categories={habitCats} onClose={() => setForm(null)} />
      {detailHabit && <HabitDetail habit={detailHabit} category={catMap.get(detailHabit.categoryId)} logs={logs.filter((l) => l.habitId === detailHabit.id)} today={today} onClose={() => setDetail(null)} onEdit={() => { setDetail(null); setForm(detailHabit) }} />}
    </div>
  )
}

function HabitDetail({ habit, category, logs, today, onClose, onEdit }: {
  habit: Habit; category?: Category; logs: HabitLog[]; today: string; onClose: () => void; onEdit: () => void
}) {
  const [date, setDate] = useState(today)
  const logMap = useMemo(() => logsByHabitDate(logs), [logs])
  const counts = { min: 0, normal: 0, extra: 0, skip: 0 }
  for (const l of logMap.values()) counts[l.level]++
  const history = [...logMap.values()].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30)
  const week = lastNDates(today, 7)

  const toggleArchive = async () => {
    await update<Habit>('habits', habit.id, { archived: !habit.archived })
    toast(habit.archived ? 'Привычка возвращена' : 'Привычка в архиве (история сохранена)')
    onClose()
  }
  const del = async () => {
    if (!confirmAction(`Удалить привычку «${habit.name}»? История отметок тоже скроется. Лучше отправить в архив.`)) return
    await remove('habits', habit.id)
    toast('Привычка удалена')
    onClose()
  }

  return (
    <Sheet open onClose={onClose} title={habit.name}>
      {habit.description && <p className="text-sm text-muted -mt-2 mb-4">{habit.description}</p>}
      <div className="grid grid-cols-3 gap-2 mb-4 text-center">
        {(['min', 'normal', 'extra'] as const).map((l) => (
          <div key={l} className="rounded-xl bg-surface-2 border border-line p-2.5">
            <p className="text-[10px] font-bold text-faint tracking-wider">{LEVELS[l].short}</p>
            <p className="text-xl font-bold tabular">{counts[l]}</p>
            <p className="text-[11px] text-muted truncate">{l === 'min' ? habit.minGoal : l === 'normal' ? habit.normalGoal : habit.extraGoal || '—'}</p>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted mb-2">Отметить день (можно задним числом)</p>
      <div className="flex gap-1.5 mb-3">
        {week.map((d) => (
          <button key={d} onClick={() => setDate(d)} className={cx('flex-1 rounded-xl border py-1.5 text-center transition', date === d ? 'border-accent/60 bg-accent/10' : 'border-line')}>
            <p className="text-[10px] text-faint">{WEEKDAYS_SHORT[weekdayOf(d)]}</p>
            <p className="text-sm font-semibold tabular">{Number(d.slice(8))}</p>
            <span className="block mx-auto mt-1 size-1.5 rounded-full" style={{ background: logMap.get(`${habit.id}|${d}`) ? LEVEL_COLOR[logMap.get(`${habit.id}|${d}`)!.level] : 'transparent' }} />
          </button>
        ))}
      </div>
      <HabitCheck habit={habit} category={category} log={logMap.get(`${habit.id}|${date}`)} date={date} />

      <p className="text-xs text-muted mt-5 mb-2">История</p>
      {history.length ? (
        <ul className="divide-y divide-line text-sm">
          {history.map((l) => (
            <li key={l.id} className="flex justify-between py-2">
              <span className="text-muted">{formatDateShort(l.date)}{l.date === addDays(today, -1) ? ' (вчера)' : l.date === today ? ' (сегодня)' : ''}</span>
              <span className={l.level === 'skip' ? 'text-faint' : 'font-medium'}>{l.level === 'skip' ? `Пропуск · ${SKIP_REASONS[l.skipReason ?? 'other']}` : LEVELS[l.level].label}</span>
            </li>
          ))}
        </ul>
      ) : <p className="text-sm text-faint">Отметок пока нет.</p>}

      <div className="flex gap-2 mt-5">
        <Button variant="danger" onClick={del} aria-label="Удалить"><Trash2 size={16} /></Button>
        <Button className="flex-1" onClick={toggleArchive}>{habit.archived ? <><ArchiveRestore size={16} />Вернуть</> : <><Archive size={16} />В архив</>}</Button>
        <Button variant="primary" className="flex-1" onClick={onEdit}><Pencil size={16} />Изменить</Button>
      </div>
    </Sheet>
  )
}
