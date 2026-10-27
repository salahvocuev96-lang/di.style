import { motion, useReducedMotion, type Variants } from 'framer-motion'
import type { ReactNode } from 'react'

const ease = [0.16, 1, 0.3, 1] as const
const VIEW = { once: true, margin: '0px 0px -10% 0px' } as const

/** Появление блока при прокрутке: сдвиг + прозрачность, один раз */
export function Reveal({ children, delay = 0, className, y = 40 }: { children: ReactNode; delay?: number; className?: string; y?: number }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VIEW}
      transition={{ duration: 0.9, delay, ease }}
    >
      {children}
    </motion.div>
  )
}

/** Контейнер, дети которого (StaggerItem) появляются по очереди */
export function Stagger({ children, className, gap = 0.09, as = 'div' }: { children: ReactNode; className?: string; gap?: number; as?: 'div' | 'ul' }) {
  const reduce = useReducedMotion()
  const Comp = as === 'ul' ? motion.ul : motion.div
  return (
    <Comp
      className={className}
      initial={reduce ? false : 'hidden'}
      whileInView="show"
      viewport={VIEW}
      variants={{ hidden: {}, show: { transition: { staggerChildren: gap } } }}
    >
      {children}
    </Comp>
  )
}

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 50, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.8, ease } },
}

export function StaggerItem({ children, className, as = 'div' }: { children: ReactNode; className?: string; as?: 'div' | 'li' }) {
  const Comp = as === 'li' ? motion.li : motion.div
  return (
    <Comp className={className} variants={itemVariants}>
      {children}
    </Comp>
  )
}

/** Фото «раскрывается» шторкой снизу вверх */
export function ImageReveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { clipPath: 'inset(100% 0% 0% 0%)' }}
      whileInView={{ clipPath: 'inset(0% 0% 0% 0%)' }}
      viewport={VIEW}
      transition={{ duration: 1.2, delay, ease }}
    >
      {children}
    </motion.div>
  )
}
