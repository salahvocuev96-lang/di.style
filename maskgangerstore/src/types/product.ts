export type Category = 'hoodies' | 't-shirts' | 'shorts' | 'sneakers' | 'jackets' | 'accessories'

export interface Product {
  id: string
  name: string
  category: Category
  /** Цена в евро (число, без символа валюты) */
  price: number
  /** 1–2 фото. Второе фото проявляется при наведении на карточку */
  images: string[]
  /** Пустой массив — товар без размеров (например, сумка) */
  sizes: string[]
  badge?: string
  description: string
  details: string[]
  /** Показывать в блоке NEW ARRIVALS */
  isNew?: boolean
}

export interface CartItem {
  productId: string
  size: string | null
  quantity: number
}
