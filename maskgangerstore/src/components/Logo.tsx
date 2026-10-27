/** Типографический логотип: MASK в красной плашке + GANGER + моноширинное STORE */
export function Logo({ className = '', invert = false }: { className?: string; invert?: boolean }) {
  return (
    <span className={`inline-flex items-center leading-none select-none ${className}`}>
      <span className="bg-accent px-1.5 py-1 font-display text-[13px] font-black tracking-[-0.02em] text-white sm:text-[15px]">MASK</span>
      <span className={`pl-1 font-display text-[13px] font-black tracking-[-0.02em] sm:text-[15px] ${invert ? 'text-white' : 'text-ink'}`}>GANGER</span>
      <span className={`ml-1.5 self-end font-mono text-[10px] font-bold tracking-[0.18em] ${invert ? 'text-white/60' : 'text-mute'}`}>STORE</span>
    </span>
  )
}
