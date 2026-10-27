import { ArrowRight } from 'lucide-react'
import { products } from '../data/products'
import { ProductCard } from './ProductCard'
import { Stagger, StaggerItem } from './Reveal'
import { SectionHeading } from './SectionHeading'

const fresh = products.filter((p) => p.isNew).slice(0, 4)

export function NewArrivals({ onOpen, onViewAll }: { onOpen: (id: string) => void; onViewAll: () => void }) {
  return (
    <section id="new" aria-labelledby="new-title" className="relative scroll-mt-16 overflow-hidden bg-graphite text-white">
      <span aria-hidden className="dots pointer-events-none absolute top-0 right-0 h-64 w-64 text-white/10 sm:h-96 sm:w-96" />
      <div className="relative mx-auto max-w-[1600px] px-4 py-20 sm:px-6 sm:py-28 lg:px-10">
        <SectionHeading
          id="new-title"
          index="02"
          dark
          caption="Свежие вещи для ежедневной ротации"
          title="Новинки"
          action={
            <button
              onClick={onViewAll}
              className="btn-fill group flex h-14 items-center justify-between gap-6 self-start bg-white px-6 text-[14px] font-extrabold tracking-[0.04em] text-ink uppercase transition-colors [--fill:var(--color-accent)] hover:text-white lg:self-auto"
            >
              Все товары
              <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1.5" />
            </button>
          }
        />
        {/* Телефон: горизонтальная лента; компьютер: 4 колонки */}
        <Stagger
          as="ul"
          className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:gap-4 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0"
        >
          {fresh.map((p) => (
            <StaggerItem as="li" key={p.id} className="w-[72%] shrink-0 snap-start sm:w-[44%] lg:w-auto">
              <ProductCard product={p} onOpen={onOpen} dark />
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  )
}
