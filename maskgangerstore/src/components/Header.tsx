import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, Search, ShoppingBag, X, ArrowUpRight } from 'lucide-react'
import { Logo } from './Logo'
import { useCart } from '../context/CartContext'
import { useActiveSection } from '../lib/useActiveSection'
import { scrollToId } from '../lib/scroll'
import { telegramProfileUrl } from '../config/store'
import { lockScroll } from '../lib/useModal'

const NAV = [
  { id: 'shop', label: 'Shop' },
  { id: 'new', label: 'New Arrivals' },
  { id: 'about', label: 'About' },
]
const SECTION_IDS = NAV.map((n) => n.id)

export function Header({ onSearch }: { onSearch: () => void }) {
  const { count, openCart } = useCart()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const active = useActiveSection(SECTION_IDS)

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
    // ждём закрытия меню, чтобы прокрутка не блокировалась
    requestAnimationFrame(() => scrollToId(id))
  }

  const tg = telegramProfileUrl()

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-500 ${
          scrolled || menuOpen ? 'border-b border-line bg-bg/85 backdrop-blur-md' : 'border-b border-transparent bg-transparent'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault()
              setMenuOpen(false)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            aria-label="MASKGANGERSTORE — back to top"
            className="shrink-0"
          >
            <Logo />
          </a>

          <nav aria-label="Main" className="hidden md:block">
            <ul className="flex items-center gap-9">
              {NAV.map((n) => (
                <li key={n.id}>
                  <a
                    href={`#${n.id}`}
                    onClick={(e) => {
                      e.preventDefault()
                      go(n.id)
                    }}
                    aria-current={active === n.id ? 'true' : undefined}
                    className={`group relative py-2 text-[12px] font-semibold tracking-[0.16em] uppercase transition-colors ${
                      active === n.id ? 'text-ink' : 'text-ink/60 hover:text-ink'
                    }`}
                  >
                    {n.label}
                    <span
                      className={`absolute -bottom-0.5 left-0 h-px bg-accent transition-all duration-300 ease-out-expo ${
                        active === n.id ? 'w-full' : 'w-0 group-hover:w-full'
                      }`}
                    />
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                setMenuOpen(false)
                onSearch()
              }}
              aria-label="Search products"
              className="grid size-11 place-items-center text-ink/80 transition-colors hover:text-ink"
            >
              <Search size={19} strokeWidth={1.75} />
            </button>
            <button
              onClick={() => {
                setMenuOpen(false)
                openCart()
              }}
              aria-label={`Open cart, ${count} ${count === 1 ? 'item' : 'items'}`}
              className="relative grid size-11 place-items-center text-ink/80 transition-colors hover:text-ink"
            >
              <ShoppingBag size={19} strokeWidth={1.75} />
              <AnimatePresence>
                {count > 0 && (
                  <motion.span
                    key={count}
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.4, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 600, damping: 20 }}
                    className="absolute top-1.5 right-0.5 grid h-[18px] min-w-[18px] place-items-center bg-accent px-1 font-mono text-[10px] leading-none font-medium text-ink"
                  >
                    {count}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              className="grid size-11 place-items-center md:hidden"
            >
              {menuOpen ? <X size={22} strokeWidth={1.75} /> : <Menu size={22} strokeWidth={1.75} />}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            className="fixed inset-0 z-40 flex flex-col bg-bg px-4 pt-24 pb-8 md:hidden"
          >
            <nav aria-label="Mobile" className="flex-1">
              <ul className="border-t border-line">
                {NAV.map((n, i) => (
                  <motion.li
                    key={n.id}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.06 + i * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="border-b border-line"
                  >
                    <a
                      href={`#${n.id}`}
                      onClick={(e) => {
                        e.preventDefault()
                        go(n.id)
                      }}
                      className="flex items-center justify-between py-5 font-wide text-[1.75rem] leading-none font-black uppercase"
                    >
                      <span>
                        <span className="label mr-3 align-middle text-mute">0{i + 1}</span>
                        {n.label}
                      </span>
                      <ArrowUpRight size={22} className={active === n.id ? 'text-accent' : 'text-mute'} />
                    </a>
                  </motion.li>
                ))}
              </ul>
            </nav>
            <div className="flex items-center justify-between label text-mute">
              <span>Urban uniform</span>
              {tg ? (
                <a href={tg} target="_blank" rel="noopener noreferrer" className="text-ink">
                  Telegram ↗
                </a>
              ) : (
                <span>Telegram — soon</span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
