import { useState, useEffect } from 'react'
import { SkipForward, Undo2 } from 'lucide-react'
import { db } from '../data/db'
import { create, remove, update } from '../data/repo'
import type { Category, Frequency, Habit, HabitLevel, HabitLog, ISODate, SkipReason } from '../data/types'
import { LEVELS, SKIP_REASONS } from '../lib/labels'
import { WEEKDAYS_SHORT } from '../lib/date'
import type { Regularity } from '../lib/logic'
import { CategoryIcon } from './CategoryIcon'
import { Button, Field, Segmented, Sheet, cx } from './ui'
import { toast } from './Layout'

export async function setHabitLog(habitId: string, date: ISODate, level: HabitLevel, skipReason: SkipReason | null = null) {
  const existing = (await db.habitLogs.where('[habitId+date]').equals([habitId, date]).toArray()).filter((l) => !l.deletedAt)
  const [first, ...dups] = existing
  for (const d of dups) await remove('habitLogs', d.id)
  if (first) {
    if (first.level === level && first.skipReason === skipReason) {
      await remove('habitLogs', first.id) // повторное нажатие — отмена
      return
    }
    await update<HabitLog>('habitLogs', first.id, { level, skipReason })
  } else {
    await create<HabitLog>('habitLogs', { habitId, date, level, skipReason, note: '' })
  }
}

const RANK: Record<HabitLevel, number> = { skip: 0, min: 1, normal: 2, extra: 3 }

/** Автоотметка из других разделов: не снимает отметку и не понижает уже поставленный уровень. */
export async function autoMarkHabit(habitId: string, date: ISODate, level: Exclude<HabitLevel, 'skip'>) {
  const existing = (await db.habitLogs.where('[habitId+date]').equals([habitId, date]).toArray()).filter((l) => !l.deletedAt)[0]
  if (existing && RANK[existing.level] >= RANK[level]) return
  if (existing) await update<HabitLog>('habitLogs', existing.id, { level, skipReason: null })
  else await create<HabitLog>('habitLogs', { habitId, date, level, skipReason: null, note: '' })
}

/** Первая активная привычка категории — для связи разделов с трекером. */
export function linkedHabit(habits: Habit[] | undefined, categoryId: string) {
  return habits?.filter((h) => !h.archived && h.categoryId === categoryId).sort((a, b) => a.order - b.order)[0]
}

export function LinkHabitToggle({ habit, checked, onChange }: { habit?: Habit; checked: boolean; onChange: (v: boolean) => void }) {
  if (!habit) return null
  return (
    <label className="flex items-center gap-2.5 text-sm text-muted mb-4 cursor-pointer select-none">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-4 accent-[#a78bfa]" />
      Отметить привычку «{habit.name}»
    </label>
  )
}

export function frequencyLabel(f: Frequency) {
  if (f.type === 'daily') return 'Каждый день'
  if (f.type === 'days') return f.days.length ? f.days.slice().sort().map((d) => WEEKDAYS_SHORT[d]).join(', ') : 'Дни не выбраны'
  return `${f.times} раз(а) в неделю`
}

export function HabitCheck({ habit, category, log, date, reg, light }: {
  habit: Habit; category?: Category; log?: HabitLog; date: ISODate; reg?: Regularity; light?: boolean
}) {
  const [skipOpen, setSkipOpen] = useState(false)
  const level = log?.level
  const goal = light ? habit.minGoal : level === 'extra' ? habit.extraGoal : level === 'min' ? habit.minGoal : habit.normalGoal

  return (
    <div className={cx('rounded-2xl border p-3 sm:p-3.5 transition', level && level !== 'skip' ? 'border-accent/30 bg-accent/[0.04]' : 'border-line bg-surface-2/40')}>
      <div className="flex items-center gap-3">
        <CategoryIcon icon={category?.icon ?? 'sparkles'} color={category?.color ?? '#94a3b8'} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className={cx('font-semibold truncate', level === 'skip' && 'text-muted line-through decoration-faint')}>{habit.name}</p>
            {reg && reg.expected > 0 && <span className="text-xs text-faint tabular shrink-0">{reg.done}/{reg.expected}</span>}
          </div>
          <p className="text-xs text-muted truncate">
            {level === 'skip'
              ? `Пропуск: ${SKIP_REASONS[log!.skipReason ?? 'other']}`
              : goal
                ? <>{light && !level && <span className="text-accent-2">Минимум: </span>}{goal}</>
                : frequencyLabel(habit.frequency)}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-1.5 mt-3">
        {(['min', 'normal', 'extra'] as const).map((l) => (
          <button
            key={l}
            onClick={() => setHabitLog(habit.id, date, l)}
            title={l === 'min' ? habit.minGoal : l === 'normal' ? habit.normalGoal : habit.extraGoal}
            className={cx(
              'h-9 rounded-xl text-xs font-bold tracking-wide transition active:scale-95 border',
              level === l ? 'bg-gradient-accent text-black border-transparent' : 'border-line text-muted hover:text-ink hover:border-line-strong',
              light && l === 'min' && level !== l && 'border-accent-2/40 text-accent-2',
            )}
          >
            {LEVELS[l].short}
          </button>
        ))}
        <button
          onClick={() => (level === 'skip' ? setHabitLog(habit.id, date, 'skip', log!.skipReason) : setSkipOpen(true))}
          className={cx('h-9 rounded-xl text-xs font-semibold border transition active:scale-95 inline-flex items-center justify-center gap-1',
            level === 'skip' ? 'bg-white/10 border-line-strong text-ink' : 'border-line text-faint hover:text-ink')}
          aria-label={level === 'skip' ? 'Отменить пропуск' : 'Пропустить'}
        >
          {level === 'skip' ? <><Undo2 size={13} />Вернуть</> : <><SkipForward size={13} />Пропуск</>}
        </button>
      </div>
      <Sheet open={skipOpen} onClose={() => setSkipOpen(false)} title={`Пропустить «${habit.name}»`}>
        <p className="text-sm text-muted mb-4">Пропуск — это не провал. «Отдых» и «Болезнь» не влияют на регулярность.</p>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(SKIP_REASONS) as SkipReason[]).map((r) => (
            <Button key={r} onClick={async () => { await setHabitLog(habit.id, date, 'skip', r); setSkipOpen(false) }}>
              {SKIP_REASONS[r]}
            </Button>
          ))}
        </div>
      </Sheet>
    </div>
  )
}

const emptyHabit = (categoryId: string): Omit<Habit, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'syncedAt'> => ({
  name: '', categoryId, description: '', frequency: { type: 'daily' }, minGoal: '', normalGoal: '', extraGoal: '', archived: false, order: Date.now(),
})

export function HabitForm({ open, onClose, habit, categories }: { open: boolean; onClose: () => void; habit?: Habit; categories: Category[] }) {
  const [f, setF] = useState(() => emptyHabit(categories[0]?.id ?? ''))
  useEffect(() => {
    if (open) setF(habit ? { ...habit } : emptyHabit(categories[0]?.id ?? ''))
  }, [open, habit, categories])
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }))
  const freq = f.frequency

  const save = async () => {
    const data = { ...f, name: f.name.trim() }
    if (habit) await update<Habit>('habits', habit.id, data)
    else await create<Habit>('habits', data)
    toast(habit ? 'Привычка сохранена' : 'Привычка создана')
    onClose()
  }

  return (
    <Sheet open={open} onClose={onClose} title={habit ? 'Редактировать привычку' : 'Новая привычка'}>
      <Field label="Название">
        <input className="input" value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="Например: Чтение" autoFocus={!habit} />
      </Field>
      <Field label="Категория">
        <select className="input" value={f.categoryId} onChange={(e) => set('categoryId', e.target.value)}>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </Field>
      <Field label="Описание">
        <textarea className="input min-h-16" value={f.description} onChange={(e) => set('description', e.target.value)} placeholder="Зачем эта привычка" />
      </Field>
      <Field label="Периодичность">
        <Segmented
          value={freq.type}
          onChange={(t) => set('frequency', t === 'daily' ? { type: 'daily' } : t === 'days' ? { type: 'days', days: [0, 2, 4] } : { type: 'weekly', times: 3 })}
          options={[{ value: 'daily', label: 'Каждый день' }, { value: 'days', label: 'По дням' }, { value: 'weekly', label: 'N раз/нед' }]}
        />
      </Field>
      {freq.type === 'days' && (
        <div className="flex gap-1.5 -mt-1 mb-3.5">
          {WEEKDAYS_SHORT.map((d, i) => (
            <button
              key={d}
              type="button"
              onClick={() => set('frequency', { type: 'days', days: freq.days.includes(i) ? freq.days.filter((x) => x !== i) : [...freq.days, i] })}
              className={cx('flex-1 h-9 rounded-lg text-xs font-semibold border', freq.days.includes(i) ? 'bg-white/10 border-line-strong text-ink' : 'border-line text-faint')}
            >
              {d}
            </button>
          ))}
        </div>
      )}
      {freq.type === 'weekly' && (
        <Field label="Сколько раз в неделю">
          <input type="number" min={1} max={7} className="input" value={freq.times}
            onChange={(e) => set('frequency', { type: 'weekly', times: Math.max(1, Math.min(7, Number(e.target.value) || 1)) })} />
        </Field>
      )}
      <div className="grid sm:grid-cols-3 gap-x-2">
        <Field label="MINIMUM"><input className="input" value={f.minGoal} onChange={(e) => set('minGoal', e.target.value)} placeholder="10 минут" /></Field>
        <Field label="NORMAL"><input className="input" value={f.normalGoal} onChange={(e) => set('normalGoal', e.target.value)} placeholder="30 минут" /></Field>
        <Field label="EXTRA"><input className="input" value={f.extraGoal} onChange={(e) => set('extraGoal', e.target.value)} placeholder="1 час" /></Field>
      </div>
      <div className="flex gap-2 mt-2">
        <Button variant="ghost" className="flex-1" onClick={onClose}>Отмена</Button>
        <Button variant="primary" className="flex-1" disabled={!f.name.trim() || !f.categoryId || (freq.type === 'days' && !freq.days.length)} onClick={save}>
          Сохранить
        </Button>
      </div>
    </Sheet>
  )
}
