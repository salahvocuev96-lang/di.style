import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, Minus, Plus, ShoppingBag, Send, AlertCircle } from 'lucide-react'
import type { Product } from '../types/product'
import { products, categoryLabels } from '../data/products'
import { formatPrice } from '../lib/format'
import { useModal } from '../lib/useModal'
import { useAddToCart } from '../lib/useAddToCart'
import { useCart, MAX_QTY } from '../context/CartContext'
import { storeConfig } from '../config/store'
import { SmartImage } from './SmartImage'
import { ProductCard } from './ProductCard'

const ease = [0.16, 1, 0.3, 1] as const

export function ProductDetails({ product, onClose, onOpen }: { product: Product | null; onClose: () => void; onOpen: (id: string) => void }) {
  return <AnimatePresence>{product && <Panel key="pd" product={product} onClose={onClose} onOpen={onOpen} />}</AnimatePresence>
}

function Panel({ product, onClose, onOpen }: { product: Product; onClose: () => void; onOpen: (id: string) => void }) {
  const reduce = useReducedMotion()
  const ref = useModal<HTMLDivElement>(true, onClose)
  const scrollRef = useRef<HTMLDivElement>(null)
  const add = useAddToCart()
  const { openCart } = useCart()

  const [size, setSize] = useState<string | null>(null)
  const [qty, setQty] = useState(1)
  const [sizeError, setSizeError] = useState(false)
  const [shake, setShake] = useState(0)
  const [activeImg, setActiveImg] = useState(0)
  const [justAdded, setJustAdded] = useState(false)

  // При переходе на другой товар внутри окна — сбрасываем выбор и прокручиваем наверх
  useEffect(() => {
    setSize(null)
    setQty(1)
    setSizeError(false)
    setActiveImg(0)
    setJustAdded(false)
    scrollRef.current?.scrollTo({ top: 0 })
  }, [product.id])

  const hasSizes = product.sizes.length > 0
  const related = products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4)
  const fill = related.length < 4 ? products.filter((p) => p.id !== product.id && !related.includes(p)).slice(0, 4 - related.length) : []

  const handleAdd = () => {
    if (hasSizes && !size) {
      setSizeError(true)
      setShake((n) => n + 1)
      document.getElementById('size-picker')?.focus()
      add(product, null) // покажет toast «Select a size»
      return
    }
    if (add(product, size, qty)) {
      setJustAdded(true)
      window.setTimeout(() => setJustAdded(false), 1600)
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.25 } }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <motion.div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pd-title"
        tabIndex={-1}
        className="relative ml-auto flex h-full w-full max-w-[1280px] flex-col bg-bg outline-none lg:border-l lg:border-line"
        initial={reduce ? false : { x: '6%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={reduce ? { opacity: 0 } : { x: '6%', opacity: 0, transition: { duration: 0.25 } }}
        transition={{ duration: 0.6, ease }}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-4 sm:px-6">
          <button
            onClick={onClose}
            data-autofocus
            className="group inline-flex h-11 items-center gap-2 text-[12px] font-semibold tracking-[0.14em] uppercase"
          >
            <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
            Back to shop
          </button>
          <span className="label hidden text-mute sm:block">
            {categoryLabels[product.category]} / {product.name}
          </span>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain">
          <div className="grid lg:grid-cols-[1.15fr_1fr]">
            {/* Галерея */}
            <div className="lg:border-r lg:border-line">
              <div
                className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto lg:block lg:overflow-visible"
                onScroll={(e) => setActiveImg(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
              >
                {product.images.map((src, i) => (
                  <div key={src + i} className="relative aspect-[4/5] w-full shrink-0 snap-start bg-card lg:aspect-auto lg:h-auto">
                    <SmartImage
                      src={src}
                      alt={`${product.name} — photo ${i + 1}`}
                      fallbackLabel={categoryLabels[product.category]}
                      className="h-full w-full object-cover lg:aspect-[4/5]"
                    />
                  </div>
                ))}
              </div>
              {product.images.length > 1 && (
                <div className="flex justify-center gap-1.5 py-3 lg:hidden" aria-hidden>
                  {product.images.map((_, i) => (
                    <span key={i} className={`h-0.5 w-6 ${i === activeImg ? 'bg-ink' : 'bg-white/20'}`} />
                  ))}
                </div>
              )}
            </div>

            {/* Информация */}
            <div className="px-4 pt-6 pb-16 sm:px-8 lg:px-12 lg:pt-12">
              <div className="lg:sticky lg:top-12">
                <motion.div initial={reduce ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15, ease }}>
                  <div className="flex items-center gap-2">
                    <span className="label text-mute">{categoryLabels[product.category]}</span>
                    {product.badge && <span className="label border border-line px-2 py-0.5 text-[10px]">{product.badge}</span>}
                  </div>
                  <h2 id="pd-title" className="mt-3 font-wide text-[clamp(1.9rem,4.2vw,3.25rem)] leading-[0.92] font-black tracking-[-0.03em] uppercase">
                    {product.name}
                  </h2>
                  <p className="mt-4 font-mono text-xl">{formatPrice(product.price)}</p>
                  <p className="mt-6 max-w-md leading-relaxed text-ink/75">{product.description}</p>
                </motion.div>

                {/* Размер */}
                {hasSizes && (
                  <div className="mt-8">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="label text-ink" id="size-label">
                        Size {size && <span className="text-mute">— {size}</span>}
                      </p>
                      <span className="label text-mute">{product.category === 'sneakers' ? 'EU sizing' : 'Unisex fit'}</span>
                    </div>
                    <div
                      id="size-picker"
                      key={shake}
                      role="radiogroup"
                      aria-labelledby="size-label"
                      aria-describedby={sizeError ? 'size-error' : undefined}
                      tabIndex={-1}
                      className={`grid grid-cols-5 gap-1.5 outline-none sm:grid-cols-6 ${shake > 0 ? 'animate-[shake_0.35s_ease]' : ''}`}
                    >
                      {product.sizes.map((s) => {
                        const on = size === s
                        return (
                          <button
                            key={s}
                            role="radio"
                            aria-checked={on}
                            onClick={() => {
                              setSize(s)
                              setSizeError(false)
                            }}
                            className={`h-12 border font-mono text-sm transition-colors duration-150 ${
                              on
                                ? 'border-ink bg-ink text-bg'
                                : sizeError
                                  ? 'border-accent/70 hover:border-ink'
                                  : 'border-line hover:border-ink/60'
                            }`}
                          >
                            {s}
                          </button>
                        )
                      })}
                    </div>
                    <AnimatePresence>
                      {sizeError && (
                        <motion.p
                          id="size-error"
                          role="alert"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 flex items-center gap-2 overflow-hidden text-sm text-accent-hover"
                        >
                          <AlertCircle size={15} /> Please select a size before adding to cart.
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Количество + кнопка */}
                <div className="mt-6 flex gap-2">
                  <div className="flex h-14 items-center border border-line" role="group" aria-label="Quantity">
                    <button
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      disabled={qty <= 1}
                      className="grid h-full w-11 place-items-center transition-colors hover:text-accent disabled:opacity-30 disabled:hover:text-ink"
                      aria-label="Decrease quantity"
                    >
                      <Minus size={15} />
                    </button>
                    <span className="w-8 text-center font-mono" aria-live="polite" aria-label={`Quantity ${qty}`}>
                      {qty}
                    </span>
                    <button
                      onClick={() => setQty((q) => Math.min(MAX_QTY, q + 1))}
                      disabled={qty >= MAX_QTY}
                      className="grid h-full w-11 place-items-center transition-colors hover:text-accent disabled:opacity-30 disabled:hover:text-ink"
                      aria-label="Increase quantity"
                    >
                      <Plus size={15} />
                    </button>
                  </div>
                  <button
                    onClick={handleAdd}
                    className={`relative flex h-14 flex-1 items-center justify-center gap-3 overflow-hidden text-[13px] font-bold tracking-[0.14em] uppercase transition-colors active:scale-[0.99] ${
                      justAdded ? 'bg-ink text-bg' : 'bg-accent text-ink hover:bg-accent-hover'
                    }`}
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.span
                        key={justAdded ? 'added' : 'add'}
                        initial={{ y: 14, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -14, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center gap-3"
                      >
                        <ShoppingBag size={17} />
                        {justAdded ? 'Added' : `Add to cart — ${formatPrice(product.price * qty)}`}
                      </motion.span>
                    </AnimatePresence>
                  </button>
                </div>
                {justAdded && (
                  <button onClick={openCart} className="mt-3 text-sm text-mute underline-offset-4 hover:text-ink hover:underline">
                    View cart →
                  </button>
                )}

                {/* Детали */}
                <dl className="mt-10 border-t border-line">
                  <div className="border-b border-line py-4">
                    <dt className="label mb-3 text-mute">Product details</dt>
                    <dd>
                      <ul className="space-y-1.5 text-sm text-ink/80">
                        {product.details.map((d) => (
                          <li key={d} className="flex gap-3">
                            <span className="mt-2 h-px w-3 shrink-0 bg-accent" />
                            {d}
                          </li>
                        ))}
                      </ul>
                    </dd>
                  </div>
                  <div className="flex gap-3 border-b border-line py-4 text-sm text-ink/80">
                    <Send size={16} className="mt-0.5 shrink-0 text-mute" />
                    <dd>Orders are placed via Telegram. Availability, delivery and payment are confirmed directly with the seller.</dd>
                  </div>
                </dl>
                {storeConfig.demoMode && (
                  <p className="label mt-4 text-[10px] leading-relaxed text-mute">Demo product — photos, names and prices are placeholders.</p>
                )}
              </div>
            </div>
          </div>

          {/* Похожие товары */}
          <section aria-labelledby="related-title" className="border-t border-line px-4 py-12 sm:px-6 lg:px-12">
            <h3 id="related-title" className="mb-6 font-wide text-xl font-black uppercase">
              You may also like
            </h3>
            <ul className="grid grid-cols-2 gap-x-2 gap-y-8 sm:gap-x-3 lg:grid-cols-4">
              {[...related, ...fill].map((p) => (
                <li key={p.id}>
                  <ProductCard product={p} onOpen={onOpen} />
                </li>
              ))}
            </ul>
          </section>
        </div>
      </motion.div>
    </motion.div>
  )
}
