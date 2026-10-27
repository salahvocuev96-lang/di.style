import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import type { Product } from '../types/product'
import { ProductCard } from './ProductCard'

export function ProductGrid({ products, onOpen }: { products: Product[]; onOpen: (id: string) => void }) {
  const reduce = useReducedMotion()
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-9 sm:gap-x-4 sm:gap-y-12 md:grid-cols-3 xl:grid-cols-4">
      <AnimatePresence mode="popLayout" initial={false}>
        {products.map((p, i) => (
          <motion.li
            key={p.id}
            layout={!reduce}
            initial={reduce ? false : { opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '0px 0px -8% 0px' }}
            exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.2 } }}
            transition={{ duration: 0.7, delay: (i % 4) * 0.08, ease: [0.16, 1, 0.3, 1] }}
          >
            <ProductCard product={p} onOpen={onOpen} />
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  )
}
