import { useEffect, useState, type ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  CalendarDays, CheckCircle2, FolderKanban, Dumbbell, Languages, Moon, Settings, Sun, MoreHorizontal,
} from 'lucide-react'
import { cx, Sheet } from './ui'

export const NAV = [
  { to: '/', label: 'Сегодня', icon: Sun },
  { to: '/schedule', label: 'Расписание', icon: CalendarDays },
  { to: '/habits', label: 'Привычки', icon: CheckCircle2 },
  { to: '/projects', label: 'Проекты', icon: FolderKanban },
  { to: '/sport', label: 'Спорт', icon: Dumbbell },
  { to: '/english', label: 'Английский', icon: Languages },
  { to: '/sleep', label: 'Сон', icon: Moon },
  { to: '/settings', label: 'Настройки', icon: Settings },
]

const MOBILE_MAIN = NAV.slice(0, 4)
const MOBILE_MORE = NAV.slice(4)

export function Layout({ children }: { children: ReactNode }) {
  const [more, setMore] = useState(false)
  const loc = useLocation()
  useEffect(() => {
    setMore(false)
    window.scrollTo(0, 0)
  }, [loc.pathname])
  const moreActive = MOBILE_MORE.some((n) => n.to === loc.pathname)

  return (
    <div className="min-h-dvh lg:flex">
      {/* Боковое меню (компьютер) */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 h-dvh sticky top-0 border-r border-line px-3 py-6">
        <div className="flex items-center gap-2.5 px-3 mb-8">
          <img src="./icon.svg" alt="" className="size-8" />
          <span className="font-bold tracking-tight text-[17px]">Life OS</span>
        </div>
        <nav className="flex flex-col gap-0.5">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === '/'}
              className={({ isActive }) => cx(
                'flex items-center gap-3 h-10 px-3 rounded-xl text-[14px] font-medium transition',
                isActive ? 'bg-white/[0.07] text-ink' : 'text-muted hover:text-ink hover:bg-white/[0.04]',
              )}
            >
              <n.icon size={18} />
              {n.label}
            </NavLink>
          ))}
        </nav>
        <p className="mt-auto px-3 text-xs text-faint">Данные хранятся на этом устройстве. Делай резервные копии в настройках.</p>
      </aside>

      <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-10 pt-6 sm:pt-8 pb-28 lg:pb-12 safe-top">
        <div className="max-w-5xl mx-auto">{children}</div>
      </main>

      {/* Нижняя панель (телефон) */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-bg/85 backdrop-blur-xl border-t border-line safe-bottom">
        <div className="grid grid-cols-5 h-16">
          {MOBILE_MAIN.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === '/'}
              className={({ isActive }) => cx('flex flex-col items-center justify-center gap-1 text-[10.5px] font-medium transition', isActive ? 'text-ink' : 'text-faint')}
            >
              {({ isActive }) => (
                <>
                  <n.icon size={21} className={isActive ? 'text-accent' : ''} />
                  {n.label}
                </>
              )}
            </NavLink>
          ))}
          <button onClick={() => setMore(true)} className={cx('flex flex-col items-center justify-center gap-1 text-[10.5px] font-medium', moreActive ? 'text-ink' : 'text-faint')}>
            <MoreHorizontal size={21} className={moreActive ? 'text-accent' : ''} />
            Ещё
          </button>
        </div>
      </nav>
      <Sheet open={more} onClose={() => setMore(false)} title="Разделы">
        <div className="grid grid-cols-2 gap-2">
          {MOBILE_MORE.map((n) => (
            <NavLink key={n.to} to={n.to} className="card flex items-center gap-3 p-4 hover:border-line-strong">
              <n.icon size={20} className="text-accent" />
              <span className="font-medium">{n.label}</span>
            </NavLink>
          ))}
        </div>
      </Sheet>
      <Toaster />
    </div>
  )
}

// ---------- Уведомления ----------
export function toast(text: string) {
  window.dispatchEvent(new CustomEvent('lifeos:toast', { detail: text }))
}

function Toaster() {
  const [items, setItems] = useState<{ id: number; text: string }[]>([])
  useEffect(() => {
    const on = (e: Event) => {
      const id = Date.now() + Math.random()
      setItems((x) => [...x, { id, text: (e as CustomEvent<string>).detail }])
      setTimeout(() => setItems((x) => x.filter((i) => i.id !== id)), 2600)
    }
    window.addEventListener('lifeos:toast', on)
    return () => window.removeEventListener('lifeos:toast', on)
  }, [])
  return (
    <div className="fixed z-[60] bottom-20 lg:bottom-6 inset-x-0 flex flex-col items-center gap-2 pointer-events-none px-4">
      {items.map((i) => (
        <div key={i.id} className="animate-sheet bg-surface-2 border border-line-strong rounded-xl px-4 py-2.5 text-sm shadow-2xl">{i.text}</div>
      ))}
    </div>
  )
}
