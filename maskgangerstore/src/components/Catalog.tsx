import { useMemo } from 'react'
import { ArrowDownUp, X } from 'lucide-react'
import { products, categoryLabels } from '../data/products'
import type { Category } from '../types/product'
import { ProductGrid } from './ProductGrid'
import { Reveal } from './Reveal'
import { SectionHeading } from './SectionHeading'

export type SortMode = 'featured' | 'price-asc' | 'price-desc'
export interface CatalogFilters {
  category: Category | 'all'
  sort: SortMode
  query: string
}

const CATS: (Category | 'all')[] = ['all', 'hoodies', 't-shirts', 'shorts', 'sneakers', 'jackets', 'accessories']
const SORTS: { id: SortMode; label: string }[] = [
  { id: 'featured', label: 'Featured' },
  { id: 'price-asc', label: 'Price: low → high' },
  { id: 'price-desc', label: 'Price: high → low' },
]

export function filterProducts({ category, sort, query }: CatalogFilters) {
  const q = query.trim().toLowerCase()
  const list = products.filter(
    (p) =>
      (category === 'all' || p.category === category) &&
      (!q || p.name.toLowerCase().includes(q) || categoryLabels[p.category].toLowerCase().includes(q)),
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
  const cycleSort = () => {
    const i = SORTS.findIndex((s) => s.id === filters.sort)
    set({ sort: SORTS[(i + 1) % SORTS.length].id })
  }

  return (
    <section id="shop" aria-labelledby="shop-title" className="scroll-mt-16 border-t border-line bg-bg2">
      <div className="mx-auto max-w-[1600px] px-4 py-20 sm:px-6 sm:py-28 lg:px-10">
        <Reveal>
          <div id="shop-title">
            <SectionHeading index="03" caption="Full catalogue" title="Shop all" />
          </div>
        </Reveal>

        {/* Панель фильтров */}
        <div className="z-20 -mx-4 mb-8 border-b border-line bg-bg2/90 lg:sticky lg:top-16 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div role="group" aria-label="Filter by category" className="flex flex-wrap gap-1.5">
              {CATS.map((c) => {
                const on = filters.category === c
                return (
                  <button
                    key={c}
                    onClick={() => set({ category: c })}
                    aria-pressed={on}
                    className={`h-9 border px-3 text-[11px] font-semibold tracking-[0.12em] uppercase transition-colors duration-200 ${
                      on ? 'border-ink bg-ink text-bg' : 'border-line text-ink/70 hover:border-ink/50 hover:text-ink'
                    }`}
                  >
                    {c === 'all' ? 'All' : categoryLabels[c]}
                    <sup className={`ml-1 font-mono text-[9px] ${on ? 'text-accent' : 'text-mute'}`}>{counts[c] ?? 0}</sup>
                  </button>
                )
              })}
            </div>

            <div className="flex items-center justify-between gap-4 lg:justify-end">
              <p className="label text-mute" aria-live="polite">
                <span className="text-ink">{list.length}</span> {list.length === 1 ? 'product' : 'products'}
              </p>
              <div className="hidden items-center border border-line sm:flex" role="group" aria-label="Sort products">
                {SORTS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => set({ sort: s.id })}
                    aria-pressed={filters.sort === s.id}
                    className={`h-9 px-3 text-[11px] font-semibold tracking-[0.08em] uppercase transition-colors ${
                      filters.sort === s.id ? 'bg-card text-ink shadow-[inset_0_-2px_0_var(--color-accent)]' : 'text-ink/60 hover:text-ink'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <button
                onClick={cycleSort}
                className="flex h-9 items-center gap-2 border border-line px-3 text-[11px] font-semibold tracking-[0.08em] uppercase sm:hidden"
                aria-label={`Sort: ${SORTS.find((s) => s.id === filters.sort)?.label}. Tap to change`}
              >
                <ArrowDownUp size={14} className="text-accent" />
                {SORTS.find((s) => s.id === filters.sort)?.label}
              </button>
            </div>
          </div>

          {filters.query && (
            <div className="mt-3 flex items-center gap-2">
              <span className="label text-mute">Search:</span>
              <button
                onClick={() => set({ query: '' })}
                className="inline-flex h-7 items-center gap-1.5 border border-accent/60 px-2 font-mono text-[11px] hover:bg-accent/10"
                aria-label={`Clear search "${filters.query}"`}
              >
                “{filters.query}” <X size={12} />
              </button>
            </div>
          )}
        </div>

        {list.length > 0 ? (
          <ProductGrid products={list} onOpen={onOpen} />
        ) : (
          <div className="flex flex-col items-center border border-dashed border-line px-6 py-20 text-center">
            <p className="font-wide text-2xl font-black uppercase">Nothing here yet</p>
            <p className="mt-2 max-w-sm text-mute">No products match these filters. Try another category or clear your search.</p>
            <button
              onClick={() => onChange({ category: 'all', sort: 'featured', query: '' })}
              className="mt-6 h-11 border border-ink px-5 text-[12px] font-bold tracking-[0.14em] uppercase transition-colors hover:bg-ink hover:text-bg"
            >
              Reset filters
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
