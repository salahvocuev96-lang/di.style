import { Plus, ShoppingBag } from 'lucide-react'
import type { Product } from '../types/product'
import { categoryLabels } from '../data/products'
import { formatPrice } from '../lib/format'
import { SmartImage } from './SmartImage'
import { useAddToCart } from '../lib/useAddToCart'

const sizeRange = (sizes: string[]) => (sizes.length === 0 ? 'один размер' : `${sizes[0]}–${sizes[sizes.length - 1]}`)

const BADGE: Record<string, string> = {
  Новинка: 'bg-accent text-white',
  База: 'bg-ink text-white',
}

export function ProductCard({ product, onOpen, dark = false }: { product: Product; onOpen: (id: string) => void; dark?: boolean }) {
  const add = useAddToCart()
  const [main, alt] = product.images
  const hasSizes = product.sizes.length > 0

  return (
    <article className="group relative flex h-full flex-col">
      <div className={`relative aspect-[3/4] overflow-hidden ${dark ? 'bg-coal' : 'bg-paper-2'}`}>
        <button onClick={() => onOpen(product.id)} className="absolute inset-0 z-0 block h-full w-full" aria-label={`Открыть «${product.name}»`}>
          <SmartImage
            src={main}
            alt={product.name}
            art={product.category}
            dark={dark}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-[900ms] ease-out-expo group-hover:scale-[1.08]"
          />
          {alt && (
            <SmartImage
              src={alt}
              alt=""
              aria-hidden
              hideOnError
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover !opacity-0 transition-[opacity,transform] duration-700 ease-out-expo group-hover:scale-[1.08] [@media(hover:hover)]:group-hover:!opacity-100"
            />
          )}
        </button>

        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-2.5 sm:p-3">
          {product.badge ? (
            <span className={`px-2 py-1 text-[12px] font-extrabold tracking-wide uppercase ${BADGE[product.badge] ?? 'bg-white text-ink'}`}>{product.badge}</span>
          ) : (
            <span />
          )}
          {/* цена-плашка появляется при наведении */}
          <span className="hidden translate-y-[-6px] bg-white px-2 py-1 font-display text-[13px] font-extrabold text-ink opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 [@media(hover:hover)]:block">
            {formatPrice(product.price)}
          </span>
        </div>

        {/* Телефон: кнопка всегда видна */}
        <button
          onClick={() => (hasSizes ? onOpen(product.id) : add(product, null))}
          className="absolute right-2 bottom-2 z-10 grid size-11 place-items-center bg-accent text-white shadow-lg transition-transform active:scale-90 [@media(hover:hover)]:hidden"
          aria-label={hasSizes ? `Выбрать размер: ${product.name}` : `В корзину: ${product.name}`}
        >
          <Plus size={20} strokeWidth={2.5} />
        </button>

        {/* Компьютер: панель быстрого добавления выезжает снизу */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 hidden translate-y-full transition-transform duration-500 ease-out-expo group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-hover:pointer-events-auto group-hover:translate-y-0 [@media(hover:hover)]:block">
          <div className="border-t-4 border-accent bg-white p-3 text-ink">
            {hasSizes ? (
              <>
                <p className="mb-2 text-[13px] font-bold">Быстро добавить — выберите размер</p>
                <div className="flex flex-wrap gap-1.5">
                  {product.sizes.map((s) => (
                    <button
                      key={s}
                      onClick={() => add(product, s)}
                      className="h-9 min-w-10 flex-1 border-2 border-ink/15 px-2 font-mono text-[13px] font-bold transition-colors hover:border-accent hover:bg-accent hover:text-white"
                      aria-label={`В корзину: ${product.name}, размер ${s}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <button
                onClick={() => add(product, null)}
                className="btn-fill flex h-10 w-full items-center justify-center gap-2 bg-accent text-[13px] font-extrabold tracking-wide text-white uppercase"
              >
                <ShoppingBag size={16} /> В корзину
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-1 items-start justify-between gap-3 pt-3.5">
        <div className="min-w-0">
          <h3 className="text-[15px] leading-snug font-bold sm:text-base">
            <button onClick={() => onOpen(product.id)} className="text-left transition-colors hover:text-accent">
              {product.name}
            </button>
          </h3>
          <p className={`mt-1 text-sm font-medium ${dark ? 'text-white/65' : 'text-mute'}`}>
            {categoryLabels[product.category]} · {sizeRange(product.sizes)}
          </p>
        </div>
        <p className="shrink-0 font-display text-[15px] font-extrabold sm:text-lg">{formatPrice(product.price)}</p>
      </div>
    </article>
  )
}
