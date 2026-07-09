import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { EditableImage } from '@/components/editable/EditableImage'
import { EditableText } from '@/components/editable/EditableText'
import { preloadImages, webpSibling } from '@/lib/images'

const BASE = import.meta.env.BASE_URL

const slides = [
  { key: 'home.why.slide.0', src: `${BASE}why-fast.png`, alt: 'Fast processing — quick review and turnaround' },
  { key: 'home.why.slide.1', src: `${BASE}why-secure.png`, alt: 'Secure & trusted — your data is protected' },
  { key: 'home.why.slide.2', src: `${BASE}why-client.png`, alt: 'Client-focused — solutions delivered with care' },
  { key: 'home.why.slide.3', src: `${BASE}why-flexible.png`, alt: 'Flexible solutions — short-term cash loans' },
]

const AUTOPLAY_MS = 4500

export function WhyChooseSlideshow() {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  const go = useCallback((dir: number) => {
    setIndex((i) => (i + dir + slides.length) % slides.length)
  }, [])

  useEffect(() => {
    if (paused) return
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), AUTOPLAY_MS)
    return () => clearInterval(t)
  }, [paused, index])

  useEffect(() => {
    preloadImages(
      slides.flatMap((s) => {
        const webp = webpSibling(s.src)
        return webp ? [webp, s.src] : [s.src]
      }),
    )
  }, [])

  const slide = slides[index]

  return (
    <div
      className="relative mx-auto max-w-4xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative aspect-[16/10] overflow-hidden rounded-3xl shadow-[0_20px_50px_-12px_rgba(15,23,42,0.2)] sm:aspect-[16/9]">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.99 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            <EditableImage
              contentKey={slide.key}
              src={slide.src}
              alt={slide.alt}
              className="h-full w-full object-cover"
              wrapperClassName="absolute inset-0"
              eager={index === 0}
            />
          </motion.div>
        </AnimatePresence>

        <div className="absolute inset-x-0 bottom-0 h-1 bg-white/30">
          {!paused && (
            <motion.div
              key={index}
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: AUTOPLAY_MS / 1000, ease: 'linear' }}
              className="h-full bg-brand-500"
            />
          )}
        </div>

        <button
          type="button"
          onClick={() => go(-1)}
          aria-label="Previous"
          className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-brand-700 shadow-lg backdrop-blur-sm transition hover:bg-white"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => go(1)}
          aria-label="Next"
          className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-brand-700 shadow-lg backdrop-blur-sm transition hover:bg-white"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <EditableText
        as="p"
        contentKey={`${slide.key}.caption`}
        className="mt-3 text-center text-sm text-brand-600"
      >
        {slide.alt}
      </EditableText>

      <div className="mt-5 flex justify-center gap-2.5">
        {slides.map((s, i) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-2.5 rounded-full transition-all duration-300 ${
              i === index ? 'w-8 bg-brand-600' : 'w-2.5 bg-brand-200 hover:bg-brand-300'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
