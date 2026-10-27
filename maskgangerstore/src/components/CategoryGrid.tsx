import { useState } from 'react'
import { motion, useMotionValue, useReducedMotion, useSpring, AnimatePresence } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { categories, products } from '../data/products'
import type { Category } from '../types/product'
import { SmartImage } from './SmartImage'
import { Stagger, StaggerItem } from './Reveal'
import { SectionHeading } from './SectionHeading'
import { plural } from '../lib/plural'

// Раскладка «бенто»: разные размеры карточек
const LAYOUT = [
  'col-span-2 aspect-[4/3] sm:aspect-[16/10] lg:col-span-5 lg:row-span-2 lg:aspect-auto',
  'aspect-[3/4] lg:col-span-4 lg:aspect-auto',
  'aspect-[3/4] lg:col-span-3 lg:aspect-auto',
  'col-span-2 aspect-[16/10] lg:col-span-7 lg:aspect-auto',
]

export function CategoryGrid({ onSelect }: { onSelect: (c: Category) => void }) {
  const reduce = useReducedMotion()
  const [hovered, setHovered] = useState(false)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const x = useSpring(mx, { stiffness: 500, damping: 40 })
  const y = useSpring(my, { stiffness: 500, damping: 40 })

  return (
    <section aria-labelledby="cat-title" className="bg-paper">
      <div className="mx-auto max-w-[1600px] px-4 pt-10 pb-20 sm:px-6 sm:pb-28 lg:px-10">
        <SectionHeading id="cat-title" index="01" caption="Выберите категорию" title="Собери свой образ" />
        <div
          className="relative"
          onPointerMove={(e) => {
            if (e.pointerType !== 'mouse') return
            const r = e.currentTarget.getBoundingClientRect()
            mx.set(e.clientX - r.left)
            my.set(e.clientY - r.top)
          }}
          onPointerLeave={() => setHovered(false)}
        >
          {/* Курсор-подсказка, который следует за мышью */}
          <AnimatePresence>
            {hovered && !reduce && (
              <motion.span
                aria-hidden
                style={{ x, y }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 26 }}
                className="pointer-events-none absolute top-0 left-0 z-20 -mt-12 -ml-12 hidden size-24 place-items-center rounded-full bg-accent text-center text-[12px] leading-tight font-extrabold tracking-wide text-white uppercase shadow-xl [@media(hover:hover)]:grid"
              >
                Смотреть
              </motion.span>
            )}
          </AnimatePresence>

          <Stagger as="ul" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-12 lg:grid-rows-[300px_300px]">
            {categories.map((c, i) => {
              const count = products.filter((p) => p.category === c.id).length
              return (
                <StaggerItem as="li" key={c.id} className={LAYOUT[i]}>
                  <button
                    onClick={() => onSelect(c.id)}
                    onPointerEnter={(e) => e.pointerType === 'mouse' && setHovered(true)}
                    className="group relative block h-full w-full overflow-hidden bg-graphite text-left text-white [@media(hover:hover)]:cursor-none"
                    aria-label={`${c.label}: ${count} ${plural(count, ['товар', 'товара', 'товаров'])}`}
                  >
                    <SmartImage
                      src={c.image}
                      alt=""
                      art={c.id}
                      dark
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.2s] ease-out-expo group-hover:scale-[1.08]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    {/* красная шторка снизу при наведении */}
                    <span className="absolute inset-x-0 bottom-0 h-1.5 origin-left scale-x-0 bg-accent transition-transform duration-500 ease-out-expo group-hover:scale-x-100" />

                    <span className="absolute top-3 left-3 bg-accent px-2 py-1 font-mono text-sm font-bold sm:top-4 sm:left-4">0{i + 1}</span>
                    <span className="absolute top-3 right-3 grid size-10 place-items-center bg-white text-ink transition-all duration-500 ease-out-expo group-hover:rotate-45 group-hover:bg-accent group-hover:text-white sm:top-4 sm:right-4 sm:size-12">
                      <ArrowUpRight size={20} />
                    </span>
                    <span className="absolute inset-x-3 bottom-4 sm:inset-x-5 sm:bottom-6">
                      <span className={`block font-display leading-none font-black uppercase ${i === 1 || i === 2 ? 'text-[clamp(1.05rem,4.6vw,2.4rem)]' : 'text-[clamp(1.6rem,5vw,3.2rem)]'} transition-transform duration-500 ease-out-expo group-hover:-translate-y-1`}>
                        {c.label}
                      </span>
                      <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-semibold text-white/90 sm:text-base">
                        <span className="hidden sm:inline">{c.caption}</span>
                        <span className="bg-white/15 px-2 py-0.5 backdrop-blur-sm">
                          {count} {plural(count, ['модель', 'модели', 'моделей'])}
                        </span>
                      </span>
                    </span>
                  </button>
                </StaggerItem>
              )
            })}
          </Stagger>
        </div>
      </div>
    </section>
  )
}
