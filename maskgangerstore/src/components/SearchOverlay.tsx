import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Search, X, ArrowRight } from 'lucide-react'
import { useModal } from '../lib/useModal'
import { filterProducts } from './Catalog'
import { categoryLabels } from '../data/products'
import { formatPrice } from '../lib/format'
import { SmartImage } from './SmartImage'

interface Props {
  open: boolean
  onClose: () => void
  onOpenProduct: (id: string) => void
  onSubmit: (query: string) => void
}

export function SearchOverlay(props: Props) {
  return <AnimatePresence>{props.open && <Inner {...props} />}</AnimatePresence>
}

const SUGGESTIONS = ['Худи', 'Шорты', 'Куртка', 'Кроссовки', 'Футболка']

function Inner({ onClose, onOpenProduct, onSubmit }: Props) {
  const ref = useModal<HTMLDivElement>(true, onClose)
  const [q, setQ] = useState('')
  const results = q.trim() ? filterProducts({ category: 'all', sort: 'featured', query: q }).slice(0, 6) : []

  return (
    <motion.div className="fixed inset-0 z-[65]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.2 } }}>
      <div className="absolute inset-0 bg-ink/60 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <motion.div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label="Поиск товаров"
        className="relative bg-white shadow-2xl"
        initial={{ y: '-100%' }}
        animate={{ y: 0 }}
        exit={{ y: '-100%' }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="h-1.5 bg-accent" />
        <div className="mx-auto max-w-[1100px] px-4 pt-6 pb-8 sm:px-6">
          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault()
              onSubmit(q.trim())
            }}
            className="flex items-center gap-3 border-b-2 border-ink/20 pb-3 focus-within:border-accent"
          >
            <Search size={24} className="shrink-0 text-accent" aria-hidden />
            <input
              id="site-search"
              data-autofocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Худи, футболки, кроссовки…"
              aria-label="Поиск товаров"
              className="h-14 min-w-0 flex-1 bg-transparent font-display text-xl font-extrabold placeholder:font-sans placeholder:text-lg placeholder:font-medium placeholder:text-mute focus:outline-none sm:text-3xl"
            />
            <button type="button" onClick={onClose} aria-label="Закрыть поиск" className="grid size-11 shrink-0 place-items-center bg-ink text-white hover:bg-accent">
              <X size={20} />
            </button>
          </form>

          {!q.trim() && (
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="mr-1 text-sm font-bold text-mute">Часто ищут:</span>
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => setQ(s)} className="h-10 border-2 border-ink/12 px-4 text-[14px] font-bold transition-colors hover:border-accent hover:text-accent">
                  {s}
                </button>
              ))}
            </div>
          )}

          {q.trim() && (
            <div className="mt-4" aria-live="polite">
              {results.length === 0 ? (
                <p className="py-6 text-lg text-mute">По запросу «{q.trim()}» ничего не найдено.</p>
              ) : (
                <>
                  <ul className="divide-y divide-line">
                    {results.map((p, i) => (
                      <motion.li key={p.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                        <button onClick={() => onOpenProduct(p.id)} className="group flex w-full items-center gap-4 py-3 text-left">
                          <span className="relative aspect-[3/4] w-14 shrink-0 overflow-hidden bg-paper-2">
                            <SmartImage src={p.images[0]} alt="" art={p.category} className="h-full w-full object-cover" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-base font-bold group-hover:text-accent">{p.name}</span>
                            <span className="text-sm text-mute">{categoryLabels[p.category]}</span>
                          </span>
                          <span className="font-display font-extrabold">{formatPrice(p.price)}</span>
                        </button>
                      </motion.li>
                    ))}
                  </ul>
                  <button
                    onClick={() => onSubmit(q.trim())}
                    className="btn-fill group mt-4 inline-flex h-12 items-center gap-2 bg-ink px-5 text-[14px] font-extrabold text-white uppercase [--fill:var(--color-accent)]"
                  >
                    Показать все в каталоге <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
