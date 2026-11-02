import { useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, Trash2, CalendarPlus } from 'lucide-react'
import { useRows, create, update, remove } from '../data/repo'
import type { BlockType, HM, ScheduleBlock, ScheduleOverride } from '../data/types'
import { useNow } from '../lib/hooks'
import { WEEKDAYS, WEEKDAYS_SHORT, weekdayOf, formatDateLong, toMin } from '../lib/date'
import { BLOCK_TYPES } from '../lib/labels'
import { eventsForDate, freeWindows } from '../lib/logic'
import { Button, Card, Empty, Field, IconButton, PageHeader, Segmented, Sheet, cx, confirmAction } from '../components/ui'
import { timeLabel } from '../components/events'
import { toast } from '../components/Layout'

const sortBlocks = (a: ScheduleBlock, b: ScheduleBlock) => (a.start ?? '99').localeCompare(b.start ?? '99')

export default function Schedule() {
  const { date: today } = useNow()
  const blocks = useRows<ScheduleBlock>('scheduleBlocks')
  const overrides = useRows<ScheduleOverride>('scheduleOverrides')
  const [day, setDay] = useState(() => weekdayOf(today))
  const [edit, setEdit] = useState<ScheduleBlock | 'new' | null>(null)
  const [oneOff, setOneOff] = useState(false)

  const byDay = useMemo(() => {
    const m: ScheduleBlock[][] = Array.from({ length: 7 }, () => [])
    for (const b of blocks ?? []) m[b.weekday]?.push(b)
    m.forEach((l) => l.sort(sortBlocks))
    return m
  }, [blocks])

  const upcoming = (overrides ?? []).filter((o) => o.date >= today).sort((a, b) => a.date.localeCompare(b.date) || (a.start ?? '').localeCompare(b.start ?? ''))
  if (!blocks) return null

  const dayList = byDay[day]
  // Свободное время для выбранного дня недели (по постоянному расписанию)
  const free = freeWindows(eventsForDate(dateForWeekday(today, day), blocks, []), { minLen: 60 })

  return (
    <div>
      <PageHeader
        title="Расписание"
        subtitle="Постоянная неделя. Время у привычек не обязательно — только то, что действительно фиксировано."
        action={<Button variant="primary" size="sm" onClick={() => setEdit('new')}><Plus size={16} /><span className="hidden sm:inline">Добавить</span></Button>}
      />

      {/* Неделя целиком — компьютер */}
      <div className="hidden md:grid grid-cols-7 gap-2 mb-5">
        {byDay.map((list, i) => (
          <button key={i} onClick={() => setDay(i)} className={cx('card p-3 text-left min-h-40 transition hover:border-line-strong', day === i && 'border-accent/50')}>
            <p className={cx('text-xs font-semibold mb-2', weekdayOf(today) === i ? 'text-accent' : 'text-muted')}>{WEEKDAYS_SHORT[i]}</p>
            <div className="space-y-1.5">
              {list.map((b) => (
                <div key={b.id} className="rounded-lg px-2 py-1.5 text-[11px] leading-tight" style={{ background: BLOCK_TYPES[b.type].color + '18' }}>
                  <p className="font-semibold truncate" style={{ color: BLOCK_TYPES[b.type].color }}>{b.title}</p>
                  <p className="text-faint tabular">{b.start ?? 'гибко'}</p>
                </div>
              ))}
            </div>
          </button>
        ))}
      </div>

      {/* Выбор дня — телефон */}
      <div className="md:hidden flex gap-1.5 mb-4 overflow-x-auto -mx-4 px-4 pb-1">
        {WEEKDAYS_SHORT.map((d, i) => (
          <button key={d} onClick={() => setDay(i)} className={cx('shrink-0 w-12 h-12 rounded-2xl border text-sm font-semibold transition',
            day === i ? 'bg-gradient-accent text-black border-transparent' : 'border-line text-muted', weekdayOf(today) === i && day !== i && 'text-accent')}>
            {d}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-4 sm:gap-5">
        <Card className="lg:col-span-3" title={WEEKDAYS[day]} action={<Button size="sm" variant="ghost" onClick={() => setEdit('new')}><Plus size={15} />Блок</Button>}>
          {dayList.length ? (
            <div className="divide-y divide-line -my-1">
              {dayList.map((b) => (
                <div key={b.id} className="flex items-center gap-3 py-2.5">
                  <span className="w-1 self-stretch rounded-full" style={{ background: BLOCK_TYPES[b.type].color }} />
                  <div className="w-[92px] shrink-0 text-xs text-muted tabular">{timeLabel(b)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{b.title}</p>
                    <p className="text-[11px] text-faint">{BLOCK_TYPES[b.type].label}{b.note ? ` · ${b.note}` : ''}</p>
                  </div>
                  <IconButton label="Редактировать" onClick={() => setEdit(b)}><Pencil size={15} /></IconButton>
                </div>
              ))}
            </div>
          ) : <Empty icon={<CalendarPlus size={20} />} title="День свободен" text="Добавь занятие, если оно повторяется каждую неделю." />}
          {free.length > 0 && (
            <div className="mt-3 pt-3 border-t border-line">
              <p className="text-xs text-muted mb-2">Свободное время (окна от 1 часа)</p>
              <div className="flex flex-wrap gap-1.5">
                {free.map((w) => <span key={w.start} className="text-xs tabular px-2 py-1 rounded-lg bg-surface-2 border border-line">{w.start}–{w.end}</span>)}
              </div>
            </div>
          )}
        </Card>

        <Card className="lg:col-span-2" title="Разовые изменения" action={<Button size="sm" variant="ghost" onClick={() => setOneOff(true)}><Plus size={15} />Событие</Button>}>
          <p className="text-xs text-muted -mt-1 mb-3">Отмена занятия на конкретный день делается на экране «Сегодня». Здесь — разовые события на любую дату.</p>
          {upcoming.length ? (
            <ul className="divide-y divide-line">
              {upcoming.map((o) => (
                <li key={o.id} className="flex items-center gap-2 py-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate"><span className={o.action === 'cancel' ? 'line-through text-muted' : ''}>{o.title}</span> {o.action === 'cancel' && <span className="text-xs text-bad">отменено</span>}</p>
                    <p className="text-[11px] text-faint capitalize">{formatDateLong(o.date)}{o.start ? ` · ${o.start}` : ''}</p>
                  </div>
                  <IconButton label="Удалить" onClick={() => remove('scheduleOverrides', o.id)}><Trash2 size={15} /></IconButton>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-faint">Нет запланированных изменений.</p>}
        </Card>
      </div>

      <BlockForm open={edit !== null} block={edit === 'new' ? undefined : edit ?? undefined} weekday={day} onClose={() => setEdit(null)} />
      <OneOffForm open={oneOff} today={today} onClose={() => setOneOff(false)} />
    </div>
  )
}

function dateForWeekday(today: string, wd: number) {
  const d = new Date(today + 'T00:00:00')
  d.setDate(d.getDate() + (wd - weekdayOf(today)))
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

interface BlockDraft { weekday: number; title: string; type: BlockType; start: HM | null; end: HM | null; note: string }

function TimeFields({ f, set }: { f: { start: HM | null; end: HM | null; type: BlockType }; set: (p: Partial<BlockDraft>) => void }) {
  const flexible = f.start === null
  const invalid = !!(f.start && f.end && toMin(f.end) <= toMin(f.start))
  return (
    <>
      <Field label="Время">
        <Segmented value={flexible ? 'flex' : 'fixed'} onChange={(v) => set(v === 'flex' ? { start: null, end: null } : { start: '10:00' })}
          options={[{ value: 'fixed', label: 'Точное время' }, { value: 'flex', label: 'Гибко (без времени)' }]} />
      </Field>
      {!flexible && (
        <div className="grid grid-cols-2 gap-2">
          <Field label="Начало"><input type="time" className="input" value={f.start ?? ''} onChange={(e) => set({ start: e.target.value || null })} /></Field>
          {f.type !== 'wake' && (
            <Field label="Конец (необязательно)" hint={invalid ? 'Конец раньше начала' : undefined}>
              <input type="time" className="input" value={f.end ?? ''} onChange={(e) => set({ end: e.target.value || null })} />
            </Field>
          )}
        </div>
      )}
    </>
  )
}

function BlockForm({ open, block, weekday, onClose }: { open: boolean; block?: ScheduleBlock; weekday: number; onClose: () => void }) {
  const blank = (): BlockDraft => ({ weekday, title: '', type: 'study', start: '10:00', end: null, note: '' })
  const [f, setF] = useState<BlockDraft>(blank)
  useEffect(() => {
    if (open) setF(block ? { weekday: block.weekday, title: block.title, type: block.type, start: block.start, end: block.end, note: block.note } : blank())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, block])
  const set = (p: Partial<BlockDraft>) => setF((x) => ({ ...x, ...p }))
  const invalid = !f.title.trim() || !!(f.start && f.end && toMin(f.end) <= toMin(f.start))

  const save = async () => {
    const data = { ...f, title: f.title.trim(), end: f.type === 'wake' ? null : f.end }
    if (block) await update<ScheduleBlock>('scheduleBlocks', block.id, data)
    else await create<ScheduleBlock>('scheduleBlocks', data)
    toast('Расписание сохранено')
    onClose()
  }
  const del = async () => {
    if (!block || !confirmAction(`Удалить «${block.title}» из расписания?`)) return
    await remove('scheduleBlocks', block.id)
    toast('Удалено')
    onClose()
  }

  return (
    <Sheet open={open} onClose={onClose} title={block ? 'Изменить блок' : 'Новый блок расписания'}>
      <Field label="Название"><input className="input" value={f.title} onChange={(e) => set({ title: e.target.value })} placeholder="Например: Учёба" /></Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="День недели">
          <select className="input" value={f.weekday} onChange={(e) => set({ weekday: Number(e.target.value) })}>
            {WEEKDAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
          </select>
        </Field>
        <Field label="Тип">
          <select className="input" value={f.type} onChange={(e) => set({ type: e.target.value as BlockType })}>
            {(Object.keys(BLOCK_TYPES) as BlockType[]).map((t) => <option key={t} value={t}>{BLOCK_TYPES[t].label}</option>)}
          </select>
        </Field>
      </div>
      <TimeFields f={f} set={set} />
      <Field label="Заметка"><input className="input" value={f.note} onChange={(e) => set({ note: e.target.value })} placeholder="Необязательно" /></Field>
      <div className="flex gap-2 mt-2">
        {block && <Button variant="danger" onClick={del} aria-label="Удалить"><Trash2 size={16} /></Button>}
        <Button variant="ghost" className="flex-1" onClick={onClose}>Отмена</Button>
        <Button variant="primary" className="flex-1" disabled={invalid} onClick={save}>Сохранить</Button>
      </div>
    </Sheet>
  )
}

function OneOffForm({ open, today, onClose }: { open: boolean; today: string; onClose: () => void }) {
  const [date, setDate] = useState(today)
  const [f, setF] = useState<BlockDraft>({ weekday: 0, title: '', type: 'other', start: '12:00', end: null, note: '' })
  useEffect(() => {
    if (open) { setDate(today); setF({ weekday: 0, title: '', type: 'other', start: '12:00', end: null, note: '' }) }
  }, [open, today])
  const set = (p: Partial<BlockDraft>) => setF((x) => ({ ...x, ...p }))
  const save = async () => {
    await create<ScheduleOverride>('scheduleOverrides', { date, action: 'add', blockId: null, title: f.title.trim(), type: f.type, start: f.start, end: f.type === 'wake' ? null : f.end })
    toast('Событие добавлено')
    onClose()
  }
  return (
    <Sheet open={open} onClose={onClose} title="Разовое событие">
      <Field label="Название"><input className="input" value={f.title} onChange={(e) => set({ title: e.target.value })} placeholder="Например: Встреча с клиентом" /></Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Дата"><input type="date" className="input" value={date} min={today} onChange={(e) => setDate(e.target.value)} /></Field>
        <Field label="Тип">
          <select className="input" value={f.type} onChange={(e) => set({ type: e.target.value as BlockType })}>
            {(Object.keys(BLOCK_TYPES) as BlockType[]).filter((t) => t !== 'wake').map((t) => <option key={t} value={t}>{BLOCK_TYPES[t].label}</option>)}
          </select>
        </Field>
      </div>
      <TimeFields f={f} set={set} />
      <div className="flex gap-2 mt-2">
        <Button variant="ghost" className="flex-1" onClick={onClose}>Отмена</Button>
        <Button variant="primary" className="flex-1" disabled={!f.title.trim() || !date || !!(f.start && f.end && toMin(f.end) <= toMin(f.start))} onClick={save}>Добавить</Button>
      </div>
    </Sheet>
  )
}
