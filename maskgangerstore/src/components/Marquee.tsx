const WORDS = ['MASKGANGERSTORE', 'URBAN ESSENTIALS', 'NEW SEASON', 'BUILT DIFFERENT']

function Row() {
  return (
    <div className="flex shrink-0 items-center">
      {WORDS.map((w) => (
        <span key={w} className="flex items-center">
          <span className="px-6 font-wide text-sm font-extrabold tracking-[0.06em] sm:text-base">{w}</span>
          <span className="h-px w-8 bg-accent" />
        </span>
      ))}
    </div>
  )
}

/** Бегущая строка. Две одинаковые половины — сдвиг на -50% даёт бесшовный цикл */
export function Marquee() {
  return (
    <div className="relative overflow-hidden border-y border-line bg-bg2 py-4" role="marquee" aria-label={WORDS.join(' — ')}>
      <div className="marquee-track flex w-max" aria-hidden>
        <Row />
        <Row />
        <Row />
        <Row />
      </div>
    </div>
  )
}
