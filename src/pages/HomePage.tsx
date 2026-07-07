import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import {
  ArrowRight,
  Globe,
  CheckCircle2,
  BarChart3,
  Quote,
  Wallet,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ChatAnimation } from '@/components/ChatAnimation'
import { WebsiteFormAnimation } from '@/components/WebsiteFormAnimation'
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon'
import { HowItWorksCycle } from '@/components/HowItWorksCycle'
import { WhyChooseSlideshow } from '@/components/WhyChooseSlideshow'
import { Reveal } from '@/components/Reveal'
import { COMPANY } from '@/lib/constants'
import { useAuth } from '@/context/AuthContext'

const BASE = import.meta.env.BASE_URL

export function HomePage() {
  const { user } = useAuth()
  const applyTarget = user ? '/apply' : '/register'

  return (
    <>
      <HeroSection applyTarget={applyTarget} />

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <Reveal className="mb-16 text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-brand-500">
            How it works
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold text-brand-900 sm:text-4xl">
            Three simple steps to funding
          </h2>
        </Reveal>
        <Reveal>
          <HowItWorksCycle />
        </Reveal>
      </section>

      {/* Two ways to apply */}
      <section className="border-y border-brand-100/60 bg-white/70 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-semibold uppercase tracking-widest text-brand-500">
              Two ways to apply
            </span>
            <h2 className="mt-3 font-display text-3xl font-bold text-brand-900 sm:text-4xl">
              Apply your way — website or WhatsApp
            </h2>
            <p className="mt-4 leading-relaxed text-brand-600">
              Prefer a guided online form? Apply securely on our website. Prefer to chat? Send your
              application straight to us on WhatsApp. Both channels run in parallel, so you choose
              whatever feels easiest.
            </p>
          </Reveal>

          <div className="mt-16 grid items-center gap-16 lg:grid-cols-2 lg:gap-10">
            <Reveal direction="right" className="flex flex-col items-center gap-5">
              <WebsiteFormAnimation />
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-4 py-2 text-sm font-semibold text-brand-700 shadow-sm">
                <Globe className="h-4 w-4 text-brand-600" />
                Apply on the website
              </div>
            </Reveal>

            <Reveal direction="left" delay={0.1} className="flex flex-col items-center gap-5">
              <ChatAnimation />
              <div className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-white px-4 py-2 text-sm font-semibold text-brand-700 shadow-sm">
                <WhatsAppIcon className="h-4 w-4 text-[#25D366]" />
                Apply on WhatsApp
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Tailored solutions — image left */}
      <section>
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2">
          <Reveal direction="right" className="relative">
            <div className="absolute -inset-3 rounded-[2.5rem] bg-gradient-to-br from-brand-300/25 to-gold-400/15 blur-2xl" />
            <img
              src={`${BASE}consultation.png`}
              alt="Mosasana Capital loan officer assisting a client"
              className="relative w-full rounded-3xl border border-white/60 shadow-2xl transition duration-500 ease-out hover:-translate-y-1.5 hover:scale-[1.02] hover:shadow-brand-500/25"
            />
          </Reveal>
          <Reveal direction="left">
            <span className="text-sm font-semibold uppercase tracking-widest text-brand-500">
              Loan solutions tailored for you
            </span>
            <h2 className="mt-3 font-display text-3xl font-bold text-brand-900 sm:text-4xl">
              Real people, real support
            </h2>
            <p className="mt-4 max-w-md leading-relaxed text-brand-600">
              We take the time to understand your needs and offer short-term loan solutions that fit
              your situation. Our team guides you through every step with honesty and care.
            </p>
            <ul className="mt-6 space-y-3">
              {['Competitive, transparent terms', 'Flexible repayment options', 'Friendly, professional service'].map(
                (item) => (
                  <li key={item} className="flex items-center gap-2 text-brand-700">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-growth-500" />
                    {item}
                  </li>
                ),
              )}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* Track your loans — image right */}
      <section className="border-y border-brand-100/60 bg-white/70 backdrop-blur-sm">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2">
          <Reveal direction="right" className="order-1">
            <span className="text-sm font-semibold uppercase tracking-widest text-brand-500">
              Stay in control
            </span>
            <h2 className="mt-3 font-display text-3xl font-bold text-brand-900 sm:text-4xl">
              Track every loan in your dashboard
            </h2>
            <p className="mt-4 max-w-md leading-relaxed text-brand-600">
              Create an account to submit requests and follow their status in real time — from
              pending to approved and disbursed. All your applications, in one secure place.
            </p>
            <ul className="mt-6 space-y-3">
              {['Real-time application status', 'Secure ID document handling', 'Full application history'].map(
                (item) => (
                  <li key={item} className="flex items-center gap-2 text-brand-700">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-growth-500" />
                    {item}
                  </li>
                ),
              )}
            </ul>
            <div className="mt-8">
              <Link to={applyTarget}>
                <Button size="lg">
                  Get started <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </Reveal>
          <Reveal direction="left" className="order-2 flex justify-center">
            <DashboardMock />
          </Reveal>
        </div>
      </section>

      {/* Testimonial — image left */}
      <section>
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2">
          <Reveal direction="right" className="relative order-2 lg:order-1">
            <div className="absolute -inset-3 rounded-[2.5rem] bg-gradient-to-br from-gold-400/20 to-brand-300/25 blur-2xl" />
            <img
              src={`${BASE}testimonial-client.png`}
              alt="Satisfied Mosasana Capital customer"
              className="relative w-full rounded-3xl border border-white/60 shadow-2xl transition duration-500 ease-out hover:-translate-y-1.5 hover:scale-[1.02] hover:shadow-brand-500/25"
            />
          </Reveal>
          <Reveal direction="left" className="order-1 lg:order-2">
            <Quote className="h-12 w-12 text-brand-200" />
            <blockquote className="mt-4 font-display text-2xl font-semibold leading-snug text-brand-900 sm:text-3xl">
              “Mosasana Capital gave me quick, reliable support exactly when I needed it. The process
              was simple and the team truly cared.”
            </blockquote>
            <p className="mt-6 font-semibold text-brand-800">A valued client</p>
            <p className="text-sm text-brand-500">Gaborone, Botswana</p>
          </Reveal>
        </div>
      </section>

      {/* Why choose us — slideshow */}
      <section className="border-y border-brand-100/60 bg-white/70 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <Reveal className="mb-12 text-center">
            <span className="text-sm font-semibold uppercase tracking-widest text-brand-500">
              Why choose us
            </span>
            <h2 className="mt-3 font-display text-3xl font-bold text-brand-900 sm:text-4xl">
              Built around what matters to you
            </h2>
          </Reveal>
          <Reveal>
            <WhyChooseSlideshow />
          </Reveal>
        </div>
      </section>

      {/* Vision & mission */}
      <section className="bg-gradient-to-r from-brand-700 to-brand-600 py-20 text-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-10 md:grid-cols-2">
            <Reveal direction="right">
              <h2 className="font-display text-2xl font-bold sm:text-3xl">Our Vision</h2>
              <p className="mt-4 leading-relaxed text-brand-100">{COMPANY.vision}</p>
            </Reveal>
            <Reveal direction="left" delay={0.1}>
              <h2 className="font-display text-2xl font-bold sm:text-3xl">Our Mission</h2>
              <p className="mt-4 leading-relaxed text-brand-100">{COMPANY.mission}</p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden">
        <img
          src={`${BASE}money-band.png`}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-brand-900/80" />
        <div className="relative mx-auto max-w-6xl px-4 py-24 text-center sm:px-6">
          <Reveal>
            <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
              Ready to get started?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-brand-100">
              {user
                ? 'Submit a new loan request or track your existing applications from your dashboard.'
                : 'Create an account to apply for a loan and track your applications. You can also reach us on WhatsApp.'}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              {user ? (
                <>
                  <Link to="/apply">
                    <Button size="lg">Apply for a Loan</Button>
                  </Link>
                  <Link to="/dashboard">
                    <Button variant="gold" size="lg">
                      Go to Dashboard
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/register">
                    <Button size="lg">Create Account</Button>
                  </Link>
                  <Link to="/login">
                    <Button variant="gold" size="lg">
                      Sign In
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}

function HeroSection({ applyTarget }: { applyTarget: string }) {
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [7, -7]), { stiffness: 150, damping: 15 })
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-7, 7]), { stiffness: 150, damping: 15 })

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    mx.set((e.clientX - rect.left) / rect.width - 0.5)
    my.set((e.clientY - rect.top) / rect.height - 0.5)
  }
  const handleLeave = () => {
    mx.set(0)
    my.set(0)
  }

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-brand-100/70" />
      <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-brand-200/40 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-gold-400/10 blur-3xl" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 className="font-display text-4xl font-bold leading-[1.1] text-brand-900 sm:text-5xl lg:text-6xl">
            A loan is just a<br />
            <span className="text-brand-600">message away</span>
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-brand-600">
            {COMPANY.shortName} makes short-term cash loans simple. Apply on our secure website or
            chat with us on WhatsApp — whichever works best for you.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link to={applyTarget}>
              <Button size="lg">
                Apply for a Loan <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link to="/about">
              <Button variant="outline" size="lg">
                Learn More
              </Button>
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white/80 px-4 py-2 text-sm font-medium text-brand-700 shadow-sm backdrop-blur-sm">
              <Wallet className="h-4 w-4 text-brand-500" />
              P500 – P50,000
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white/80 px-4 py-2 text-sm font-medium text-brand-700 shadow-sm backdrop-blur-sm">
              <ShieldCheck className="h-4 w-4 text-growth-500" />
              Secure & confidential
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          onMouseMove={handleMove}
          onMouseLeave={handleLeave}
          className="relative [perspective:1000px]"
        >
          <motion.div style={{ rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d' }}>
            <div className="absolute -inset-3 rounded-[2.5rem] bg-gradient-to-br from-brand-300/30 to-gold-400/20 blur-2xl" />
            <img
              src={`${BASE}hero-money.png`}
              alt="Happy Mosasana Capital client with cash"
              className="relative w-full rounded-3xl border border-white/60 shadow-2xl"
            />
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              style={{ transform: 'translateZ(50px)' }}
              className="absolute -bottom-5 -left-3 flex items-center gap-3 rounded-2xl border border-brand-100 bg-white/95 px-4 py-3 shadow-xl backdrop-blur-sm sm:-left-5"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-growth-500/10 text-growth-500">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div className="leading-tight">
                <p className="text-sm font-bold text-brand-900">Loan approved</p>
                <p className="text-xs text-brand-500">Funds on the way</p>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

function DashboardMock() {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setTick((v) => v + 1), 4800)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="relative w-full max-w-sm">
      <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-brand-300/25 to-gold-400/15 blur-2xl" />
      <div className="relative rounded-3xl border border-brand-100 bg-white p-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-brand-400">My Dashboard</p>
            <p className="font-display text-lg font-bold text-brand-900">Loan Applications</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full bg-growth-500/10 px-2.5 py-1 text-[11px] font-semibold text-growth-600">
              <motion.span
                className="h-1.5 w-1.5 rounded-full bg-growth-500"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              Live
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
              <BarChart3 className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-3" key={tick}>
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-brand-100 bg-brand-50/60 p-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-lg font-bold text-brand-900">P3,000</p>
              <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
                Approved
              </span>
            </div>
            <p className="mt-1 text-xs text-brand-500">Rent · submitted 2 days ago</p>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-brand-100">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 1.1, delay: 0.3 }}
                className="h-full rounded-full bg-gradient-to-r from-brand-500 to-growth-500"
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-2xl border border-brand-100 p-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-lg font-bold text-brand-900">P1,500</p>
              <span className="rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-semibold text-yellow-800">
                Reviewing
              </span>
            </div>
            <p className="mt-1 text-xs text-brand-500">Emergency · submitted today</p>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-brand-100">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '55%' }}
                transition={{ duration: 1.1, delay: 0.45 }}
                className="h-full rounded-full bg-gradient-to-r from-brand-400 to-gold-400"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
