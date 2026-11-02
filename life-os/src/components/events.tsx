import type { DayEvent } from '../lib/logic'
import { eventEndMin } from '../lib/logic'
import { BLOCK_TYPES } from '../lib/labels'
import { fromMin } from '../lib/date'
import { cx } from './ui'
import type { ReactNode } from 'react'

export function timeLabel(e: Pick<DayEvent, 'type' | 'start' | 'end'>) {
  if (!e.start) return 'Гибко'
  if (e.type === 'wake') return `≈ ${e.start}`
  if (e.end) return `${e.start}–${e.end}`
  return `${e.start}–≈${fromMin(eventEndMin(e)!)}`
}

export function EventRow({ e, active, right }: { e: DayEvent; active?: boolean; right?: ReactNode }) {
  const color = BLOCK_TYPES[e.type].color
  return (
    <div className={cx('flex items-center gap-3 py-2.5', e.cancelled && 'opacity-45')}>
      <span className="w-1 self-stretch rounded-full" style={{ background: color }} />
      <div className="w-[92px] shrink-0 text-xs text-muted tabular">{timeLabel(e)}</div>
      <div className="min-w-0 flex-1">
        <p className={cx('text-sm font-medium truncate', e.cancelled && 'line-through')}>{e.title}</p>
        {active && <p className="text-[11px] text-accent-2 font-medium">Сейчас</p>}
      </div>
      {right}
    </div>
  )
}
