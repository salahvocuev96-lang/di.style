import { ArrowUpRight } from 'lucide-react'
import { categories } from '../data/products'
import type { Category } from '../types/product'
import { SmartImage } from './SmartImage'
import { Reveal } from './Reveal'
import { SectionHeading } from './SectionHeading'

export function CategoryGrid({ onSelect }: { onSelect: (c: Category) => void }) {
  return (
    <section aria-labelledby="cat-title" className="mx-auto max-w-[1600px] px-4 py-20 sm:px-6 sm:py-28 lg:px-10">
      <Reveal>
        <div id="cat-title">
          <SectionHeading index="01" caption="Shop by category" title="The rotation" />
        </div>
      </Reveal>
      <ul className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        {categories.map((c, i) => (
          <li key={c.id} className={i % 2 === 1 ? 'lg:mt-16' : ''}>
            <Reveal delay={i * 0.08}>
              <button
                onClick={() => onSelect(c.id)}
                className="group relative block aspect-[3/4] w-full overflow-hidden bg-card text-left"
                aria-label={`Shop ${c.label}`}
              >
                <SmartImage
                  src={c.image}
                  alt=""
                  fallbackLabel={c.label}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover grayscale-[25%] transition-transform duration-[1.2s] ease-out-expo group-hover:scale-[1.06]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                <span className="label absolute top-3 left-3 text-ink/80 sm:top-4 sm:left-4">0{i + 1}</span>
                <span className="absolute top-3 right-3 grid size-9 place-items-center border border-white/25 bg-black/20 backdrop-blur-sm transition-colors duration-300 group-hover:border-accent group-hover:bg-accent sm:top-4 sm:right-4">
                  <ArrowUpRight size={16} className="transition-transform duration-300 group-hover:rotate-45" />
                </span>
                <span className="absolute inset-x-3 bottom-3 sm:inset-x-5 sm:bottom-5">
                  <span className="block font-wide text-[clamp(1.1rem,3.6vw,2rem)] leading-none font-black uppercase">{c.label}</span>
                  <span className="mt-2 hidden text-sm text-ink/70 sm:block">{c.caption}</span>
                  <span className="mt-3 block h-px w-0 bg-accent transition-all duration-500 ease-out-expo group-hover:w-16" />
                </span>
              </button>
            </Reveal>
          </li>
        ))}
      </ul>
    </section>
  )
}
