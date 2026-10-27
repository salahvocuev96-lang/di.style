import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, Minus, Plus, ShoppingBag, Send, AlertCircle, Check } from 'lucide-react'
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
      add(product, null) // покажет уведомление «Выберите размер»
      return
    }
    if (add(product, size, qty)) {
      setJustAdded(true)
      window.setTimeout(() => setJustAdded(false), 1800)
    }
  }

  return (
    <motion.div className="fixed inset-0 z-[60] flex" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.25 } }}>
      <div className="absolute inset-0 bg-ink/60 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <motion.div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pd-title"
        tabIndex={-1}
        className="relative ml-auto flex h-full w-full max-w-[1280px] flex-col bg-paper outline-none"
        initial={reduce ? false : { x: '100%' }}
        animate={{ x: 0 }}
        exit={reduce ? { opacity: 0 } : { x: '100%', transition: { duration: 0.35, ease: [0.7, 0, 0.84, 0] } }}
        transition={{ duration: 0.7, ease }}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-line bg-white px-4 sm:px-6">
          <button onClick={onClose} data-autofocus className="group inline-flex h-11 items-center gap-2 text-[15px] font-bold">
            <span className="grid size-9 place-items-center bg-ink text-white transition-colors group-hover:bg-accent">
              <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-0.5" />
            </span>
            Назад в каталог
          </button>
          <span className="hidden text-sm font-semibold text-mute sm:block">
            {categoryLabels[product.category]} / <span className="text-ink">{product.name}</span>
          </span>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain">
          <div className="grid lg:grid-cols-[1.1fr_1fr]">
            {/* Галерея */}
            <div className="bg-paper-2">
              <div
                className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto lg:block lg:overflow-visible"
                onScroll={(e) => setActiveImg(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
              >
                {product.images.map((src, i) => (
                  <motion.div
                    key={src + i}
                    className="relative aspect-[4/5] w-full shrink-0 snap-start"
                    initial={reduce ? false : { opacity: 0, scale: 1.04 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.9, delay: 0.15 + i * 0.1, ease }}
                  >
                    <SmartImage
                      src={src}
                      alt={`${product.name} — фото ${i + 1}`}
                      art={product.category}
                      fallbackLabel={i === 0 ? categoryLabels[product.category] : undefined}
                      className="h-full w-full object-cover"
                    />
                  </motion.div>
                ))}
              </div>
              {product.images.length > 1 && (
                <div className="flex justify-center gap-1.5 py-3 lg:hidden" aria-hidden>
                  {product.images.map((_, i) => (
                    <span key={i} className={`h-1 transition-all ${i === activeImg ? 'w-8 bg-accent' : 'w-4 bg-ink/20'}`} />
                  ))}
                </div>
              )}
            </div>

            {/* Информация */}
            <div className="px-4 pt-8 pb-16 sm:px-8 lg:px-12 lg:pt-12">
              <div className="lg:sticky lg:top-12">
                <motion.div initial={reduce ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.25, ease }}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-ink px-2 py-1 text-[13px] font-bold text-white">{categoryLabels[product.category]}</span>
                    {product.badge && <span className="bg-accent px-2 py-1 text-[13px] font-bold text-white">{product.badge}</span>}
                  </div>
                  <h2 id="pd-title" className="mt-4 font-display text-[clamp(1.9rem,4vw,3.2rem)] leading-[0.98] font-black tracking-[-0.03em] uppercase">
                    {product.name}
                  </h2>
                  <p className="mt-4 font-display text-3xl font-black text-accent">{formatPrice(product.price)}</p>
                  <p className="mt-6 max-w-[60ch] text-[17px] leading-relaxed text-ink/85">{product.description}</p>
                </motion.div>

                {/* Размер */}
                {hasSizes && (
                  <div className="mt-8">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-base font-extrabold" id="size-label">
                        Размер {size && <span className="text-accent">— {size}</span>}
                      </p>
                      <span className="text-sm font-semibold text-mute">{product.category === 'sneakers' ? 'Европейская сетка' : 'Унисекс'}</span>
                    </div>
                    <div
                      id="size-picker"
                      key={shake}
                      role="radiogroup"
                      aria-labelledby="size-label"
                      aria-describedby={sizeError ? 'size-error' : undefined}
                      tabIndex={-1}
                      className={`grid grid-cols-5 gap-2 outline-none sm:grid-cols-6 ${shake > 0 ? 'animate-[shake_0.35s_ease]' : ''}`}
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
                            className={`relative h-12 border-2 font-mono text-[15px] font-bold transition-colors duration-150 ${
                              on ? 'border-ink bg-ink text-white' : sizeError ? 'border-accent bg-white' : 'border-ink/15 bg-white hover:border-ink'
                            }`}
                          >
                            {s}
                            {on && (
                              <motion.span layoutId="size-dot" className="absolute -top-1.5 -right-1.5 grid size-4 place-items-center rounded-full bg-accent">
                                <Check size={10} strokeWidth={4} />
                              </motion.span>
                            )}
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
                          className="mt-3 flex items-center gap-2 overflow-hidden text-[15px] font-bold text-accent"
                        >
                          <AlertCircle size={17} /> Выберите размер, чтобы добавить товар в корзину.
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Количество + кнопка */}
                <div className="mt-6 flex gap-2">
                  <div className="flex h-16 items-center border-2 border-ink/15 bg-white" role="group" aria-label="Количество">
                    <button
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      disabled={qty <= 1}
                      className="grid h-full w-12 place-items-center transition-colors hover:text-accent disabled:opacity-30 disabled:hover:text-ink"
                      aria-label="Уменьшить количество"
                    >
                      <Minus size={18} />
                    </button>
                    <span className="w-8 text-center font-mono text-lg font-bold" aria-live="polite" aria-label={`Количество: ${qty}`}>
                      {qty}
                    </span>
                    <button
                      onClick={() => setQty((q) => Math.min(MAX_QTY, q + 1))}
                      disabled={qty >= MAX_QTY}
                      className="grid h-full w-12 place-items-center transition-colors hover:text-accent disabled:opacity-30 disabled:hover:text-ink"
                      aria-label="Увеличить количество"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                  <button
                    onClick={handleAdd}
                    className={`btn-fill relative flex h-16 flex-1 items-center justify-center gap-3 overflow-hidden text-[15px] font-extrabold tracking-[0.04em] uppercase transition-colors active:scale-[0.99] ${
                      justAdded ? 'bg-ink text-white' : 'bg-accent text-white'
                    }`}
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.span
                        key={justAdded ? 'added' : 'add'}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        transition={{ duration: 0.22 }}
                        className="flex items-center gap-3"
                      >
                        {justAdded ? <Check size={20} strokeWidth={3} /> : <ShoppingBag size={19} />}
                        {justAdded ? 'Добавлено' : `В корзину · ${formatPrice(product.price * qty)}`}
                      </motion.span>
                    </AnimatePresence>
                  </button>
                </div>
                <AnimatePresence>
                  {justAdded && (
                    <motion.button
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      onClick={openCart}
                      className="mt-3 text-[15px] font-bold text-accent underline-offset-4 hover:underline"
                    >
                      Перейти в корзину →
                    </motion.button>
                  )}
                </AnimatePresence>

                {/* Детали */}
                <div className="mt-10 grid gap-3 sm:grid-cols-2">
                  <div className="bg-white p-5">
                    <p className="mb-3 text-base font-extrabold">О товаре</p>
                    <ul className="space-y-2 text-[15px] text-ink/85">
                      {product.details.map((d) => (
                        <li key={d} className="flex gap-3">
                          <span className="mt-2.5 h-0.5 w-3 shrink-0 bg-accent" />
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-ink p-5 text-white">
                    <p className="mb-3 flex items-center gap-2 text-base font-extrabold">
                      <Send size={17} className="text-accent" /> Заказ через Telegram
                    </p>
                    <p className="text-[15px] leading-relaxed text-white/85">
                      Наличие, доставку и оплату вы уточняете напрямую у продавца в Telegram.
                    </p>
                  </div>
                </div>
                {storeConfig.demoMode && <p className="mt-4 text-sm text-mute">Демо-товар: фото, название и цена — примеры.</p>}
              </div>
            </div>
          </div>

          {/* Похожие товары */}
          <section aria-labelledby="related-title" className="border-t border-line bg-white px-4 py-12 sm:px-6 lg:px-12">
            <h3 id="related-title" className="mb-8 font-display text-2xl font-black uppercase">
              Вам может понравиться
            </h3>
            <ul className="grid grid-cols-2 gap-x-3 gap-y-9 sm:gap-x-4 lg:grid-cols-4">
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
