import { ArrowRight } from 'lucide-react'
import { images } from '../data/products'
import { SmartImage } from './SmartImage'
import { Reveal } from './Reveal'
import { scrollToId } from '../lib/scroll'

const PRINCIPLES = [
  { k: 'Comfort', v: 'Cuts and fabrics made for all-day wear.' },
  { k: 'Character', v: 'Clean pieces with a sharper edge.' },
  { k: 'Style', v: 'Your rotation, your rules.' },
]

export function About() {
  return (
    <section id="about" aria-labelledby="about-title" className="scroll-mt-16 border-t border-line">
      <div className="mx-auto grid max-w-[1600px] lg:grid-cols-2">
        <div className="grain relative aspect-[4/5] overflow-hidden bg-card sm:aspect-[16/11] lg:aspect-auto lg:min-h-[44rem]">
          <SmartImage
            src={images.about}
            alt="Black and white photo of a person walking along an empty concrete road"
            fallbackLabel="Editorial image"
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover grayscale"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-bg/60 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-bg/30" />
          <span className="label absolute bottom-4 left-4 text-ink/80 sm:left-6 lg:left-10">Fig. 02 — Less noise</span>
        </div>

        <div className="flex flex-col justify-center px-4 py-16 sm:px-6 sm:py-24 lg:px-16 xl:px-24">
          <Reveal>
            <p className="label mb-6 text-mute">
              <span className="text-accent">04</span> — About
            </p>
            <h2 id="about-title" className="font-wide text-[clamp(2.2rem,5.4vw,4.75rem)] leading-[0.9] font-black tracking-[-0.035em] uppercase">
              Less noise.
              <br />
              <span className="text-ink/40">More</span> attitude<span className="text-accent">.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-8 max-w-lg text-lg leading-relaxed text-ink/80">
              MASKGANGERSTORE — a curated selection of everyday streetwear, built around comfort, character and personal style.
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <ul className="mt-10 grid grid-cols-1 border-t border-line sm:grid-cols-3">
              {PRINCIPLES.map((p, i) => (
                <li key={p.k} className="border-b border-line py-4 sm:border-b-0 sm:py-5 sm:pr-4 sm:not-first:border-l sm:not-first:pl-4">
                  <p className="label text-mute">0{i + 1}</p>
                  <p className="mt-2 font-bold tracking-wide uppercase">{p.k}</p>
                  <p className="mt-1 text-sm text-mute">{p.v}</p>
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.2}>
            <button
              onClick={() => scrollToId('shop')}
              className="group mt-10 inline-flex h-14 items-center gap-6 border border-ink px-6 text-[13px] font-bold tracking-[0.14em] uppercase transition-colors hover:bg-ink hover:text-bg active:scale-[0.98]"
            >
              Explore the collection
              <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
            </button>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
