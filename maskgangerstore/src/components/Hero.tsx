import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, ArrowDown } from 'lucide-react'
import { images } from '../data/products'
import { SmartImage } from './SmartImage'
import { scrollToId } from '../lib/scroll'

const ease = [0.16, 1, 0.3, 1] as const

export function Hero() {
  const reduce = useReducedMotion()
  const rise = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 40 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 1, delay, ease },
        }

  return (
    <section id="top" aria-label="Intro" className="relative isolate min-h-[100svh] overflow-hidden bg-bg">
      {/* Фото: на мобильном — на весь экран, на десктопе — правые ~60% */}
      <motion.div
        className="grain absolute inset-0 -z-10 lg:left-[38%]"
        initial={reduce ? false : { opacity: 0, scale: 1.08 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.8, ease }}
      >
        <SmartImage
          src={images.hero}
          alt="Model in streetwear standing in an empty concrete parking structure"
          fallbackLabel="Campaign image"
          fetchPriority="high"
          className="h-full w-full object-cover object-[60%_center] grayscale-[35%] contrast-[1.05]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/50 to-bg/10 lg:bg-gradient-to-r lg:from-bg lg:via-bg/25 lg:to-transparent" />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-bg/70 to-transparent" />
      </motion.div>

      {/* Технические пометки по краям */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute top-24 right-4 hidden flex-col items-end gap-1 text-right sm:flex sm:right-6 lg:right-10"
        {...rise(0.9)}
      >
        <span className="label text-ink/70">Fig. 01</span>
        <span className="label text-mute">Urban uniform</span>
      </motion.div>
      <motion.p
        aria-hidden
        className="label pointer-events-none absolute top-1/2 right-4 hidden origin-right translate-y-1/2 -rotate-90 text-ink/50 lg:block lg:right-10"
        {...rise(1.1)}
      >
        MASKGANGERSTORE / URBAN UNIFORM
      </motion.p>

      <div className="mx-auto flex min-h-[100svh] max-w-[1600px] flex-col justify-end px-4 pt-28 pb-10 sm:px-6 sm:pb-14 lg:justify-center lg:px-10 lg:pb-20">
        <motion.p className="label mb-5 flex items-center gap-3 text-ink/80" {...rise(0.25)}>
          <span className="inline-block h-px w-8 bg-accent" />
          Independent streetwear
        </motion.p>

        <h1 className="font-wide text-[clamp(2.6rem,12.4vw,9.25rem)] leading-[0.86] font-black tracking-[-0.035em] uppercase">
          <span className="block overflow-hidden pb-[0.04em]">
            <motion.span className="block" {...(reduce ? {} : { initial: { y: '105%' }, animate: { y: 0 }, transition: { duration: 1.1, delay: 0.35, ease } })}>
              Not made
            </motion.span>
          </span>
          <span className="block overflow-hidden pb-[0.04em]">
            <motion.span
              className="block lg:pl-[0.9em]"
              {...(reduce ? {} : { initial: { y: '105%' }, animate: { y: 0 }, transition: { duration: 1.1, delay: 0.47, ease } })}
            >
              To fit in<span className="text-accent">.</span>
            </motion.span>
          </span>
        </h1>

        <div className="mt-8 flex flex-col gap-8 sm:mt-10 lg:ml-[calc(0.9*clamp(2.6rem,12.4vw,9.25rem))] lg:max-w-xl">
          <motion.p className="max-w-xs text-base text-ink/80 sm:text-lg" {...rise(0.7)}>
            Everyday essentials. Different attitude.
          </motion.p>
          <motion.div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:gap-7" {...rise(0.82)}>
            <button
              onClick={() => scrollToId('shop')}
              className="group inline-flex h-14 items-center justify-between gap-6 whitespace-nowrap bg-accent px-6 text-[13px] font-bold tracking-[0.14em] text-ink uppercase transition-colors hover:bg-accent-hover active:scale-[0.98] sm:justify-center"
            >
              Explore collection
              <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
            </button>
            <button
              onClick={() => scrollToId('new')}
              className="group inline-flex h-11 items-center gap-2 self-start whitespace-nowrap border-b border-ink/40 text-[12px] font-semibold tracking-[0.14em] uppercase transition-colors hover:border-ink"
            >
              Discover new arrivals
              <ArrowDown size={15} className="transition-transform duration-300 group-hover:translate-y-0.5" />
            </button>
          </motion.div>
        </div>
      </div>

    </section>
  )
}
