import { motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'

const ease = [0.16, 1, 0.3, 1] as const

/** Заголовок секции: красный номер, крупный заголовок по словам, подпись и действие справа */
export function SectionHeading({
  index,
  title,
  caption,
  action,
  dark = false,
  id,
}: {
  index: string
  title: string
  caption?: string
  action?: ReactNode
  dark?: boolean
  id?: string
}) {
  const reduce = useReducedMotion()
  const words = title.split(' ')
  return (
    <div className="mb-10 flex flex-col gap-6 sm:mb-14 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <motion.div
          className="mb-4 flex items-center gap-3"
          initial={reduce ? false : { opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease }}
        >
          <span className="bg-accent px-2 py-1 font-mono text-sm font-bold text-white">{index}</span>
          {caption && <span className={`text-base font-semibold ${dark ? 'text-white/80' : 'text-mute'}`}>{caption}</span>}
        </motion.div>
        <h2 id={id} className="font-display text-[clamp(2.1rem,6.4vw,5.5rem)] leading-[0.95] font-black tracking-[-0.04em] uppercase">
          {words.map((w, i) => (
            <span key={i} className="-mt-[0.16em] inline-block overflow-hidden pt-[0.16em] pr-[0.25em] pb-[0.08em] align-bottom">
              <motion.span
                className="inline-block"
                initial={reduce ? false : { y: '105%' }}
                whileInView={{ y: '0%' }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, delay: 0.1 + i * 0.08, ease }}
              >
                {w}
              </motion.span>
            </span>
          ))}
        </h2>
      </div>
      {action}
    </div>
  )
}
