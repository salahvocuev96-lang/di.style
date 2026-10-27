import { ArrowUpRight, ArrowUp } from 'lucide-react'
import { Logo } from './Logo'
import { scrollToId } from '../lib/scroll'
import { storeConfig, telegramProfileUrl } from '../config/store'

export function Footer() {
  const tg = telegramProfileUrl()
  const year = new Date().getFullYear()
  const links = [
    { id: 'shop', label: 'Каталог' },
    { id: 'new', label: 'Новинки' },
    { id: 'about', label: 'О магазине' },
  ]

  return (
    <footer className="bg-ink text-white">
      <div className="mx-auto max-w-[1600px] px-4 pt-16 pb-8 sm:px-6 lg:px-10">
        <div className="grid gap-12 md:grid-cols-[2fr_1fr_1fr]">
          <div>
            <Logo invert className="origin-left scale-125" />
            <p className="mt-6 max-w-xs text-base text-white/75">Streetwear и техническая одежда на каждый день.</p>
          </div>
          <nav aria-label="Меню в подвале">
            <p className="tag mb-4 text-white/60">Разделы</p>
            <ul className="space-y-3">
              {links.map((l) => (
                <li key={l.id}>
                  <a
                    href={`#${l.id}`}
                    onClick={(e) => {
                      e.preventDefault()
                      scrollToId(l.id)
                    }}
                    className="group inline-flex items-center gap-2 text-lg font-bold transition-colors hover:text-accent"
                  >
                    <span className="h-0.5 w-0 bg-accent transition-all duration-300 group-hover:w-4" />
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div>
            <p className="tag mb-4 text-white/60">Связь</p>
            {tg ? (
              <a href={tg} target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-2 text-lg font-bold hover:text-accent">
                Telegram <ArrowUpRight size={18} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            ) : (
              <p>
                <span className="text-lg font-bold">Telegram</span>
                <span className="mt-1 block text-white/65">Ссылка появится скоро</span>
              </p>
            )}
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="group mt-8 inline-flex items-center gap-2 text-sm font-bold text-white/80 hover:text-white"
            >
              <span className="grid size-9 place-items-center bg-accent transition-transform group-hover:-translate-y-1">
                <ArrowUp size={16} />
              </span>
              Наверх
            </button>
          </div>
        </div>

        <p aria-hidden className="mt-16 overflow-hidden font-display text-[clamp(1.6rem,8.6vw,9rem)] leading-[0.85] font-black tracking-[-0.05em] whitespace-nowrap select-none">
          <span className="text-accent">MASK</span>
          <span className="text-white/10">GANGER</span>
        </p>

        <div className="mt-6 flex flex-col gap-2 border-t border-line-light pt-6 text-sm text-white/65 sm:flex-row sm:justify-between">
          <p>
            © {year} {storeConfig.storeName}. Все права защищены.
          </p>
          {storeConfig.demoMode && <p>Демо-версия: товары, цены и фото — примеры</p>}
        </div>
      </div>
    </footer>
  )
}
