import type { ImgHTMLAttributes } from 'react'
import { webpSibling } from '@/lib/images'

type OptimizedImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  /** When true, loads immediately with high fetch priority (hero, LCP). */
  eager?: boolean
}

export function OptimizedImage({
  src = '',
  eager = false,
  loading,
  fetchPriority,
  decoding = 'async',
  alt = '',
  ...rest
}: OptimizedImageProps) {
  const webp = webpSibling(src)
  const resolvedLoading = loading ?? (eager ? 'eager' : 'lazy')
  const resolvedPriority = fetchPriority ?? (eager ? 'high' : 'auto')

  if (!webp) {
    return (
      <img
        src={src}
        alt={alt}
        loading={resolvedLoading}
        fetchPriority={resolvedPriority}
        decoding={decoding}
        {...rest}
      />
    )
  }

  return (
    <picture>
      <source srcSet={webp} type="image/webp" />
      <img
        src={src}
        alt={alt}
        loading={resolvedLoading}
        fetchPriority={resolvedPriority}
        decoding={decoding}
        {...rest}
      />
    </picture>
  )
}
