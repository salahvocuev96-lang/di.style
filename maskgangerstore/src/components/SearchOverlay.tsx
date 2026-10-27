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

const SUGGESTIONS = ['Hoodie', 'Shorts', 'Jacket', 'Runner']

function Inner({ onClose, onOpenProduct, onSubmit }: Props) {
  const ref = useModal<HTMLDivElement>(true, onClose)
  const [q, setQ] = useState('')
  const results = q.trim() ? filterProducts({ category: 'all', sort: 'featured', query: q }).slice(0, 6) : []

  return (
    <motion.div
      className="fixed inset-0 z-[65]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
    >
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <motion.div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label="Search products"
        className="relative border-b border-line bg-bg"
        initial={{ y: -30 }}
        animate={{ y: 0 }}
        exit={{ y: -30 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="mx-auto max-w-[1100px] px-4 pt-5 pb-8 sm:px-6">
          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault()
              onSubmit(q.trim())
            }}
            className="flex items-center gap-3 border-b border-ink/30 pb-3 focus-within:border-ink"
          >
            <Search size={20} className="shrink-0 text-mute" aria-hidden />
            <input
              data-autofocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search hoodies, tees, sneakers…"
              aria-label="Search products"
              className="h-12 min-w-0 flex-1 bg-transparent font-wide text-lg font-bold uppercase placeholder:font-sans placeholder:text-base placeholder:font-normal placeholder:normal-case placeholder:text-mute/70 focus:outline-none sm:text-2xl"
            />
            <button type="button" onClick={onClose} aria-label="Close search" className="grid size-11 shrink-0 place-items-center hover:text-accent">
              <X size={20} />
            </button>
          </form>

          {!q.trim() && (
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="label mr-1 text-mute">Popular:</span>
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => setQ(s)} className="h-8 border border-line px-3 text-[11px] font-semibold tracking-[0.12em] uppercase hover:border-ink">
                  {s}
                </button>
              ))}
            </div>
          )}

          {q.trim() && (
            <div className="mt-4" aria-live="polite">
              {results.length === 0 ? (
                <p className="py-6 text-mute">No products found for “{q.trim()}”.</p>
              ) : (
                <>
                  <ul className="divide-y divide-line">
                    {results.map((p) => (
                      <li key={p.id}>
                        <button onClick={() => onOpenProduct(p.id)} className="group flex w-full items-center gap-4 py-3 text-left">
                          <span className="relative aspect-[4/5] w-12 shrink-0 overflow-hidden bg-card">
                            <SmartImage src={p.images[0]} alt="" fallbackLabel="" className="h-full w-full object-cover" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold tracking-wide uppercase group-hover:text-accent">{p.name}</span>
                            <span className="label text-[10px] text-mute">{categoryLabels[p.category]}</span>
                          </span>
                          <span className="font-mono text-sm">{formatPrice(p.price)}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => onSubmit(q.trim())}
                    className="group mt-4 inline-flex h-11 items-center gap-2 text-[12px] font-semibold tracking-[0.14em] uppercase hover:text-accent"
                  >
                    Show all results in shop <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
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
