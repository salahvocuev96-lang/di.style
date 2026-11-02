import { useEffect, type ReactNode, type ButtonHTMLAttributes } from 'react'
import { X } from 'lucide-react'

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(' ')
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'soft' | 'danger'; size?: 'sm' | 'md' }

export function Button({ variant = 'soft', size = 'md', className, ...p }: BtnProps) {
  return (
    <button
      {...p}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none select-none',
        size === 'sm' ? 'h-9 px-3 text-sm' : 'h-11 px-4 text-[15px]',
        variant === 'primary' && 'bg-gradient-accent text-black hover:brightness-110',
        variant === 'soft' && 'bg-surface-2 border border-line text-ink hover:border-line-strong',
        variant === 'ghost' && 'text-muted hover:text-ink hover:bg-white/5',
        variant === 'danger' && 'bg-bad/10 text-bad border border-bad/20 hover:bg-bad/15',
        className,
      )}
    />
  )
}

export function IconButton({ className, label, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      aria-label={label}
      title={label}
      {...p}
      className={cx('inline-grid place-items-center size-9 rounded-xl text-muted hover:text-ink hover:bg-white/5 transition active:scale-95', className)}
    />
  )
}

export function Card({ children, className, title, action }: { children: ReactNode; className?: string; title?: ReactNode; action?: ReactNode }) {
  return (
    <section className={cx('card p-4 sm:p-5 min-w-0 animate-fade-up', className)}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 mb-3">
          {title && <h2 className="text-[15px] font-semibold text-ink">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <header className="flex items-end justify-between gap-3 mb-5 sm:mb-6">
      <div className="min-w-0">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="text-muted mt-1 text-sm">{subtitle}</p>}
      </div>
      {action}
    </header>
  )
}

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg max-h-[92dvh] overflow-y-auto bg-surface border border-line rounded-t-3xl sm:rounded-3xl p-5 pb-8 sm:pb-5 animate-sheet safe-bottom">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">{title}</h3>
          <IconButton label="Закрыть" onClick={onClose}><X size={18} /></IconButton>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block mb-3.5">
      <span className="block text-xs font-medium text-muted mb-1.5">{label}</span>
      {children}
      {hint && <span className="block text-xs text-faint mt-1">{hint}</span>}
    </label>
  )
}

export function Segmented<T extends string | number>({ value, onChange, options, className }: {
  value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode }[]; className?: string
}) {
  return (
    <div className={cx('flex flex-wrap gap-1 p-1 rounded-xl bg-surface-2 border border-line', className)}>
      {options.map((o) => (
        <button
          type="button"
          key={String(o.value)}
          onClick={() => onChange(o.value)}
          className={cx(
            'flex-1 min-w-fit px-3 h-9 rounded-lg text-sm font-medium transition',
            value === o.value ? 'bg-white/10 text-ink' : 'text-muted hover:text-ink',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/** Оценка 1–5 */
export function Rating({ value, onChange, labels }: { value: number; onChange: (v: number) => void; labels?: [string, string] }) {
  return (
    <div>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            type="button"
            key={n}
            onClick={() => onChange(n)}
            aria-label={`Оценка ${n}`}
            className={cx(
              'flex-1 h-10 rounded-xl border text-sm font-semibold transition active:scale-95',
              n <= value ? 'bg-gradient-accent text-black border-transparent' : 'bg-surface-2 border-line text-muted hover:text-ink',
            )}
          >
            {n}
          </button>
        ))}
      </div>
      {labels && (
        <div className="flex justify-between text-[11px] text-faint mt-1">
          <span>{labels[0]}</span>
          <span>{labels[1]}</span>
        </div>
      )}
    </div>
  )
}

export function Empty({ icon, title, text, action }: { icon: ReactNode; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center text-center py-8 px-4">
      <div className="size-12 rounded-2xl bg-surface-2 border border-line grid place-items-center text-muted mb-3">{icon}</div>
      <p className="font-semibold">{title}</p>
      {text && <p className="text-sm text-muted mt-1 max-w-xs">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function Ring({ value, size = 64, stroke = 7, children }: { value: number; size?: number; stroke?: number; children?: ReactNode }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const v = Math.max(0, Math.min(1, value))
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="ring-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--color-accent)" />
            <stop offset="1" stopColor="var(--color-accent-2)" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(255 255 255 / 0.07)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke="url(#ring-g)" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - v)} style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  )
}

export function Bar({ value, color }: { value: number; color?: string }) {
  return (
    <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
      <div
        className={cx('h-full rounded-full transition-[width] duration-500', !color && 'bg-gradient-accent')}
        style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%`, background: color }}
      />
    </div>
  )
}

export function Pill({ children, color, className }: { children: ReactNode; color?: string; className?: string }) {
  return (
    <span
      className={cx('inline-flex items-center gap-1 px-2 h-6 rounded-full text-xs font-medium border border-line text-muted', className)}
      style={color ? { color, borderColor: color + '40', background: color + '14' } : undefined}
    >
      {children}
    </span>
  )
}

/** Простые недельные столбики (без тяжёлых библиотек) */
export function Bars({ data, height = 96 }: { data: { label: string; value: number; highlight?: boolean; title?: string }[]; height?: number }) {
  return (
    <div className="flex gap-1.5 sm:gap-2" style={{ height: height + 22 }}>
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1.5 min-w-0" title={d.title}>
          <div className="w-full flex-1 flex items-end">
            <div
              className={cx('w-full rounded-lg transition-[height] duration-500', d.value > 0 ? 'bg-gradient-accent' : 'bg-white/[0.06]', !d.highlight && d.value > 0 && 'opacity-70')}
              style={{ height: Math.max(4, d.value * height) }}
            />
          </div>
          <span className={cx('text-[10px] sm:text-[11px] truncate max-w-full', d.highlight ? 'text-ink font-semibold' : 'text-faint')}>{d.label}</span>
        </div>
      ))}
    </div>
  )
}

export function confirmAction(text: string) {
  return window.confirm(text)
}
