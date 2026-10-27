import { Plus } from 'lucide-react'
import type { Product } from '../types/product'
import { categoryLabels } from '../data/products'
import { formatPrice } from '../lib/format'
import { SmartImage } from './SmartImage'
import { useAddToCart } from '../lib/useAddToCart'

const sizeRange = (sizes: string[]) => (sizes.length === 0 ? 'One size' : sizes.length === 1 ? sizes[0] : `${sizes[0]}–${sizes[sizes.length - 1]}`)

export function ProductCard({ product, onOpen, eager = false }: { product: Product; onOpen: (id: string) => void; eager?: boolean }) {
  const add = useAddToCart()
  const [main, alt] = product.images
  const hasSizes = product.sizes.length > 0

  return (
    <article className="group relative flex flex-col">
      <div className="relative aspect-[4/5] overflow-hidden bg-card">
        <button onClick={() => onOpen(product.id)} className="absolute inset-0 z-0 block h-full w-full" aria-label={`View ${product.name}`}>
          <SmartImage
            src={main}
            alt={product.name}
            fallbackLabel={categoryLabels[product.category]}
            loading={eager ? 'eager' : 'lazy'}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-[900ms] ease-out-expo group-hover:scale-[1.05]"
          />
          {alt && (
            <SmartImage
              src={alt}
              alt=""
              aria-hidden
              hideOnError
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover !opacity-0 transition-[opacity,transform] duration-700 ease-out-expo [@media(hover:hover)]:group-hover:!opacity-100 group-hover:scale-[1.05]"
            />
          )}
        </button>

        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-2.5 sm:p-3">
          {product.badge ? (
            <span
              className={`label px-2 py-1 text-[10px] ${product.badge === 'New' ? 'bg-ink text-bg' : 'border border-white/20 bg-black/40 text-ink backdrop-blur-sm'}`}
            >
              {product.badge}
            </span>
          ) : (
            <span />
          )}
        </div>

        {/* Мобильные: кнопка всегда видна */}
        <button
          onClick={() => (hasSizes ? onOpen(product.id) : add(product, null))}
          className="absolute right-2 bottom-2 z-10 grid size-10 place-items-center bg-ink text-bg transition-colors active:bg-accent active:text-ink [@media(hover:hover)]:hidden"
          aria-label={hasSizes ? `Choose size for ${product.name}` : `Add ${product.name} to cart`}
        >
          <Plus size={18} strokeWidth={2.25} />
        </button>

        {/* Десктоп: быстрый выбор размера при наведении */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 hidden translate-y-3 p-2.5 opacity-0 group-hover:pointer-events-auto group-focus-within:pointer-events-auto transition-all duration-300 ease-out-expo group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100 [@media(hover:hover)]:block">
          <div className="border border-line bg-bg/90 p-2 backdrop-blur-md">
            <p className="label mb-2 px-1 text-[10px] text-mute">{hasSizes ? 'Quick add — select size' : 'Quick add'}</p>
            {hasSizes ? (
              <div className="flex flex-wrap gap-1">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => add(product, s)}
                    className="h-8 min-w-9 flex-1 border border-line px-2 font-mono text-[11px] transition-colors hover:border-ink hover:bg-ink hover:text-bg"
                    aria-label={`Add ${product.name}, size ${s}, to cart`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            ) : (
              <button
                onClick={() => add(product, null)}
                className="h-8 w-full bg-ink text-[11px] font-bold tracking-[0.14em] text-bg uppercase transition-colors hover:bg-accent hover:text-ink"
              >
                Add to cart
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-start justify-between gap-3 pt-3">
        <div className="min-w-0">
          <h3 className="text-[13px] leading-snug font-semibold tracking-wide uppercase sm:text-sm">
            <button onClick={() => onOpen(product.id)} className="text-left transition-colors hover:text-ink/70">
              {product.name}
            </button>
          </h3>
          <p className="label mt-1 text-[10px] text-mute">
            {categoryLabels[product.category]} · {sizeRange(product.sizes)}
          </p>
        </div>
        <p className="shrink-0 font-mono text-[13px] sm:text-sm">{formatPrice(product.price)}</p>
      </div>
    </article>
  )
}
