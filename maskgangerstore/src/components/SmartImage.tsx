import { useState, type CSSProperties, type ImgHTMLAttributes } from 'react'
import type { Category } from '../types/product'
import { GarmentArt } from './GarmentArt'

interface Props extends ImgHTMLAttributes<HTMLImageElement> {
  src: string
  alt: string
  /** Какой силуэт показать, если фото не загрузилось */
  art?: Category
  /** Подпись на заглушке */
  fallbackLabel?: string
  /** Тёмная заглушка (для графитовых секций) */
  dark?: boolean
  /** Не показывать заглушку (для второго фото поверх основного) */
  hideOnError?: boolean
}

/** Фото с аккуратной графической заглушкой, если ссылка недоступна */
export function SmartImage({ src, alt, art, fallbackLabel, dark, hideOnError, className = '', ...rest }: Props) {
  const [failed, setFailed] = useState(false)
  const [loaded, setLoaded] = useState(false)

  if (failed && hideOnError) return null
  if (failed) {
    return (
      <div
        role="img"
        aria-label={alt || fallbackLabel || 'Изображение'}
        className={`${className} relative overflow-hidden ${dark ? 'bg-graphite text-white/[0.07]' : 'bg-paper-2 text-ink/[0.07]'}`}
        style={dark ? ({ '--art-fill': '#d9d6d0', '--art-hole': '#a9a59e' } as CSSProperties) : undefined}
      >
        <div className="dots absolute inset-0" />
        {art && (
          <div className="absolute inset-0 grid place-items-center p-[14%]">
            <GarmentArt category={art} className="h-full max-h-[80%] w-full max-w-[360px] drop-shadow-[0_18px_24px_rgba(0,0,0,0.18)]" />
          </div>
        )}
        {fallbackLabel && (
          <span className={`tag absolute bottom-3 left-3 ${dark ? 'text-white/60' : 'text-ink/50'}`}>{fallbackLabel}</span>
        )}
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      decoding="async"
      {...rest}
      onError={() => setFailed(true)}
      onLoad={() => setLoaded(true)}
      className={`${className} ${loaded ? 'img-in' : 'opacity-0'}`}
    />
  )
}
