const A = ['MASKGANGERSTORE', 'Drop 001', 'Твой стиль — твои правила', 'Городская форма']
const B = ['Худи', 'Футболки', 'Шорты', 'Кроссовки', 'Куртки', 'Аксессуары']

function Row({ words, star }: { words: string[]; star: string }) {
  return (
    <div className="flex shrink-0 items-center">
      {words.map((w) => (
        <span key={w} className="flex items-center">
          <span className="px-5 font-display text-lg font-extrabold whitespace-nowrap uppercase sm:px-7 sm:text-2xl">{w}</span>
          <span className={star} aria-hidden>
            ✕
          </span>
        </span>
      ))}
    </div>
  )
}

/** Две перекрещённые ленты. Четыре копии строки + сдвиг на -50% дают бесшовный цикл */
export function Marquee() {
  return (
    <div className="relative overflow-hidden bg-paper py-10 sm:py-14" role="marquee" aria-label={A.join(', ')}>
      <div className="relative z-10 -mx-4 -rotate-2 bg-accent py-3 text-white shadow-[0_10px_30px_-10px_rgba(227,27,35,0.6)] sm:py-4">
        <div className="marquee-track flex w-max" style={{ ['--speed' as string]: '34s' }} aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <Row key={i} words={A} star="text-sm text-white/70" />
          ))}
        </div>
      </div>
      <div className="absolute inset-x-0 top-1/2 -mx-4 -translate-y-1/2 rotate-[1.6deg] bg-ink py-3 text-paper sm:py-4">
        <div className="marquee-track marquee-reverse flex w-max" style={{ ['--speed' as string]: '44s' }} aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <Row key={i} words={B} star="text-sm text-accent" />
          ))}
        </div>
      </div>
    </div>
  )
}
