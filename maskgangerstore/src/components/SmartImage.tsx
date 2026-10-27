import { useState, type ImgHTMLAttributes } from 'react'

interface Props extends ImgHTMLAttributes<HTMLImageElement> {
  src: string
  alt: string
  /** Текст, который показывается, если фото не загрузилось */
  fallbackLabel?: string
  /** Не показывать заглушку (для второго фото поверх основного) */
  hideOnError?: boolean
}

/** Фото с аккуратной заглушкой, если ссылка недоступна */
export function SmartImage({ src, alt, fallbackLabel, hideOnError, className = '', ...rest }: Props) {
  const [failed, setFailed] = useState(false)
  const [loaded, setLoaded] = useState(false)

  if (failed && hideOnError) return null
  if (failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`${className} relative flex items-end overflow-hidden bg-[linear-gradient(135deg,#1c1c1f_0%,#111113_60%,#0b0b0c_100%)] p-4`}
      >
        <span aria-hidden className="absolute -right-2 -bottom-6 font-wide text-[5rem] leading-none font-black text-white/[0.04] select-none">
          MGS
        </span>
        <span className="label relative text-mute">{fallbackLabel ?? 'Image unavailable'}</span>
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
