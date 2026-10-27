import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Plus } from 'lucide-react'
import { images, getProduct } from '../data/products'
import { SmartImage } from './SmartImage'
import { ImageReveal, Reveal, Stagger, StaggerItem } from './Reveal'
import { formatPrice } from '../lib/format'

// Точки на фото: координаты в процентах и товар, который открывается
const SPOTS = [
  { id: 'technical-windbreaker', x: 46, y: 34 },
  { id: 'technical-cargo-shorts', x: 58, y: 62 },
  { id: 'urban-runner-sneakers', x: 40, y: 88 },
]

export function Lookbook({ onOpen }: { onOpen: (id: string) => void }) {
  const [active, setActive] = useState<string | null>(null)
  const look = SPOTS.map((s) => ({ ...s, product: getProduct(s.id)! }))
  const total = look.reduce((sum, l) => sum + l.product.price, 0)

  return (
    <section aria-labelledby="look-title" className="bg-paper">
      <div className="mx-auto grid max-w-[1600px] gap-4 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-12 lg:gap-6 lg:px-10">
        {/* Фото с точками */}
        <ImageReveal className="relative aspect-[4/5] overflow-hidden bg-graphite sm:aspect-[4/3] lg:col-span-7 lg:aspect-auto lg:min-h-[640px]">
          <SmartImage
            src={images.lookbook}
            alt="Образ: ветровка, шорты-карго и кроссовки на фоне ночного города"
            art="jackets"
            dark
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />
          <p className="absolute top-4 left-4 bg-white px-3 py-1.5 text-sm font-bold">Нажмите на точку, чтобы открыть вещь</p>
          {look.map((s, i) => (
            <div key={s.id} className="absolute" style={{ left: `${s.x}%`, top: `${s.y}%` }}>
              <button
                onClick={() => onOpen(s.id)}
                onPointerEnter={() => setActive(s.id)}
                onPointerLeave={() => setActive(null)}
                onFocus={() => setActive(s.id)}
                onBlur={() => setActive(null)}
                className="relative -mt-5 -ml-5 grid size-10 place-items-center rounded-full bg-accent text-white shadow-lg transition-transform hover:scale-110"
                aria-label={`${s.product.name}, ${formatPrice(s.product.price)}`}
              >
                <span className="absolute inset-0 animate-ping rounded-full bg-accent/60 motion-reduce:hidden" style={{ animationDelay: `${i * 0.4}s`, animationDuration: '2.2s' }} />
                <Plus size={18} strokeWidth={3} className="relative" />
              </button>
              <AnimatePresence>
                {active === s.id && (
                  <motion.span
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="pointer-events-none absolute top-7 left-1/2 z-10 w-max max-w-[220px] -translate-x-1/2 bg-white px-3 py-2 text-ink shadow-xl"
                  >
                    <span className="block text-sm font-bold">{s.product.name}</span>
                    <span className="font-display text-sm font-extrabold text-accent">{formatPrice(s.product.price)}</span>
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          ))}
        </ImageReveal>

        {/* Описание образа */}
        <div className="flex flex-col gap-4 lg:col-span-5">
          <Reveal className="relative flex-1 overflow-hidden bg-accent p-6 text-white sm:p-10">
            <span aria-hidden className="dots absolute -right-6 -bottom-6 h-40 w-40 text-white/25" />
            <p className="tag font-bold text-white/85">Образ / Drop 001</p>
            <h2 id="look-title" className="mt-4 font-display text-[clamp(2rem,4.6vw,3.8rem)] leading-[0.95] font-black tracking-[-0.03em] uppercase">
              Городская форма
            </h2>
            <p className="mt-5 max-w-sm text-lg leading-relaxed font-medium text-white/95">
              Ветровка, шорты-карго и лёгкие кроссовки — один образ на весь день: от утра до вечерней прогулки.
            </p>
          </Reveal>

          <div className="bg-white p-4 sm:p-6">
            <Stagger as="ul" className="divide-y divide-line">
              {look.map((s, i) => (
                <StaggerItem as="li" key={s.id}>
                  <button
                    onClick={() => onOpen(s.id)}
                    onPointerEnter={() => setActive(s.id)}
                    onPointerLeave={() => setActive(null)}
                    className={`group flex w-full items-center gap-4 py-3 text-left transition-colors ${active === s.id ? 'text-accent' : ''}`}
                  >
                    <span className="font-mono text-sm font-bold text-accent">0{i + 1}</span>
                    <span className="relative size-14 shrink-0 overflow-hidden bg-paper-2">
                      <SmartImage src={s.product.images[0]} alt="" art={s.product.category} loading="lazy" className="h-full w-full object-cover" />
                    </span>
                    <span className="min-w-0 flex-1 font-bold">{s.product.name}</span>
                    <span className="font-display font-extrabold">{formatPrice(s.product.price)}</span>
                    <ArrowRight size={18} className="shrink-0 transition-transform group-hover:translate-x-1" />
                  </button>
                </StaggerItem>
              ))}
            </Stagger>
            <p className="mt-3 flex items-baseline justify-between border-t-2 border-ink pt-3">
              <span className="font-bold">Весь образ</span>
              <span className="font-display text-xl font-black">{formatPrice(total)}</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
