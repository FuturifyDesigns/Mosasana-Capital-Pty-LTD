import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Check, CheckCheck } from 'lucide-react'
import { COMPANY } from '@/lib/constants'

type Sender = 'customer' | 'mosasana'

interface Message {
  from: Sender
  text: string
}

const CONVERSATION: Message[] = [
  { from: 'customer', text: 'Hi Mosasana 👋 I need a short-term loan of P3,000 for rent.' },
  { from: 'mosasana', text: "Hi Thabo! We'd be glad to help. 😊 Have you created an account with us?" },
  { from: 'customer', text: 'Just signed up now ✅' },
  { from: 'mosasana', text: 'Perfect. Upload your ID photo and fill in a few quick details on the form.' },
  { from: 'customer', text: 'Done! Just submitted my application 🙌' },
  { from: 'mosasana', text: "Great news — you're approved! 🎉 Funds are on the way to you. 💙" },
]

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-2 w-2 rounded-full bg-brand-400"
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.18 }}
        />
      ))}
    </div>
  )
}

export function ChatAnimation() {
  const reduce = useReducedMotion()
  const [visibleCount, setVisibleCount] = useState(reduce ? CONVERSATION.length : 0)
  const [typing, setTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (reduce) return
    let cancelled = false

    async function run() {
      while (!cancelled) {
        setVisibleCount(0)
        setTyping(false)
        await wait(700)
        for (let i = 0; i < CONVERSATION.length; i++) {
          if (cancelled) return
          const msg = CONVERSATION[i]
          if (msg.from === 'mosasana') {
            setTyping(true)
            await wait(1100)
            if (cancelled) return
            setTyping(false)
          } else {
            await wait(500)
          }
          if (cancelled) return
          setVisibleCount(i + 1)
          await wait(msg.text.length > 45 ? 1900 : 1400)
        }
        await wait(3200)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [reduce])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    }
  }, [visibleCount, typing])

  const visible = CONVERSATION.slice(0, visibleCount)

  return (
    <div className="relative mx-auto w-full max-w-[320px]">
      <div className="absolute -inset-4 rounded-[3rem] bg-gradient-to-br from-brand-300/30 to-gold-400/20 blur-2xl" />

      <div className="relative overflow-hidden rounded-[2.5rem] border-[6px] border-brand-900 bg-brand-900 shadow-2xl">
        <div className="absolute left-1/2 top-0 z-20 h-6 w-32 -translate-x-1/2 rounded-b-2xl bg-brand-900" />

        <div className="flex items-center gap-3 bg-gradient-to-r from-brand-700 to-brand-600 px-4 pb-3 pt-7 text-white">
          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-white/95 p-1">
            <img
              src={`${import.meta.env.BASE_URL}favicon.png`}
              alt={COMPANY.shortName}
              className="h-full w-full object-contain"
            />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold">{COMPANY.shortName}</p>
            <p className="flex items-center gap-1 text-[11px] text-brand-100">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400" /> online
            </p>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="h-[420px] space-y-3 overflow-hidden bg-[#eaf2f8] px-3 py-4"
        >
          <AnimatePresence initial={false}>
            {visible.map((msg, i) => (
              <motion.div
                key={i}
                layout
                initial={{ opacity: 0, y: 12, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className={`flex ${msg.from === 'customer' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-[13px] leading-snug shadow-sm ${
                    msg.from === 'customer'
                      ? 'rounded-br-md bg-brand-600 text-white'
                      : 'rounded-bl-md bg-white text-brand-900'
                  }`}
                >
                  {msg.text}
                  {msg.from === 'customer' && (
                    <span className="mt-0.5 flex justify-end">
                      <CheckCheck className="h-3.5 w-3.5 text-brand-200" />
                    </span>
                  )}
                </div>
              </motion.div>
            ))}

            {typing && (
              <motion.div
                key="typing"
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex justify-start"
              >
                <div className="rounded-2xl rounded-bl-md bg-white px-2 py-1.5 shadow-sm">
                  <TypingDots />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-2 bg-white px-3 py-3">
          <div className="flex-1 rounded-full bg-brand-50 px-4 py-2 text-[13px] text-brand-400">
            Type a message…
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-white">
            <Check className="h-4 w-4" />
          </div>
        </div>
      </div>
    </div>
  )
}
