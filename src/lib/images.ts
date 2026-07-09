/** Local PNG assets also ship as WebP siblings in /public (see scripts/optimize-images.mjs). */
export function webpSibling(src: string): string | null {
  if (!/\.png$/i.test(src)) return null
  if (src.startsWith('http://') || src.startsWith('https://')) return null
  return src.replace(/\.png$/i, '.webp')
}

export function preloadImage(src: string): void {
  if (!src || typeof window === 'undefined') return
  const img = new Image()
  img.decoding = 'async'
  img.src = src
}

export function preloadImages(sources: string[]): void {
  for (const src of sources) {
    if (src) preloadImage(src)
  }
}
