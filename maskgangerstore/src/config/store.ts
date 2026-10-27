/**
 * Настройки магазина. Здесь владелец меняет название, Telegram и валюту.
 */
export const storeConfig = {
  storeName: 'MASKGANGERSTORE',
  /**
   * Telegram username продавца БЕЗ символа @.
   * Пока здесь заглушка — кнопка заказа покажет предупреждение вместо перехода.
   * Пример: telegramUsername: 'my_shop_bot'
   */
  telegramUsername: 'YOUR_TELEGRAM_USERNAME',
  currency: 'EUR',
  locale: 'en-IE',
  /** Демо-режим: показывает пометку о тестовых товарах и ценах */
  demoMode: true,
}

const PLACEHOLDER = 'YOUR_TELEGRAM_USERNAME'

/** Username считается настроенным, если это не заглушка и он похож на настоящий (5–32 символа) */
export function getTelegramUsername(): string | null {
  const name = storeConfig.telegramUsername.trim().replace(/^@/, '')
  if (!name || name === PLACEHOLDER) return null
  if (!/^[A-Za-z][A-Za-z0-9_]{4,31}$/.test(name)) return null
  return name
}

export const telegramProfileUrl = () => {
  const u = getTelegramUsername()
  return u ? `https://t.me/${u}` : null
}
