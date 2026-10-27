import { useCallback } from 'react'
import { useCart } from '../context/CartContext'
import { useToast } from '../components/Toast'
import type { Product } from '../types/product'

/** Добавление в корзину с проверкой размера и уведомлением */
export function useAddToCart() {
  const { addItem } = useCart()
  const toast = useToast()
  return useCallback(
    (product: Product, size: string | null, quantity = 1): boolean => {
      if (product.sizes.length > 0 && (!size || !product.sizes.includes(size))) {
        toast({ kind: 'error', title: 'Выберите размер', text: `Укажите размер для «${product.name}», чтобы добавить товар в корзину.` })
        return false
      }
      addItem(product.id, size, quantity)
      toast({
        kind: 'success',
        title: 'Добавлено в корзину',
        text: `${product.name}${size ? ` · размер ${size}` : ''}${quantity > 1 ? ` · ${quantity} шт.` : ''}`,
        image: product.images[0],
        art: product.category,
      })
      return true
    },
    [addItem, toast],
  )
}
