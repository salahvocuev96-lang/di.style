import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import type { Product } from '../types/product'
import { ProductCard } from './ProductCard'

const COLS = {
  catalog: 'md:grid-cols-3 xl:grid-cols-4',
  // ровно 4 товара: 2 колонки до lg, чтобы на планшете не оставалось «висящей» карточки
  four: 'lg:grid-cols-4',
}

export function ProductGrid({
  products,
  onOpen,
  eagerCount = 0,
  layout = 'catalog',
}: {
  products: Product[]
  onOpen: (id: string) => void
  eagerCount?: number
  layout?: keyof typeof COLS
}) {
  const reduce = useReducedMotion()
  return (
    <ul className={`grid grid-cols-2 gap-x-2 gap-y-8 sm:gap-x-3 sm:gap-y-10 ${COLS[layout]}`}>
      <AnimatePresence mode="popLayout" initial={false}>
        {products.map((p, i) => (
          <motion.li
            key={p.id}
            layout={!reduce}
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.18 } }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            <ProductCard product={p} onOpen={onOpen} eager={i < eagerCount} />
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  )
}
