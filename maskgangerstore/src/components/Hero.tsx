import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, ArrowDownRight, Plus } from 'lucide-react'
import { images, products, getProduct } from '../data/products'
import { SmartImage } from './SmartImage'
import { Magnetic } from './Magnetic'
import { scrollToId } from '../lib/scroll'
import { formatPrice } from '../lib/format'

const ease = [0.16, 1, 0.3, 1] as const
const featured = getProduct('utility-shell-jacket')!
const categoryCount = new Set(products.map((p) => p.category)).size

export function Hero({ onOpen }: { onOpen: (id: string) => void }) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  // Параллакс: фото уходит медленнее страницы, цифра — быстрее
  const imgY = useTransform(scrollYProgress, [0, 1], ['0%', reduce ? '0%' : '16%'])
  const numY = useTransform(scrollYProgress, [0, 1], ['0%', reduce ? '0%' : '-60%'])

  const line = (i: number) =>
    reduce ? {} : { initial: { y: '110%' }, animate: { y: '0%' }, transition: { duration: 1, delay: 0.35 + i * 0.12, ease } }
  const fade = (d: number, y = 24) => (reduce ? {} : { initial: { opacity: 0, y }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.8, delay: d, ease } })

  return (
    <section ref={ref} id="top" aria-label="Главный экран" className="relative overflow-hidden bg-paper pt-24 pb-14 sm:pt-28 lg:min-h-[min(100svh,1000px)] lg:pb-16">
      {/* Крупная фоновая цифра */}
      <motion.span
        aria-hidden
        style={{ y: numY }}
        className="pointer-events-none absolute right-[2%] -bottom-[0.12em] hidden font-display text-[clamp(8rem,17vw,17rem)] leading-none font-black text-transparent [-webkit-text-stroke:1.5px_rgba(23,23,23,0.12)] select-none lg:block"
      >
        001
      </motion.span>

      <div className="relative mx-auto grid max-w-[1600px] gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:gap-6 lg:px-10">
        {/* Текст */}
        <div className="relative z-10 flex flex-col justify-center lg:col-span-7 lg:pt-6">
          <div className="mb-6 flex items-center gap-3">
            <motion.span
              className="h-[3px] w-14 origin-left bg-accent sm:w-20"
              initial={reduce ? false : { scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.9, delay: 0.25, ease }}
            />
            <motion.p className="tag text-[13px] font-bold text-ink" {...fade(0.4, 10)}>
              Новая волна городского стиля
            </motion.p>
          </div>

          <h1 className="font-display text-[clamp(2.3rem,6.1vw,6.4rem)] leading-[1] font-black tracking-[-0.04em] uppercase">
            <span className="-mt-[0.14em] block overflow-hidden pt-[0.14em] pb-[0.06em]">
              <motion.span className="block" {...line(0)}>
                Твой стиль.
              </motion.span>
            </span>
            <span className="-mt-[0.14em] block overflow-hidden pt-[0.14em] pb-[0.06em]">
              <motion.span className="relative inline-block px-[0.12em] text-white" {...line(1)}>
                <motion.span
                  aria-hidden
                  className="absolute inset-0 -z-0 origin-left bg-accent"
                  initial={reduce ? false : { scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.8, delay: 0.75, ease }}
                />
                <span className="relative">Твои правила.</span>
              </motion.span>
            </span>
          </h1>

          <motion.p className="mt-7 max-w-md text-lg leading-relaxed font-medium text-ink/80 sm:text-xl" {...fade(0.9)}>
            Техническая одежда и streetwear на&nbsp;каждый день.
          </motion.p>

          <motion.div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4" {...fade(1.05)}>
            <Magnetic className="sm:inline-block">
              <button
                onClick={() => scrollToId('shop')}
                className="btn-fill group flex h-16 w-full items-center justify-between gap-8 bg-accent px-7 text-[15px] font-extrabold tracking-[0.04em] text-white uppercase shadow-[0_14px_30px_-12px_rgba(227,27,35,0.7)] sm:w-auto"
              >
                Смотреть каталог
                <span className="grid size-9 place-items-center bg-white/15 transition-transform duration-500 ease-out-expo group-hover:translate-x-1 group-hover:rotate-[-45deg]">
                  <ArrowRight size={20} />
                </span>
              </button>
            </Magnetic>
            <button
              onClick={() => scrollToId('new')}
              className="btn-fill group flex h-16 items-center justify-between gap-6 border-2 border-ink px-6 text-[15px] font-extrabold tracking-[0.04em] uppercase transition-colors hover:text-white sm:justify-center"
            >
              Новинки
              <ArrowDownRight size={20} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:translate-y-0.5" />
            </button>
          </motion.div>

          {/* Факты о каталоге — считаются из данных */}
          <motion.dl className="mt-12 grid max-w-lg grid-cols-3 border-t-2 border-ink" {...fade(1.2)}>
            {[
              [String(products.length), 'моделей в каталоге'],
              [String(categoryCount), 'категорий'],
              ['TG', 'заказ в Telegram'],
            ].map(([v, k]) => (
              <div key={k} className="border-r border-line pt-4 pr-3 last:border-r-0 [&:not(:first-child)]:pl-4">
                <dt className="sr-only">{k}</dt>
                <dd className="font-display text-2xl font-black sm:text-3xl">{v}</dd>
                <dd className="mt-1 text-sm leading-tight font-semibold text-mute">{k}</dd>
              </div>
            ))}
          </motion.dl>
        </div>

        {/* Фото */}
        <div className="relative lg:col-span-5">
          <motion.div
            aria-hidden
            className="absolute top-8 -right-4 bottom-10 left-10 bg-accent sm:-right-6 lg:-right-10"
            initial={reduce ? false : { scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 1, delay: 0.2, ease }}
            style={{ originY: 1 }}
          />
          <motion.div
            className="relative aspect-[4/5] overflow-hidden bg-graphite sm:aspect-[5/6] lg:aspect-[4/5]"
            initial={reduce ? false : { clipPath: 'inset(100% 0 0 0)' }}
            animate={{ clipPath: 'inset(0% 0 0 0)' }}
            transition={{ duration: 1.3, delay: 0.35, ease }}
          >
            <motion.div className="absolute inset-[-8%_0]" style={{ y: imgY }}>
              <SmartImage
                src={images.hero}
                alt="Модель в уличной одежде на фоне бетонной парковки"
                art="jackets"
                dark
                fetchPriority="high"
                className="h-full w-full object-cover object-[55%_center]"
              />
            </motion.div>
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/55 to-transparent" />
            <span className="tag absolute top-4 left-4 bg-white px-2 py-1 text-ink">Drop 001</span>
            <span className="tag absolute top-4 right-4 font-bold text-white [text-shadow:0_1px_8px_rgba(0,0,0,0.5)]">FW / URBAN</span>
          </motion.div>

          {/* Вертикальная подпись */}
          <motion.p
            aria-hidden
            className="tag absolute top-1/2 -left-3 hidden origin-center -translate-x-1/2 -rotate-90 font-bold whitespace-nowrap text-ink lg:block"
            {...fade(1.4, 0)}
          >
            MASKGANGERSTORE / DROP 001
          </motion.p>

          {/* Карточка товара поверх фото */}
          <motion.button
            onClick={() => onOpen(featured.id)}
            className="group absolute -bottom-6 left-3 flex max-w-[calc(100%-1.5rem)] items-center gap-3 bg-white p-2 pr-4 text-left shadow-[0_20px_40px_-15px_rgba(0,0,0,0.35)] sm:left-6 lg:-left-10"
            initial={reduce ? false : { opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.35, ease }}
            whileHover={reduce ? undefined : { y: -4 }}
          >
            <span className="relative size-16 shrink-0 overflow-hidden bg-paper-2">
              <SmartImage src={featured.images[0]} alt="" art={featured.category} className="h-full w-full object-cover" />
            </span>
            <span className="min-w-0">
              <span className="tag block text-accent">В кадре</span>
              <span className="block truncate font-bold">{featured.name}</span>
              <span className="font-display text-sm font-extrabold">{formatPrice(featured.price)}</span>
            </span>
            <span className="ml-2 grid size-9 shrink-0 place-items-center bg-ink text-white transition-colors group-hover:bg-accent">
              <Plus size={18} className="transition-transform duration-300 group-hover:rotate-90" />
            </span>
          </motion.button>
        </div>
      </div>
    </section>
  )
}
