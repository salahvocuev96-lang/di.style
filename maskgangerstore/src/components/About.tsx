import { ArrowRight } from 'lucide-react'
import { images } from '../data/products'
import { SmartImage } from './SmartImage'
import { ImageReveal, Reveal, Stagger, StaggerItem } from './Reveal'
import { scrollToId } from '../lib/scroll'

const PRINCIPLES = [
  { k: 'Комфорт', v: 'Крой и ткани, в которых удобно весь день.' },
  { k: 'Характер', v: 'Простые вещи с выразительными деталями.' },
  { k: 'Стиль', v: 'Собирайте образы по своим правилам.' },
]

export function About() {
  return (
    <section id="about" aria-labelledby="about-title" className="scroll-mt-16 bg-ink text-white">
      <div className="mx-auto grid max-w-[1600px] lg:grid-cols-2">
        <ImageReveal className="relative aspect-[4/5] overflow-hidden bg-graphite sm:aspect-[16/11] lg:aspect-auto lg:min-h-[46rem]">
          <SmartImage
            src={images.about}
            alt="Чёрно-белое фото: человек идёт по пустой бетонной дороге"
            art="hoodies"
            dark
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover grayscale"
          />
          <span className="absolute bottom-0 left-0 bg-accent px-4 py-3 font-display text-sm font-extrabold uppercase">MASKGANGERSTORE</span>
        </ImageReveal>

        <div className="flex flex-col justify-center px-4 py-16 sm:px-6 sm:py-24 lg:px-16 xl:px-24">
          <Reveal>
            <p className="mb-6 flex items-center gap-3">
              <span className="bg-accent px-2 py-1 font-mono text-sm font-bold">04</span>
              <span className="text-base font-semibold text-white/80">О магазине</span>
            </p>
            <h2 id="about-title" className="font-display text-[clamp(2.2rem,5vw,4.6rem)] leading-[0.95] font-black tracking-[-0.04em] uppercase">
              Меньше шума.
              <br />
              <span className="text-accent">Больше</span> характера.
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-white/90 sm:text-xl">
              MASKGANGERSTORE — подборка уличной одежды на каждый день. Мы выбираем вещи, в которых удобно, которые легко сочетать и которые помогают
              выразить свой стиль.
            </p>
          </Reveal>
          <Stagger as="ul" className="mt-10 grid gap-3 sm:grid-cols-3">
            {PRINCIPLES.map((p) => (
              <StaggerItem as="li" key={p.k} className="group border-l-4 border-accent bg-graphite p-5 transition-colors hover:bg-accent">
                <p className="font-display text-lg font-extrabold uppercase">{p.k}</p>
                <p className="mt-2 text-[15px] leading-snug text-white/85 group-hover:text-white">{p.v}</p>
              </StaggerItem>
            ))}
          </Stagger>
          <Reveal delay={0.2}>
            <button
              onClick={() => scrollToId('shop')}
              className="btn-fill group mt-10 inline-flex h-16 items-center gap-6 bg-white px-7 text-[15px] font-extrabold tracking-[0.04em] text-ink uppercase transition-colors [--fill:var(--color-accent)] hover:text-white"
            >
              Смотреть коллекцию
              <ArrowRight size={20} className="transition-transform duration-300 group-hover:translate-x-1.5" />
            </button>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
