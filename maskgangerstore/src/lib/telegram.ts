import { storeConfig, getTelegramUsername } from '../config/store'
import type { CartLine } from '../context/CartContext'
import { formatPrice } from './format'

/** Текст заказа, который покупатель отправит продавцу в Telegram */
export function buildOrderMessage(lines: CartLine[], subtotal: number, contact: string): string {
  const rows = lines.map((l, i) => {
    const size = l.size ? `Size: ${l.size}` : 'One size'
    return `${i + 1}. ${l.product.name}\n   ${size} · Qty: ${l.quantity} · ${formatPrice(l.product.price)} each\n   = ${formatPrice(l.lineTotal)}`
  })
  const parts = [
    `New order request — ${storeConfig.storeName}`,
    '',
    ...rows,
    '',
    `Total: ${formatPrice(subtotal)}`,
  ]
  const c = contact.trim()
  if (c) parts.push('', `Contact: ${c}`)
  parts.push('', 'Please confirm availability and delivery details.')
  return parts.join('\n')
}

/**
 * Ссылка на чат с продавцом с заранее вставленным текстом.
 * Формат t.me/<username>?text=... поддерживается Telegram для личных чатов.
 * Сообщение НЕ отправляется автоматически — пользователь сам нажимает «Отправить».
 */
export function buildTelegramUrl(message: string): string | null {
  const username = getTelegramUsername()
  if (!username) return null
  return `https://t.me/${username}?text=${encodeURIComponent(message)}`
}
