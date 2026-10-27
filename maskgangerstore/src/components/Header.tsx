import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useAnimationControls } from 'framer-motion'
import { Menu, Search, ShoppingBag, X, ArrowUpRight } from 'lucide-react'
import { Logo } from './Logo'
import { useCart } from '../context/CartContext'
import { useActiveSection } from '../lib/useActiveSection'
import { scrollToId } from '../lib/scroll'
import { telegramProfileUrl } from '../config/store'
import { lockScroll } from '../lib/useModal'

const NAV = [
  { id: 'shop', label: 'Каталог' },
  { id: 'new', label: 'Новинки' },
  { id: 'about', label: 'О магазине' },
]
const SECTION_IDS = NAV.map((n) => n.id)

export function Header({ onSearch }: { onSearch: () => void }) {
  const { count, openCart } = useCart()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const active = useActiveSection(SECTION_IDS)
  const bag = useAnimationControls()
  const prevCount = useRef(count)

  // Иконка корзины «подпрыгивает», когда товаров становится больше
  useEffect(() => {
    if (count > prevCount.current) {
      bag.start({ rotate: [0, -14, 10, -6, 0], scale: [1, 1.25, 1], transition: { duration: 0.6 } })
    }
    prevCount.current = count
  }, [count, bag])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    const unlock = lockScroll()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false)
    window.addEventListener('keydown', onKey)
    return () => {
      unlock()
      window.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  const go = (id: string) => {
    setMenuOpen(false)
    requestAnimationFrame(() => scrollToId(id))
  }

  const tg = telegramProfileUrl()

  return (
    <>
      <motion.header
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow] duration-500 ${
          scrolled || menuOpen ? 'bg-paper/90 shadow-[0_1px_0_var(--color-line)] backdrop-blur-md' : 'bg-transparent'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-4 px-4 sm:h-[72px] sm:px-6 lg:px-10">
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault()
              setMenuOpen(false)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            aria-label="MASKGANGERSTORE — на главную"
            className="shrink-0"
          >
            <Logo />
          </a>

          <nav aria-label="Основное меню" className="hidden md:block">
            <ul className="flex items-center gap-2 bg-white/70 p-1 backdrop-blur">
              {NAV.map((n) => {
                const on = active === n.id
                return (
                  <li key={n.id} className="relative">
                    {on && <motion.span layoutId="nav-pill" className="absolute inset-0 bg-ink" transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
                    <a
                      href={`#${n.id}`}
                      onClick={(e) => {
                        e.preventDefault()
                        go(n.id)
                      }}
                      aria-current={on ? 'true' : undefined}
                      className={`group relative flex h-10 items-center overflow-hidden px-4 text-[13px] font-bold tracking-[0.06em] uppercase transition-colors ${
                        on ? 'text-white' : 'text-ink hover:text-accent'
                      }`}
                    >
                      {/* текст «прокручивается» при наведении */}
                      <span className="relative block overflow-hidden">
                        <span className="block transition-transform duration-300 ease-out-expo group-hover:-translate-y-full">{n.label}</span>
                        <span aria-hidden className="absolute inset-0 block translate-y-full transition-transform duration-300 ease-out-expo group-hover:translate-y-0">
                          {n.label}
                        </span>
                      </span>
                    </a>
                  </li>
                )
              })}
            </ul>
          </nav>

          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                setMenuOpen(false)
                onSearch()
              }}
              aria-label="Поиск товаров"
              className="grid size-11 place-items-center transition-colors hover:text-accent"
            >
              <Search size={21} strokeWidth={2} />
            </button>
            <button
              onClick={() => {
                setMenuOpen(false)
                openCart()
              }}
              aria-label={`Открыть корзину, товаров: ${count}`}
              className="relative grid size-11 place-items-center bg-ink text-white transition-colors hover:bg-accent"
            >
              <motion.span animate={bag} className="grid place-items-center">
                <ShoppingBag size={20} strokeWidth={2} />
              </motion.span>
              <AnimatePresence>
                {count > 0 && (
                  <motion.span
                    key={count}
                    initial={{ scale: 0, y: 6 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0 }}
                    transition={{ type: 'spring', stiffness: 600, damping: 18 }}
                    className="absolute -top-2 -right-2 grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 font-mono text-[11px] leading-none font-bold text-white ring-2 ring-paper"
                  >
                    {count}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              className="ml-1 grid size-11 place-items-center md:hidden"
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ clipPath: 'inset(0 0 100% 0)' }}
            animate={{ clipPath: 'inset(0 0 0% 0)' }}
            exit={{ clipPath: 'inset(0 0 100% 0)', transition: { duration: 0.35, ease: [0.7, 0, 0.84, 0] } }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-40 flex flex-col bg-ink px-4 pt-24 pb-8 text-white md:hidden"
          >
            <nav aria-label="Мобильное меню" className="flex-1">
              <ul>
                {NAV.map((n, i) => (
                  <motion.li
                    key={n.id}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + i * 0.07, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="border-b border-line-light"
                  >
                    <a
                      href={`#${n.id}`}
                      onClick={(e) => {
                        e.preventDefault()
                        go(n.id)
                      }}
                      className="flex items-center justify-between py-6 font-display text-[1.9rem] leading-none font-extrabold uppercase"
                    >
                      <span className="flex items-baseline gap-3">
                        <span className="font-mono text-sm text-accent">0{i + 1}</span>
                        {n.label}
                      </span>
                      <ArrowUpRight size={26} className={active === n.id ? 'text-accent' : 'text-white/50'} />
                    </a>
                  </motion.li>
                ))}
              </ul>
            </nav>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.4 } }} className="flex items-center justify-between text-sm text-white/70">
              <span className="tag">Drop 001</span>
              {tg ? (
                <a href={tg} target="_blank" rel="noopener noreferrer" className="font-bold text-white">
                  Telegram ↗
                </a>
              ) : (
                <span>Telegram — скоро</span>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
