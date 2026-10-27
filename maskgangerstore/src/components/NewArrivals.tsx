import { ArrowRight } from 'lucide-react'
import { products } from '../data/products'
import { ProductGrid } from './ProductGrid'
import { Reveal } from './Reveal'
import { SectionHeading } from './SectionHeading'

const fresh = products.filter((p) => p.isNew).slice(0, 4)

export function NewArrivals({ onOpen, onViewAll }: { onOpen: (id: string) => void; onViewAll: () => void }) {
  return (
    <section id="new" aria-labelledby="new-title" className="scroll-mt-16 mx-auto max-w-[1600px] px-4 pb-20 sm:px-6 sm:pb-28 lg:px-10">
      <Reveal>
        <div id="new-title">
          <SectionHeading
            index="02"
            caption="Fresh pieces. Everyday rotation."
            title="New arrivals"
            action={
              <button
                onClick={onViewAll}
                className="group inline-flex h-11 items-center gap-2 self-start border-b border-ink/40 text-[12px] font-semibold tracking-[0.14em] uppercase transition-colors hover:border-accent sm:self-auto"
              >
                View all
                <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            }
          />
        </div>
      </Reveal>
      <Reveal delay={0.1}>
        <ProductGrid products={fresh} onOpen={onOpen} layout="four" />
      </Reveal>
    </section>
  )
}
