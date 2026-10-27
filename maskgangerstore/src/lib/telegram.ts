import { storeConfig, getTelegramUsername } from '../config/store'
import type { CartLine } from '../context/CartContext'
import { formatPrice } from './format'

/** Текст заказа, который покупатель отправит продавцу в Telegram */
export function buildOrderMessage(lines: CartLine[], subtotal: number, contact: string): string {
  const rows = lines.map((l, i) => {
    const size = l.size ? `Размер: ${l.size}` : 'Один размер'
    return `${i + 1}. ${l.product.name}\n   ${size} · Кол-во: ${l.quantity} · ${formatPrice(l.product.price)} за шт.\n   = ${formatPrice(l.lineTotal)}`
  })
  const parts = [`Здравствуйте! Хочу оформить заказ в ${storeConfig.storeName}:`, '', ...rows, '', `Итого: ${formatPrice(subtotal)}`]
  const c = contact.trim()
  if (c) parts.push('', `Контакт: ${c}`)
  parts.push('', 'Подскажите, пожалуйста, наличие и условия доставки.')
  return parts.join('\n')
}

/**
 * Ссылка на чат с продавцом с заранее вставленным текстом (формат t.me/<username>?text=...).
 * Сообщение НЕ отправляется автоматически — покупатель сам нажимает «Отправить» в Telegram.
 */
export function buildTelegramUrl(message: string): string | null {
  const username = getTelegramUsername()
  if (!username) return null
  return `https://t.me/${username}?text=${encodeURIComponent(message)}`
}
