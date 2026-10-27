import { storeConfig } from '../config/store'

const fmt = new Intl.NumberFormat(storeConfig.locale, {
  style: 'currency',
  currency: storeConfig.currency,
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

export const formatPrice = (value: number) => fmt.format(value)
