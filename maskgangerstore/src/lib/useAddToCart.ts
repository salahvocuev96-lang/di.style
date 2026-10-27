import { useCallback } from 'react'
import { useCart } from '../context/CartContext'
import { useToast } from '../components/Toast'
import type { Product } from '../types/product'

/** Добавление в корзину с проверкой размера и toast-уведомлением */
export function useAddToCart() {
  const { addItem } = useCart()
  const toast = useToast()
  return useCallback(
    (product: Product, size: string | null, quantity = 1): boolean => {
      if (product.sizes.length > 0 && (!size || !product.sizes.includes(size))) {
        toast({ kind: 'error', title: 'Select a size', text: `Choose a size for ${product.name} first.` })
        return false
      }
      addItem(product.id, size, quantity)
      toast({
        kind: 'success',
        title: 'Added to cart',
        text: `${product.name}${size ? ` · ${size}` : ''}${quantity > 1 ? ` × ${quantity}` : ''}`,
      })
      return true
    },
    [addItem, toast],
  )
}
