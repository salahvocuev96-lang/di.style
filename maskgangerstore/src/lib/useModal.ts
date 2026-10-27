import { useEffect, useRef } from 'react'

let lockCount = 0

/** Блокировка прокрутки страницы со счётчиком — несколько окон не мешают друг другу */
export function lockScroll() {
  lockCount++
  document.body.style.overflow = 'hidden'
  return () => {
    lockCount = Math.max(0, lockCount - 1)
    if (lockCount === 0) document.body.style.overflow = ''
  }
}

/** Общая логика модальных окон: Esc, блокировка прокрутки, фокус внутри и возврат фокуса */
export function useModal<T extends HTMLElement>(open: boolean, onClose: () => void) {
  const ref = useRef<T>(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    if (!open) return
    const prevFocus = document.activeElement as HTMLElement | null
    const unlock = lockScroll()

    const focusFirst = window.setTimeout(() => {
      const el = ref.current?.querySelector<HTMLElement>('[data-autofocus]') ?? ref.current
      el?.focus({ preventScroll: true })
    }, 30)

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        closeRef.current()
        return
      }
      if (e.key !== 'Tab' || !ref.current) return
      const items = ref.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), textarea, select, [tabindex]:not([tabindex="-1"])',
      )
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)

    return () => {
      window.clearTimeout(focusFirst)
      document.removeEventListener('keydown', onKey)
      unlock()
      prevFocus?.focus?.({ preventScroll: true })
    }
  }, [open])

  return ref
}
