import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { ArrowDownUp, X, SearchX } from 'lucide-react'
import { products, categoryLabels } from '../data/products'
import type { Category } from '../types/product'
import { ProductGrid } from './ProductGrid'
import { SectionHeading } from './SectionHeading'
import { plural } from '../lib/plural'

export type SortMode = 'featured' | 'price-asc' | 'price-desc'
export interface CatalogFilters {
  category: Category | 'all'
  sort: SortMode
  query: string
}

const CATS: (Category | 'all')[] = ['all', 'hoodies', 't-shirts', 'shorts', 'sneakers', 'jackets', 'accessories']
const SORTS: { id: SortMode; label: string }[] = [
  { id: 'featured', label: 'Популярные' },
  { id: 'price-asc', label: 'Сначала дешевле' },
  { id: 'price-desc', label: 'Сначала дороже' },
]
const spring = { type: 'spring', stiffness: 420, damping: 34 } as const

export function filterProducts({ category, sort, query }: CatalogFilters) {
  const q = query.trim().toLowerCase()
  const list = products.filter(
    (p) =>
      (category === 'all' || p.category === category) &&
      (!q || p.name.toLowerCase().includes(q) || categoryLabels[p.category].toLowerCase().includes(q) || p.description.toLowerCase().includes(q)),
  )
  if (sort === 'price-asc') return [...list].sort((a, b) => a.price - b.price)
  if (sort === 'price-desc') return [...list].sort((a, b) => b.price - a.price)
  return list
}

export function Catalog({
  filters,
  onChange,
  onOpen,
}: {
  filters: CatalogFilters
  onChange: (f: CatalogFilters) => void
  onOpen: (id: string) => void
}) {
  const list = useMemo(() => filterProducts(filters), [filters])
  const counts = useMemo(() => {
    const m: Record<string, number> = { all: products.length }
    products.forEach((p) => (m[p.category] = (m[p.category] ?? 0) + 1))
    return m
  }, [])

  const set = (patch: Partial<CatalogFilters>) => onChange({ ...filters, ...patch })
  const currentSort = SORTS.find((s) => s.id === filters.sort)!
  const cycleSort = () => {
    const i = SORTS.findIndex((s) => s.id === filters.sort)
    set({ sort: SORTS[(i + 1) % SORTS.length].id })
  }

  return (
    <section id="shop" aria-labelledby="shop-title" className="scroll-mt-16 bg-white">
      <div className="mx-auto max-w-[1600px] px-4 py-20 sm:px-6 sm:py-28 lg:px-10">
        <SectionHeading
          id="shop-title"
          index="03"
          caption="Фильтруйте по категориям и сортируйте по цене"
          title="Весь каталог"
          action={
            <p className="font-display text-lg font-extrabold" aria-live="polite">
              <span className="text-accent">{list.length}</span> {plural(list.length, ['товар', 'товара', 'товаров'])}
            </p>
          }
        />

        {/* Панель фильтров */}
        <div className="z-20 -mx-4 mb-10 bg-white/95 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6 lg:sticky lg:top-[72px] lg:-mx-10 lg:px-10">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div role="group" aria-label="Категории" className="flex flex-wrap gap-2">
              {CATS.map((c) => {
                const on = filters.category === c
                return (
                  <button
                    key={c}
                    onClick={() => set({ category: c })}
                    aria-pressed={on}
                    className={`relative flex h-11 items-center gap-2 border-2 px-4 text-[14px] font-bold transition-colors duration-200 ${
                      on ? 'border-accent text-white' : 'border-ink/12 text-ink hover:border-ink'
                    }`}
                  >
                    {on && <motion.span layoutId="cat-pill" className="absolute -inset-[2px] bg-accent" transition={spring} />}
                    <span className="relative">{c === 'all' ? 'Все' : categoryLabels[c]}</span>
                    <span className={`relative font-mono text-[12px] ${on ? 'text-white/85' : 'text-mute'}`}>{counts[c] ?? 0}</span>
                  </button>
                )
              })}
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden text-sm font-semibold text-mute sm:inline">Сортировка:</span>
              <div className="hidden bg-paper p-1 sm:flex" role="group" aria-label="Сортировка">
                {SORTS.map((s) => {
                  const on = filters.sort === s.id
                  return (
                    <button
                      key={s.id}
                      onClick={() => set({ sort: s.id })}
                      aria-pressed={on}
                      className={`relative h-9 px-3.5 text-[14px] font-bold transition-colors ${on ? 'text-white' : 'text-ink/70 hover:text-ink'}`}
                    >
                      {on && <motion.span layoutId="sort-pill" className="absolute inset-0 bg-ink" transition={spring} />}
                      <span className="relative">{s.label}</span>
                    </button>
                  )
                })}
              </div>
              <button
                onClick={cycleSort}
                className="flex h-11 flex-1 items-center justify-center gap-2 bg-paper px-4 text-[14px] font-bold sm:hidden"
                aria-label={`Сортировка: ${currentSort.label}. Нажмите, чтобы изменить`}
              >
                <ArrowDownUp size={16} className="text-accent" />
                {currentSort.label}
              </button>
            </div>
          </div>

          {filters.query && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-sm font-semibold text-mute">Поиск:</span>
              <button
                onClick={() => set({ query: '' })}
                className="inline-flex h-8 items-center gap-1.5 bg-ink px-3 text-sm font-semibold text-white hover:bg-accent"
                aria-label={`Сбросить поиск «${filters.query}»`}
              >
                «{filters.query}» <X size={14} />
              </button>
            </div>
          )}
        </div>

        {list.length > 0 ? (
          <ProductGrid products={list} onOpen={onOpen} />
        ) : (
          <div className="flex flex-col items-center bg-paper px-6 py-20 text-center">
            <span className="grid size-16 place-items-center bg-accent text-white">
              <SearchX size={28} />
            </span>
            <p className="mt-6 font-display text-2xl font-black uppercase">Ничего не нашлось</p>
            <p className="mt-2 max-w-sm text-base text-mute">Попробуйте другую категорию или измените запрос.</p>
            <button
              onClick={() => onChange({ category: 'all', sort: 'featured', query: '' })}
              className="btn-fill mt-6 h-12 bg-ink px-6 text-[14px] font-extrabold tracking-wide text-white uppercase [--fill:var(--color-accent)]"
            >
              Сбросить фильтры
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
