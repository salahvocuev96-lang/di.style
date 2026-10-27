import { ArrowUpRight } from 'lucide-react'
import { Logo } from './Logo'
import { scrollToId } from '../lib/scroll'
import { storeConfig, telegramProfileUrl } from '../config/store'

export function Footer() {
  const tg = telegramProfileUrl()
  const year = new Date().getFullYear()
  const links = [
    { id: 'shop', label: 'Shop' },
    { id: 'new', label: 'New Arrivals' },
    { id: 'about', label: 'About' },
  ]

  return (
    <footer className="border-t border-line bg-bg2">
      <div className="mx-auto max-w-[1600px] px-4 pt-16 pb-8 sm:px-6 lg:px-10">
        <div className="grid gap-12 md:grid-cols-[2fr_1fr_1fr]">
          <div>
            <Logo className="scale-125 origin-left" />
            <p className="mt-6 max-w-xs text-sm text-mute">Independent streetwear. Everyday essentials, different attitude.</p>
          </div>
          <nav aria-label="Footer">
            <p className="label mb-4 text-mute">Navigate</p>
            <ul className="space-y-2">
              {links.map((l) => (
                <li key={l.id}>
                  <a
                    href={`#${l.id}`}
                    onClick={(e) => {
                      e.preventDefault()
                      scrollToId(l.id)
                    }}
                    className="text-sm font-semibold tracking-[0.1em] uppercase transition-colors hover:text-accent"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div>
            <p className="label mb-4 text-mute">Contact</p>
            {tg ? (
              <a href={tg} target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-2 text-sm font-semibold tracking-[0.1em] uppercase hover:text-accent">
                Telegram <ArrowUpRight size={15} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            ) : (
              <p className="text-sm">
                <span className="font-semibold tracking-[0.1em] uppercase">Telegram</span>
                <span className="mt-1 block text-mute">Link coming soon</span>
              </p>
            )}
          </div>
        </div>

        <p aria-hidden className="mt-16 overflow-hidden whitespace-nowrap font-wide text-[clamp(1.5rem,8.4vw,9rem)] leading-[0.8] font-black tracking-[-0.045em] text-white/[0.06] select-none">
          MASKGANGER
        </p>

        <div className="mt-6 flex flex-col gap-2 border-t border-line pt-6 sm:flex-row sm:justify-between">
          <p className="label text-mute">
            © {year} {storeConfig.storeName}. All rights reserved.
          </p>
          {storeConfig.demoMode && <p className="label text-mute">Demo storefront — products & prices are placeholders</p>}
        </div>
      </div>
    </footer>
  )
}
