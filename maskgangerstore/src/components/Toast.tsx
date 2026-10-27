import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, AlertTriangle, X } from 'lucide-react'
import { SmartImage } from './SmartImage'
import type { Category } from '../types/product'

type ToastKind = 'success' | 'error'
interface Toast {
  id: number
  kind: ToastKind
  title: string
  text?: string
  image?: string
  art?: Category
}

const ToastContext = createContext<((t: Omit<Toast, 'id'>) => void) | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(1)

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), [])

  const push = useCallback(
    (t: Omit<Toast, 'id'>) => {
      const id = nextId.current++
      setToasts((prev) => [...prev.slice(-2), { ...t, id }])
      window.setTimeout(() => dismiss(id), 3800)
    },
    [dismiss],
  )

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-[72px] z-[80] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:top-auto sm:right-6 sm:bottom-6 sm:items-end"
      >
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: -30, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, transition: { duration: 0.2 } }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              role={t.kind === 'error' ? 'alert' : 'status'}
              className="pointer-events-auto relative flex w-full max-w-sm items-center gap-3 overflow-hidden bg-ink p-3 pr-10 text-white shadow-[0_20px_50px_-12px_rgba(0,0,0,0.45)]"
            >
              {/* полоса таймера */}
              <motion.span
                className={`absolute bottom-0 left-0 h-[3px] w-full origin-left ${t.kind === 'error' ? 'bg-accent' : 'bg-white/70'}`}
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: 3.8, ease: 'linear' }}
              />
              {t.image ? (
                <span className="relative size-14 shrink-0 overflow-hidden bg-paper-2">
                  <SmartImage src={t.image} alt="" art={t.art} className="h-full w-full object-cover" />
                  <span className="absolute right-0 bottom-0 grid size-5 place-items-center bg-accent">
                    <Check size={12} strokeWidth={3} />
                  </span>
                </span>
              ) : (
                <span className={`grid size-10 shrink-0 place-items-center ${t.kind === 'error' ? 'bg-accent' : 'bg-white text-ink'}`}>
                  {t.kind === 'error' ? <AlertTriangle size={18} /> : <Check size={18} strokeWidth={2.5} />}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-display text-[13px] font-bold tracking-wide uppercase">{t.title}</p>
                {t.text && <p className="mt-0.5 text-sm leading-snug text-white/80">{t.text}</p>}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="absolute top-2 right-2 grid size-8 place-items-center text-white/60 transition-colors hover:text-white"
                aria-label="Закрыть уведомление"
              >
                <X size={16} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
