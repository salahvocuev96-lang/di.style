import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { X, Minus, Plus, Trash2, Send, Copy, ArrowRight, AlertTriangle, ShoppingBag } from 'lucide-react'
import { useCart, MAX_QTY, type CartLine } from '../context/CartContext'
import { useModal } from '../lib/useModal'
import { formatPrice } from '../lib/format'
import { buildOrderMessage, buildTelegramUrl } from '../lib/telegram'
import { storeConfig } from '../config/store'
import { SmartImage } from './SmartImage'
import { useToast } from './Toast'

const ease = [0.16, 1, 0.3, 1] as const

export function CartDrawer({ onOpenProduct, onShop }: { onOpenProduct: (id: string) => void; onShop: () => void }) {
  const { isOpen, closeCart } = useCart()
  return <AnimatePresence>{isOpen && <Drawer onClose={closeCart} onOpenProduct={onOpenProduct} onShop={onShop} />}</AnimatePresence>
}

function Drawer({ onClose, onOpenProduct, onShop }: { onClose: () => void; onOpenProduct: (id: string) => void; onShop: () => void }) {
  const reduce = useReducedMotion()
  const ref = useModal<HTMLDivElement>(true, onClose)
  const { lines, count, subtotal } = useCart()
  const toast = useToast()
  const [contact, setContact] = useState('')
  const [status, setStatus] = useState<'idle' | 'not-configured' | 'opened'>('idle')

  const message = buildOrderMessage(lines, subtotal, contact)

  const telegramUrl = buildTelegramUrl(message)
  const orderClass =
    'btn-fill group mt-3 flex h-16 w-full items-center justify-center gap-3 bg-accent text-[15px] font-extrabold tracking-[0.04em] text-white uppercase shadow-[0_14px_30px_-12px_rgba(227,27,35,0.7)] active:scale-[0.99]'

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message)
      toast({ kind: 'success', title: 'Текст заказа скопирован', text: 'Вставьте его в чат с продавцом в Telegram.' })
    } catch {
      toast({ kind: 'error', title: 'Не удалось скопировать', text: 'Браузер запретил доступ к буферу обмена.' })
    }
  }

  return (
    <motion.div className="fixed inset-0 z-[70] flex justify-end" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.25 } }}>
      <div className="absolute inset-0 bg-ink/60 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <motion.aside
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
        tabIndex={-1}
        className="relative flex h-full w-full max-w-[480px] flex-col bg-white outline-none"
        initial={reduce ? false : { x: '100%' }}
        animate={{ x: 0 }}
        exit={reduce ? { opacity: 0 } : { x: '100%', transition: { duration: 0.3, ease } }}
        transition={{ duration: 0.55, ease }}
      >
        <header className="flex h-[72px] shrink-0 items-center justify-between bg-ink px-4 text-white sm:px-6">
          <h2 id="cart-title" className="flex items-center gap-3 font-display text-lg font-black uppercase">
            Ваша корзина
            <motion.span key={count} initial={reduce ? false : { scale: 1.6 }} animate={{ scale: 1 }} className="grid h-7 min-w-7 place-items-center rounded-full bg-accent px-2 font-mono text-sm">
              {count}
            </motion.span>
          </h2>
          <button onClick={onClose} data-autofocus aria-label="Закрыть корзину" className="-mr-2 grid size-11 place-items-center transition-colors hover:text-accent">
            <X size={24} />
          </button>
        </header>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <motion.div
              className="relative mb-8 grid size-28 place-items-center bg-paper"
              initial={reduce ? false : { rotate: -8, scale: 0.8, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.2 }}
            >
              <ShoppingBag size={40} strokeWidth={1.75} />
              <span className="absolute -top-2 -right-2 grid size-7 place-items-center rounded-full bg-accent font-mono text-sm font-bold text-white">0</span>
            </motion.div>
            <p className="font-display text-2xl font-black uppercase">Корзина пока пуста</p>
            <p className="mt-3 max-w-[20rem] text-base text-mute">Загляните в каталог — выбранные вещи появятся здесь.</p>
            <button
              onClick={() => {
                onClose()
                onShop()
              }}
              className="btn-fill group mt-8 inline-flex h-14 items-center gap-3 bg-accent px-7 text-[15px] font-extrabold tracking-[0.04em] text-white uppercase"
            >
              Перейти в каталог <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto overscroll-contain">
            <ul className="divide-y divide-line px-4 sm:px-6">
              <AnimatePresence initial={false}>
                {lines.map((l) => (
                  <Line key={`${l.productId}-${l.size}`} line={l} onOpen={() => onOpenProduct(l.productId)} />
                ))}
              </AnimatePresence>
            </ul>

            <div className="bg-paper px-4 pt-5 pb-5 sm:px-6">
              <dl className="space-y-1.5 text-[15px]">
                <div className="flex justify-between">
                  <dt className="text-mute">
                    Товары, {count} шт.
                  </dt>
                  <dd className="font-bold">{formatPrice(subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-mute">Доставка</dt>
                  <dd className="font-semibold">уточняется у продавца</dd>
                </div>
                <div className="flex items-baseline justify-between border-t-2 border-ink pt-3">
                  <dt className="font-display text-lg font-black uppercase">Итого</dt>
                  <dd className="font-display text-2xl font-black text-accent">
                    <motion.span key={subtotal} initial={reduce ? false : { opacity: 0.3, y: -4 }} animate={{ opacity: 1, y: 0 }} className="inline-block">
                      {formatPrice(subtotal)}
                    </motion.span>
                  </dd>
                </div>
              </dl>

              <label className="mt-4 block">
                <span className="text-sm font-bold">Ваше имя или контакт <span className="font-medium text-mute">(необязательно)</span></span>
                <input
                  value={contact}
                  onChange={(e) => setContact(e.target.value.slice(0, 80))}
                  id="order-contact"
                  placeholder="Например: Алекс, @alex_tg"
                  autoComplete="name"
                  className="mt-1.5 h-12 w-full border-2 border-ink/15 bg-white px-3 text-base placeholder:text-mute focus:border-ink focus:outline-none"
                />
              </label>

              <AnimatePresence mode="wait">
                {status === 'not-configured' && (
                  <motion.div
                    key="nc"
                    role="alert"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <p className="mt-3 flex gap-2 border-2 border-accent bg-white p-3 text-[14px] leading-snug">
                      <AlertTriangle size={18} className="mt-0.5 shrink-0 text-accent" />
                      <span>
                        Заказ через Telegram пока не настроен: владельцу магазина нужно указать username в{' '}
                        <code className="font-mono text-[13px]">src/config/store.ts</code>. Текст заказа можно скопировать кнопкой ниже.
                      </span>
                    </p>
                  </motion.div>
                )}
                {status === 'opened' && (
                  <motion.div key="op" role="status" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <p className="mt-3 border-2 border-ink/15 bg-white p-3 text-[14px] leading-snug">
                      Мы открыли Telegram с текстом заказа. <strong>Нажмите «Отправить» в чате</strong> — без этого заказ не уйдёт продавцу. Корзина
                      сохранится, пока продавец не подтвердит заказ.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            </div>

            <div className="shrink-0 border-t border-line bg-white px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6">
              {/* Обычная ссылка, а не window.open: её не блокируют браузеры и встроенные окна */}
              {telegramUrl ? (
                <a href={telegramUrl} target="_blank" rel="noopener noreferrer" onClick={() => setStatus('opened')} className={orderClass}>
                  <Send size={17} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  Заказать в Telegram
                </a>
              ) : (
                <button onClick={() => setStatus('not-configured')} className={orderClass}>
                  <Send size={17} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  Заказать в Telegram
                </button>
              )}
              <div className="mt-2 flex items-center justify-between">
                <button onClick={copy} className="inline-flex h-11 items-center gap-2 text-[14px] font-bold transition-colors hover:text-accent">
                  <Copy size={16} /> Скопировать заказ
                </button>
                <button
                  onClick={() => {
                    onClose()
                    onShop()
                  }}
                  className="inline-flex h-11 items-center text-[14px] font-bold underline-offset-4 transition-colors hover:text-accent hover:underline"
                >
                  Продолжить покупки
                </button>
              </div>
              {storeConfig.demoMode && <p className="text-[13px] text-mute">Демо-магазин: оплата на сайте не принимается.</p>}
            </div>
          </>
        )}
      </motion.aside>
    </motion.div>
  )
}

function Line({ line, onOpen }: { line: CartLine; onOpen: () => void }) {
  const { setQuantity, removeItem } = useCart()
  const { product, size, quantity } = line
  return (
    <motion.li
      layout
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40, height: 0, paddingTop: 0, paddingBottom: 0, transition: { duration: 0.25 } }}
      transition={{ duration: 0.35, ease }}
      className="flex gap-4 overflow-hidden py-5"
    >
      <button onClick={onOpen} className="relative aspect-[3/4] w-24 shrink-0 overflow-hidden bg-paper-2" aria-label={`Открыть «${product.name}»`}>
        <SmartImage src={product.images[0]} alt="" art={product.category} className="h-full w-full object-cover transition-transform duration-500 hover:scale-105" />
      </button>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="line-clamp-2 text-base leading-snug font-bold">{product.name}</p>
            <p className="mt-1 text-sm text-mute">
              {size ? `Размер ${size}` : 'Один размер'} · {formatPrice(product.price)} за шт.
            </p>
          </div>
          <button
            onClick={() => removeItem(product.id, size)}
            aria-label={`Удалить «${product.name}»${size ? `, размер ${size}` : ''} из корзины`}
            title="Удалить"
            className="-mt-2 -mr-2 grid size-10 shrink-0 place-items-center text-mute transition-colors hover:bg-accent hover:text-white"
          >
            <Trash2 size={17} />
          </button>
        </div>
        <div className="mt-auto flex items-center justify-between pt-3">
          <div className="flex h-10 items-center border-2 border-ink/15" role="group" aria-label={`Количество: ${product.name}`}>
            <button
              onClick={() => setQuantity(product.id, size, quantity - 1)}
              disabled={quantity <= 1}
              aria-label="Уменьшить количество"
              className="grid h-full w-10 place-items-center transition-colors hover:text-accent disabled:opacity-30 disabled:hover:text-ink"
            >
              <Minus size={15} />
            </button>
            <span className="relative w-7 overflow-hidden text-center font-mono text-base font-bold">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span key={quantity} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }} transition={{ duration: 0.18 }} className="block">
                  {quantity}
                </motion.span>
              </AnimatePresence>
            </span>
            <button
              onClick={() => setQuantity(product.id, size, quantity + 1)}
              disabled={quantity >= MAX_QTY}
              aria-label="Увеличить количество"
              className="grid h-full w-10 place-items-center transition-colors hover:text-accent disabled:opacity-30 disabled:hover:text-ink"
            >
              <Plus size={15} />
            </button>
          </div>
          <p className="font-display text-base font-extrabold">{formatPrice(line.lineTotal)}</p>
        </div>
      </div>
    </motion.li>
  )
}
