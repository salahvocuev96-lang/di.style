import type { ReactElement } from 'react'
import type { Category } from '../types/product'

/** Упрощённые силуэты вещей — показываются, если фото не загрузилось */
const SHAPES: Record<Category, ReactElement> = {
  't-shirts': (
    <>
      <path d="M70 40 L55 45 L25 70 L40 94 L58 84 L58 166 L142 166 L142 84 L160 94 L175 70 L145 45 L130 40 Q100 60 70 40 Z" />
      <path d="M84 95 h32 v6 h-32z" className="art-accent" />
    </>
  ),
  hoodies: (
    <>
      <path d="M72 52 L52 58 L28 122 L46 130 L62 94 L62 170 L138 170 L138 94 L154 130 L172 122 L148 58 L128 52 Z" />
      <path d="M72 54 Q68 20 100 18 Q132 20 128 54 Q100 70 72 54Z" />
      <path d="M86 50 Q88 34 100 33 Q112 34 114 50 Q100 57 86 50Z" className="art-hole" />
      <path d="M76 132 L124 132 L130 152 L70 152Z" className="art-line" />
      <path d="M93 58 v28 M107 58 v28" className="art-cord" />
    </>
  ),
  jackets: (
    <>
      <path d="M72 46 L50 54 L26 126 L45 134 L62 94 L62 172 L138 172 L138 94 L155 134 L174 126 L150 54 L128 46 Z" />
      <path d="M74 46 L100 74 L126 46 L120 32 L80 32Z" className="art-hole" />
      <path d="M100 74 V172" className="art-line" />
      <path d="M70 118 h20 M110 118 h20" className="art-line" />
      <path d="M62 150 h76 v6 h-76z" className="art-accent" />
    </>
  ),
  shorts: (
    <>
      <path d="M56 52 L144 52 L154 154 L108 154 L100 96 L92 154 L46 154 Z" />
      <path d="M56 52 h88 v12 h-88z" className="art-hole" />
      <path d="M58 100 h22 v26 h-22z M120 100 h22 v26 h-22z" className="art-line" />
      <path d="M146 120 l6 0 l2 22 l-6 0z" className="art-accent" />
    </>
  ),
  sneakers: (
    <>
      <path d="M20 128 Q22 104 46 98 L80 88 Q94 68 110 70 L126 72 Q138 92 162 100 Q184 106 184 126 L184 138 L20 138 Z" />
      <path d="M16 136 L188 136 L188 148 Q100 156 16 148Z" className="art-hole" />
      <path d="M90 84 l14 10 M98 78 l14 10 M106 73 l14 10" className="art-line" />
      <path d="M128 104 Q150 108 166 120" className="art-accent-stroke" />
    </>
  ),
  accessories: (
    <>
      <path d="M52 96 Q100 6 148 96" className="art-strap" />
      <path d="M40 92 h120 v74 h-120z" />
      <path d="M52 108 h96 v24 h-96z" className="art-line" />
      <path d="M40 150 h120 v6 h-120z" className="art-accent" />
    </>
  ),
}

export function GarmentArt({ category, className = '' }: { category: Category; className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={`garment-art ${className}`} aria-hidden>
      {SHAPES[category]}
    </svg>
  )
}
