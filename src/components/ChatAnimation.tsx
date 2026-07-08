import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { ArrowLeft, Video, Phone, MoreVertical, Smile, Paperclip, Camera, Mic, CheckCheck } from 'lucide-react'
import { COMPANY } from '@/lib/constants'

type Sender = 'customer' | 'mosasana'

interface Message {
  from: Sender
  text?: string
  image?: boolean
  time: string
}

const CONVERSATION: Message[] = [
  { from: 'customer', text: "Hi Mosasana 👋 I'd like to apply for a loan of P3,000.", time: '19:38' },
  {
    from: 'mosasana',
    text: 'Hello Thabo! 😊 Please share full name, email, phone, ID type/number, address, repayment period, purpose, employment status, and income.',
    time: '19:38',
  },
  {
    from: 'customer',
    text: 'Thabo Nkile • thabo@example.com • 71 234 567 • Omang 123456789 • Plot 456, Gaborone • 3 months • Rent • Employed • P12,000',
    time: '19:39',
  },
  { from: 'customer', image: true, time: '19:39' },
  { from: 'mosasana', text: "Received ✅ Thank you! We're reviewing your application now.", time: '19:40' },
  { from: 'mosasana', text: "You're approved! 🎉 Funds are on the way. 💚", time: '19:41' },
]

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function WhatsAppDoodle() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.05]"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <pattern id="wa-doodle" width="150" height="150" patternUnits="userSpaceOnUse">
          <g fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 34c-7-5-13-9-13-15a6 6 0 0 1 13-3 6 6 0 0 1 13 3c0 6-6 10-13 15z" />
            <path d="M112 16l3 7 8 1-6 5 2 8-7-4-7 4 2-8-6-5 8-1z" />
            <rect x="52" y="60" width="30" height="22" rx="6" />
            <path d="M60 82l-4 7 9-4" />
            <circle cx="28" cy="112" r="12" />
            <path d="M28 104v16M24 108h6a3 3 0 0 1 0 6h-6a3 3 0 0 0 0 6h6" />
            <rect x="104" y="104" width="24" height="20" rx="3" />
            <path d="M104 110h24M116 104v20" />
            <circle cx="92" cy="126" r="6" />
            <path d="M128 60l6 10h-12z" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#wa-doodle)" />
    </svg>
  )
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-0.5">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-[#8696a0]"
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.18 }}
        />
      ))}
    </div>
  )
}

function IdCard() {
  return (
    <div className="w-44 overflow-hidden rounded-lg">
      <div className="relative aspect-[16/10] bg-gradient-to-br from-brand-500 to-brand-700 p-2.5">
        <p className="text-[8px] font-bold uppercase tracking-wide text-white/90">Republic of Botswana</p>
        <p className="text-[7px] text-white/70">Omang · National ID</p>
        <div className="mt-1.5 flex gap-2">
          <div className="h-10 w-8 rounded bg-white/85" />
          <div className="flex-1 space-y-1 pt-0.5">
            <div className="h-1.5 w-full rounded bg-white/50" />
            <div className="h-1.5 w-3/4 rounded bg-white/40" />
            <div className="h-1.5 w-4/5 rounded bg-white/40" />
            <div className="h-1.5 w-2/3 rounded bg-white/30" />
          </div>
        </div>
      </div>
      <div className="bg-black/20 px-2 py-1 text-[10px] text-[#e9edef]">omang-id.jpg</div>
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
          await wait(msg.image ? 1500 : (msg.text?.length ?? 0) > 45 ? 1900 : 1400)
        }
        await wait(3400)
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
    <div className="relative mx-auto w-full max-w-[min(320px,100%)] overflow-hidden">
      <div className="absolute -inset-4 rounded-[3rem] bg-gradient-to-br from-brand-300/30 to-gold-400/20 blur-2xl" />

      <div className="relative overflow-hidden rounded-[2.5rem] border-[6px] border-[#0b141a] bg-[#0b141a] shadow-2xl">
        <div className="absolute left-1/2 top-0 z-20 h-6 w-32 -translate-x-1/2 rounded-b-2xl bg-[#0b141a]" />

        {/* WhatsApp header */}
        <div className="flex items-center gap-2.5 bg-[#1f2c34] px-3 pb-2.5 pt-7 text-[#e9edef]">
          <ArrowLeft className="h-5 w-5 shrink-0 text-[#e9edef]" />
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/95 p-1">
            <img
              src={`${import.meta.env.BASE_URL}favicon.png`}
              alt={COMPANY.shortName}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-contain"
            />
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-semibold">{COMPANY.shortName}</p>
            <p className="text-[11px] text-[#8696a0]">online</p>
          </div>
          <Video className="h-5 w-5 text-[#8696a0]" />
          <Phone className="h-4 w-4 text-[#8696a0]" />
          <MoreVertical className="h-5 w-5 text-[#8696a0]" />
        </div>

        {/* Chat body */}
        <div ref={scrollRef} className="relative h-[280px] overflow-hidden bg-[#0b141a] px-3 py-3 sm:h-[430px]">
          <WhatsAppDoodle />

          <div className="relative space-y-2">
            <div className="mx-auto w-fit rounded-md bg-[#1f2c34]/90 px-2.5 py-1 text-center text-[10px] text-[#8696a0]">
              Messages are end-to-end encrypted
            </div>

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
                    className={`max-w-[82%] rounded-lg px-2 py-1.5 text-[13px] leading-snug shadow-sm ${
                      msg.from === 'customer'
                        ? 'rounded-tr-none bg-[#005c4b] text-[#e9edef]'
                        : 'rounded-tl-none bg-[#202c33] text-[#e9edef]'
                    }`}
                  >
                    {msg.image ? (
                      <div className="p-0.5">
                        <IdCard />
                        <span className="mt-0.5 flex items-center justify-end gap-1 px-1 text-[10px] text-[#8fb7ae]">
                          {msg.time}
                          <CheckCheck className="h-3.5 w-3.5 text-[#53bdeb]" />
                        </span>
                      </div>
                    ) : (
                      <div className="px-1">
                        {msg.text}
                        <span
                          className={`mt-0.5 flex items-center justify-end gap-1 text-[10px] ${
                            msg.from === 'customer' ? 'text-[#8fb7ae]' : 'text-[#8696a0]'
                          }`}
                        >
                          {msg.time}
                          {msg.from === 'customer' && <CheckCheck className="h-3.5 w-3.5 text-[#53bdeb]" />}
                        </span>
                      </div>
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
                  <div className="rounded-lg rounded-tl-none bg-[#202c33] px-2 py-2">
                    <TypingDots />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* WhatsApp input bar */}
        <div className="flex items-center gap-2 bg-[#0b141a] px-2 py-2">
          <div className="flex flex-1 items-center gap-2 rounded-full bg-[#1f2c34] px-3 py-2">
            <Smile className="h-5 w-5 shrink-0 text-[#8696a0]" />
            <span className="flex-1 text-[13px] text-[#8696a0]">Message</span>
            <Paperclip className="h-5 w-5 shrink-0 text-[#8696a0]" />
            <Camera className="h-5 w-5 shrink-0 text-[#8696a0]" />
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#00a884] text-white">
            <Mic className="h-5 w-5" />
          </div>
        </div>
      </div>
    </div>
  )
}
