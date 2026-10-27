import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { X, Minus, Plus, Trash2, Send, Copy, ArrowRight, AlertTriangle, ShoppingBag } from 'lucide-react'
import { useCart, MAX_QTY, type CartLine } from '../context/CartContext'
import { useModal } from '../lib/useModal'
import { formatPrice } from '../lib/format'
import { buildOrderMessage, buildTelegramUrl } from '../lib/telegram'
import { storeConfig } from '../config/store'
import { categoryLabels } from '../data/products'
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

  const order = () => {
    const url = buildTelegramUrl(message)
    if (!url) {
      setStatus('not-configured')
      return
    }
    const win = window.open(url, '_blank')
    // Если браузер заблокировал новое окно — открываем в текущей вкладке
    if (win) win.opener = null
    else window.location.href = url
    setStatus('opened')
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message)
      toast({ kind: 'success', title: 'Order copied', text: 'Paste it into a Telegram chat with the seller.' })
    } catch {
      toast({ kind: 'error', title: 'Could not copy', text: 'Your browser blocked clipboard access.' })
    }
  }

  return (
    <motion.div className="fixed inset-0 z-[70] flex justify-end" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.25 } }}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <motion.aside
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
        tabIndex={-1}
        className="relative flex h-full w-full max-w-[460px] flex-col border-l border-line bg-bg outline-none"
        initial={reduce ? false : { x: '100%' }}
        animate={{ x: 0 }}
        exit={reduce ? { opacity: 0 } : { x: '100%', transition: { duration: 0.3, ease } }}
        transition={{ duration: 0.55, ease }}
      >
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-line px-4 sm:px-6">
          <h2 id="cart-title" className="flex items-baseline gap-3 font-wide text-lg font-black uppercase">
            Cart
            <span className="label text-mute">
              {count} {count === 1 ? 'item' : 'items'}
            </span>
          </h2>
          <button onClick={onClose} data-autofocus aria-label="Close cart" className="-mr-2 grid size-11 place-items-center transition-colors hover:text-accent">
            <X size={20} />
          </button>
        </header>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <div className="relative mb-8 grid size-24 place-items-center border border-line">
              <ShoppingBag size={30} strokeWidth={1.25} className="text-mute" />
              <span className="absolute -top-1 -right-1 size-2 bg-accent" />
            </div>
            <p className="font-wide text-2xl font-black uppercase">Your cart is empty</p>
            <p className="mt-2 max-w-[18rem] text-sm text-mute">Nothing in the rotation yet. Pick a few pieces and they’ll show up here.</p>
            <button
              onClick={() => {
                onClose()
                onShop()
              }}
              className="group mt-8 inline-flex h-12 items-center gap-3 bg-ink px-6 text-[12px] font-bold tracking-[0.14em] text-bg uppercase transition-colors hover:bg-accent hover:text-ink"
            >
              Start shopping <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-line overflow-y-auto overscroll-contain px-4 sm:px-6">
              <AnimatePresence initial={false}>
                {lines.map((l) => (
                  <Line key={`${l.productId}-${l.size}`} line={l} onOpen={() => onOpenProduct(l.productId)} />
                ))}
              </AnimatePresence>
            </ul>

            <div className="shrink-0 border-t border-line bg-bg2 px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">
              <dl className="space-y-1.5 text-sm">
                <div className="flex justify-between text-mute">
                  <dt>Subtotal</dt>
                  <dd className="font-mono">{formatPrice(subtotal)}</dd>
                </div>
                <div className="flex justify-between text-mute">
                  <dt>Delivery</dt>
                  <dd>Confirmed by seller</dd>
                </div>
                <div className="flex items-baseline justify-between pt-2">
                  <dt className="font-bold tracking-wide uppercase">Total</dt>
                  <dd className="font-mono text-xl">
                    <motion.span key={subtotal} initial={reduce ? false : { opacity: 0.3, y: -4 }} animate={{ opacity: 1, y: 0 }} className="inline-block">
                      {formatPrice(subtotal)}
                    </motion.span>
                  </dd>
                </div>
              </dl>

              <label className="mt-4 block">
                <span className="label text-mute">Your name or contact (optional)</span>
                <input
                  value={contact}
                  onChange={(e) => setContact(e.target.value.slice(0, 80))}
                  placeholder="e.g. Alex, @alex_tg"
                  autoComplete="name"
                  className="mt-1.5 h-11 w-full border border-line bg-bg px-3 text-sm placeholder:text-mute/60 focus:border-ink focus:outline-none"
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
                    <p className="mt-3 flex gap-2 border border-accent/50 bg-accent/10 p-3 text-[13px] leading-snug">
                      <AlertTriangle size={16} className="mt-0.5 shrink-0 text-accent" />
                      <span>
                        Telegram ordering isn’t set up yet. Owner: add your username in <code className="font-mono text-[12px]">src/config/store.ts</code>. You
                        can still copy the order text below.
                      </span>
                    </p>
                  </motion.div>
                )}
                {status === 'opened' && (
                  <motion.div key="op" role="status" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <p className="mt-3 border border-line p-3 text-[13px] leading-snug text-ink/85">
                      Telegram opened with your order text. <strong>Press Send in Telegram</strong> to deliver it — the order is not sent until you do. Your
                      cart stays here until the seller confirms.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                onClick={order}
                className="group mt-4 flex h-14 w-full items-center justify-center gap-3 bg-accent text-[13px] font-bold tracking-[0.14em] text-ink uppercase transition-colors hover:bg-accent-hover active:scale-[0.99]"
              >
                <Send size={17} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                Order via Telegram
              </button>
              <div className="mt-2 flex items-center justify-between">
                <button onClick={copy} className="inline-flex h-10 items-center gap-2 text-[12px] text-mute transition-colors hover:text-ink">
                  <Copy size={14} /> Copy order text
                </button>
                <button
                  onClick={() => {
                    onClose()
                    onShop()
                  }}
                  className="inline-flex h-10 items-center text-[12px] text-mute underline-offset-4 transition-colors hover:text-ink hover:underline"
                >
                  Continue shopping
                </button>
              </div>
              {storeConfig.demoMode && <p className="label mt-1 text-[9px] text-mute/80">Demo store · no payment is taken on this site</p>}
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
      className="flex gap-4 overflow-hidden py-4"
    >
      <button onClick={onOpen} className="relative aspect-[4/5] w-20 shrink-0 overflow-hidden bg-card" aria-label={`View ${product.name}`}>
        <SmartImage src={product.images[0]} alt="" fallbackLabel={categoryLabels[product.category]} className="h-full w-full object-cover" />
      </button>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="line-clamp-2 text-[13px] leading-snug font-semibold tracking-wide uppercase">{product.name}</p>
            <p className="label mt-1 text-[10px] text-mute">
              {size ? `Size ${size}` : 'One size'} · {formatPrice(product.price)}
            </p>
          </div>
          <button
            onClick={() => removeItem(product.id, size)}
            aria-label={`Remove ${product.name}${size ? `, size ${size}` : ''} from cart`}
            className="-mt-2 -mr-2 grid size-9 shrink-0 place-items-center text-mute transition-colors hover:text-accent"
          >
            <Trash2 size={15} />
          </button>
        </div>
        <div className="mt-auto flex items-center justify-between pt-3">
          <div className="flex h-9 items-center border border-line" role="group" aria-label={`Quantity of ${product.name}`}>
            <button
              onClick={() => setQuantity(product.id, size, quantity - 1)}
              disabled={quantity <= 1}
              aria-label="Decrease quantity"
              className="grid h-full w-9 place-items-center transition-colors hover:text-accent disabled:opacity-30 disabled:hover:text-ink"
            >
              <Minus size={13} />
            </button>
            <span className="relative w-7 overflow-hidden text-center font-mono text-sm">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span key={quantity} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }} transition={{ duration: 0.18 }} className="block">
                  {quantity}
                </motion.span>
              </AnimatePresence>
            </span>
            <button
              onClick={() => setQuantity(product.id, size, quantity + 1)}
              disabled={quantity >= MAX_QTY}
              aria-label="Increase quantity"
              className="grid h-full w-9 place-items-center transition-colors hover:text-accent disabled:opacity-30 disabled:hover:text-ink"
            >
              <Plus size={13} />
            </button>
          </div>
          <p className="font-mono text-sm">{formatPrice(line.lineTotal)}</p>
        </div>
      </div>
    </motion.li>
  )
}
