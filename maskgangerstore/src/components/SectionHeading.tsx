import type { ReactNode } from 'react'

export function SectionHeading({ index, title, caption, action }: { index: string; title: string; caption?: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 border-b border-line pb-6 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="label mb-3 text-mute">
          <span className="text-accent">{index}</span> — {caption}
        </p>
        <h2 className="font-wide text-[clamp(2rem,6vw,4.25rem)] leading-[0.9] font-black tracking-[-0.03em] uppercase">{title}</h2>
      </div>
      {action}
    </div>
  )
}
