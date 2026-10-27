/** Типографический логотип: широкий гротеск + моноширинная приписка STORE и красная метка */
export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-baseline gap-1.5 leading-none select-none ${className}`}>
      <span className="font-wide text-[15px] font-black tracking-[-0.02em] sm:text-[17px]">MASKGANGER</span>
      <span className="relative font-mono text-[10px] font-medium tracking-[0.2em] text-mute sm:text-[11px]">
        STORE
        <span aria-hidden className="absolute -top-1.5 -right-2 size-1.5 bg-accent" />
      </span>
    </span>
  )
}
