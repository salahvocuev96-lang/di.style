import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { CartItem, Product } from '../types/product'
import { getProduct } from '../data/products'

const STORAGE_KEY = 'mgs-cart-v1'
const MAX_QTY = 10

export interface CartLine extends CartItem {
  product: Product
  lineTotal: number
}

interface CartContextValue {
  lines: CartLine[]
  count: number
  subtotal: number
  isOpen: boolean
  openCart: () => void
  closeCart: () => void
  addItem: (productId: string, size: string | null, quantity?: number) => void
  setQuantity: (productId: string, size: string | null, quantity: number) => void
  removeItem: (productId: string, size: string | null) => void
  clear: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

const clampQty = (n: number) => Math.min(MAX_QTY, Math.max(1, Math.floor(n) || 1))

/** Читаем корзину из localStorage и выбрасываем всё некорректное (удалённые товары, мусор) */
function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.flatMap((it): CartItem[] => {
      if (!it || typeof it !== 'object') return []
      const { productId, size, quantity } = it as Record<string, unknown>
      if (typeof productId !== 'string' || !getProduct(productId)) return []
      const product = getProduct(productId)!
      const s = typeof size === 'string' && product.sizes.includes(size) ? size : null
      if (product.sizes.length > 0 && !s) return []
      return [{ productId, size: s, quantity: clampQty(Number(quantity)) }]
    })
  } catch {
    return []
  }
}

const same = (a: CartItem, productId: string, size: string | null) => a.productId === productId && a.size === size

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      /* приватный режим или переполнено хранилище — корзина просто не сохранится */
    }
  }, [items])

  const addItem = useCallback((productId: string, size: string | null, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((it) => same(it, productId, size))
      if (existing) {
        return prev.map((it) => (it === existing ? { ...it, quantity: clampQty(it.quantity + quantity) } : it))
      }
      return [...prev, { productId, size, quantity: clampQty(quantity) }]
    })
  }, [])

  const setQuantity = useCallback((productId: string, size: string | null, quantity: number) => {
    setItems((prev) => prev.map((it) => (same(it, productId, size) ? { ...it, quantity: clampQty(quantity) } : it)))
  }, [])

  const removeItem = useCallback((productId: string, size: string | null) => {
    setItems((prev) => prev.filter((it) => !same(it, productId, size)))
  }, [])

  const value = useMemo<CartContextValue>(() => {
    const lines = items.flatMap((it) => {
      const product = getProduct(it.productId)
      return product ? [{ ...it, product, lineTotal: product.price * it.quantity }] : []
    })
    return {
      lines,
      count: lines.reduce((s, l) => s + l.quantity, 0),
      subtotal: lines.reduce((s, l) => s + l.lineTotal, 0),
      isOpen,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      addItem,
      setQuantity,
      removeItem,
      clear: () => setItems([]),
    }
  }, [items, isOpen, addItem, setQuantity, removeItem])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}

export { MAX_QTY }
