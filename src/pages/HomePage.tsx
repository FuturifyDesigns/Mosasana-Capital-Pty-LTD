import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import {
  ArrowRight,
  Globe,
  CheckCircle2,
  Quote,
  CalendarClock,
  Wallet,
  History,
  TrendingDown,
} from 'lucide-react'
import { formatPula } from '@/lib/format'
import { Button } from '@/components/ui/Button'
import { ChatAnimation } from '@/components/ChatAnimation'
import { WebsiteFormAnimation } from '@/components/WebsiteFormAnimation'
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon'
import { HowItWorksCycle } from '@/components/HowItWorksCycle'
import { WhyChooseSlideshow } from '@/components/WhyChooseSlideshow'
import { Reveal } from '@/components/Reveal'
import { EditableText } from '@/components/editable/EditableText'
import { EditableImage } from '@/components/editable/EditableImage'
import { COMPANY } from '@/lib/constants'
import { useAuth } from '@/context/AuthContext'
import { useIsMobile } from '@/lib/useMediaQuery'

const BASE = import.meta.env.BASE_URL

export function HomePage() {
  const { user, isAdmin } = useAuth()
  const applyTarget = user ? (isAdmin ? '/admin' : '/apply') : '/register'

  return (
    <>
      <HeroSection applyTarget={applyTarget} />

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-20">
        <Reveal className="mb-6 text-center sm:mb-16">
          <EditableText
            as="span"
            contentKey="home.how.eyebrow"
            className="text-sm font-semibold uppercase tracking-widest text-brand-500"
          >
            How it works
          </EditableText>
          <EditableText
            as="h2"
            contentKey="home.how.title"
            className="mt-3 font-display text-3xl font-bold text-brand-900 sm:text-4xl"
          >
            Three simple steps to funding
          </EditableText>
        </Reveal>
        <Reveal>
          <HowItWorksCycle />
        </Reveal>
      </section>

      {/* Two ways to apply */}
      <section className="overflow-x-clip border-y border-brand-100/60 bg-white/70 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-20">
          <Reveal className="mx-auto max-w-2xl text-center">
            <EditableText
              as="span"
              contentKey="home.apply.eyebrow"
              className="text-sm font-semibold uppercase tracking-widest text-brand-500"
            >
              Two ways to apply
            </EditableText>
            <EditableText
              as="h2"
              contentKey="home.apply.title"
              className="mt-3 font-display text-3xl font-bold text-brand-900 sm:text-4xl"
            >
              Apply your way — website or WhatsApp
            </EditableText>
            <EditableText
              as="p"
              multiline
              contentKey="home.apply.text"
              className="mt-4 leading-relaxed text-brand-600"
            >
              Prefer a guided online form? Apply securely on our website. Prefer to chat? Send your
              application straight to us on WhatsApp. Both channels run in parallel, so you choose
              whatever feels easiest.
            </EditableText>
          </Reveal>

          <div className="mt-6 grid items-center gap-6 sm:mt-16 lg:grid-cols-2 lg:gap-10">
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
      <section className="overflow-x-clip">
        <div className="mx-auto grid max-w-6xl items-center gap-6 px-4 py-8 sm:gap-8 sm:px-6 sm:py-20 lg:grid-cols-2 lg:gap-12">
          <Reveal direction="right" className="relative overflow-hidden">
            <div className="absolute -inset-3 rounded-[2.5rem] bg-gradient-to-br from-brand-300/25 to-gold-400/15 blur-2xl" />
            <EditableImage
              contentKey="home.tailored.image"
              src={`${BASE}consultation.png`}
              alt="Mosasana Capital loan officer assisting a client"
              className="relative w-full rounded-3xl border border-white/60 shadow-2xl transition duration-500 ease-out hover:-translate-y-1.5 hover:scale-[1.02] hover:shadow-brand-500/25"
            />
          </Reveal>
          <Reveal direction="left">
            <EditableText
              as="span"
              contentKey="home.tailored.eyebrow"
              className="text-sm font-semibold uppercase tracking-widest text-brand-500"
            >
              Loan solutions tailored for you
            </EditableText>
            <EditableText
              as="h2"
              contentKey="home.tailored.title"
              className="mt-3 font-display text-3xl font-bold text-brand-900 sm:text-4xl"
            >
              Real people, real support
            </EditableText>
            <EditableText
              as="p"
              multiline
              contentKey="home.tailored.text"
              className="mt-4 max-w-md leading-relaxed text-brand-600"
            >
              We take the time to understand your needs and offer short-term loan solutions that fit
              your situation. Our team guides you through every step with honesty and care.
            </EditableText>
            <ul className="mt-6 space-y-3">
              {['Competitive, transparent terms', 'Flexible repayment options', 'Friendly, professional service'].map(
                (item, i) => (
                  <li key={i} className="flex items-center gap-2 text-brand-700">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-growth-500" />
                    <EditableText as="span" contentKey={`home.tailored.point.${i}`}>
                      {item}
                    </EditableText>
                  </li>
                ),
              )}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* Track your loans — image right */}
      <section className="overflow-x-clip border-y border-brand-100/60 bg-white/70 backdrop-blur-sm">
        <div className="mx-auto grid max-w-6xl items-center gap-6 px-4 py-8 sm:gap-8 sm:px-6 sm:py-20 lg:grid-cols-2 lg:gap-12">
          <Reveal direction="right" className="order-1">
            <EditableText
              as="span"
              contentKey="home.track.eyebrow"
              className="text-sm font-semibold uppercase tracking-widest text-brand-500"
            >
              Stay in control
            </EditableText>
            <EditableText
              as="h2"
              contentKey="home.track.title"
              className="mt-3 font-display text-3xl font-bold text-brand-900 sm:text-4xl"
            >
              Track every loan in your dashboard
            </EditableText>
            <EditableText
              as="p"
              multiline
              contentKey="home.track.text"
              className="mt-4 max-w-md leading-relaxed text-brand-600"
            >
              Create an account to submit requests and follow their status in real time — from
              pending to approved and disbursed. All your applications, in one secure place.
            </EditableText>
            <ul className="mt-6 space-y-3">
              {['Real-time application status', 'Secure ID document handling', 'Full application history'].map(
                (item, i) => (
                  <li key={i} className="flex items-center gap-2 text-brand-700">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-growth-500" />
                    <EditableText as="span" contentKey={`home.track.point.${i}`}>
                      {item}
                    </EditableText>
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
      <section className="overflow-x-clip">
        <div className="mx-auto grid max-w-6xl items-center gap-6 px-4 py-8 sm:gap-8 sm:px-6 sm:py-20 lg:grid-cols-2 lg:gap-12">
          <Reveal direction="right" className="relative order-2 overflow-hidden lg:order-1">
            <div className="absolute -inset-3 rounded-[2.5rem] bg-gradient-to-br from-gold-400/20 to-brand-300/25 blur-2xl" />
            <EditableImage
              contentKey="home.testimonial.image"
              src={`${BASE}testimonial-client.png`}
              alt="Satisfied Mosasana Capital customer"
              className="relative w-full rounded-3xl border border-white/60 shadow-2xl transition duration-500 ease-out hover:-translate-y-1.5 hover:scale-[1.02] hover:shadow-brand-500/25"
            />
          </Reveal>
          <Reveal direction="left" className="order-1 lg:order-2">
            <Quote className="h-12 w-12 text-brand-200" />
            <EditableText
              as="blockquote"
              multiline
              contentKey="home.testimonial.quote"
              className="mt-4 font-display text-2xl font-semibold leading-snug text-brand-900 sm:text-3xl"
            >
              {'“Mosasana Capital gave me quick, reliable support exactly when I needed it. The process was simple and the team truly cared.”'}
            </EditableText>
            <EditableText
              as="p"
              contentKey="home.testimonial.name"
              className="mt-6 font-semibold text-brand-800"
            >
              A valued client
            </EditableText>
            <EditableText
              as="p"
              contentKey="home.testimonial.location"
              className="text-sm text-brand-500"
            >
              Gaborone, Botswana
            </EditableText>
          </Reveal>
        </div>
      </section>

      {/* Why choose us — slideshow */}
      <section className="overflow-x-clip border-y border-brand-100/60 bg-white/70 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-20">
          <Reveal className="mb-8 text-center sm:mb-12">
            <EditableText
              as="span"
              contentKey="home.why.eyebrow"
              className="text-sm font-semibold uppercase tracking-widest text-brand-500"
            >
              Why choose us
            </EditableText>
            <EditableText
              as="h2"
              contentKey="home.why.title"
              className="mt-3 font-display text-3xl font-bold text-brand-900 sm:text-4xl"
            >
              Built around what matters to you
            </EditableText>
          </Reveal>
          <Reveal>
            <WhyChooseSlideshow />
          </Reveal>
        </div>
      </section>

      {/* Vision & mission */}
      <section className="overflow-x-clip bg-gradient-to-r from-brand-700 to-brand-600 py-8 text-white sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-6 md:grid-cols-2 md:gap-10">
            <Reveal direction="right">
              <EditableText
                as="h2"
                contentKey="home.vision.title"
                className="font-display text-2xl font-bold sm:text-3xl"
              >
                Our Vision
              </EditableText>
              <EditableText
                as="p"
                multiline
                contentKey="home.vision.text"
                className="mt-4 leading-relaxed text-brand-100"
              >
                {COMPANY.vision}
              </EditableText>
            </Reveal>
            <Reveal direction="left" delay={0.1}>
              <EditableText
                as="h2"
                contentKey="home.mission.title"
                className="font-display text-2xl font-bold sm:text-3xl"
              >
                Our Mission
              </EditableText>
              <EditableText
                as="p"
                multiline
                contentKey="home.mission.text"
                className="mt-4 leading-relaxed text-brand-100"
              >
                {COMPANY.mission}
              </EditableText>
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
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-brand-900/80" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 sm:py-24">
          <Reveal>
            <EditableText
              as="h2"
              contentKey="home.cta.title"
              className="font-display text-3xl font-bold text-white sm:text-4xl"
            >
              Ready to get started?
            </EditableText>
            <p className="mx-auto mt-4 max-w-xl text-brand-100">
              {user
                ? isAdmin
                  ? 'Manage loan applications, enquiries, and users from the admin portal.'
                  : 'Submit a new loan request or track your existing applications from your dashboard.'
                : 'Create an account to apply for a loan and track your applications. You can also reach us on WhatsApp.'}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              {user ? (
                isAdmin ? (
                  <Link to="/admin">
                    <Button size="lg">Go to Admin Portal</Button>
                  </Link>
                ) : (
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
                )
              ) : (
                <Link to="/account">
                  <Button size="lg">
                    Get Started <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
              )}
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}

function HeroSection({ applyTarget }: { applyTarget: string }) {
  const mobile = useIsMobile()
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [7, -7]), { stiffness: 150, damping: 15 })
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-7, 7]), { stiffness: 150, damping: 15 })

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (mobile) return
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

      <div className="relative mx-auto grid max-w-6xl items-center gap-6 px-4 py-8 sm:gap-10 sm:px-6 sm:py-16 lg:grid-cols-2 lg:py-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <EditableText
            as="p"
            contentKey="home.hero.welcome"
            className="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-500 sm:text-base"
          >
            Welcome to Mosasana Capital
          </EditableText>
          <h1 className="font-display text-4xl font-bold leading-[1.1] text-brand-900 sm:text-5xl lg:text-6xl">
            <EditableText as="span" contentKey="home.hero.title1">
              Cash when life
            </EditableText>
            <br />
            <EditableText as="span" contentKey="home.hero.title2" className="text-brand-600">
              {"can't wait"}
            </EditableText>
          </h1>
          <EditableText
            as="p"
            multiline
            contentKey="home.hero.subtitle"
            className="mt-6 max-w-md text-lg leading-relaxed text-brand-600"
          >
            {`${COMPANY.shortName} makes short-term cash loans simple. Apply on our secure website or chat with us on WhatsApp — whichever works best for you.`}
          </EditableText>
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
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          onMouseMove={handleMove}
          onMouseLeave={handleLeave}
          className="relative overflow-hidden [perspective:1000px]"
        >
          <motion.div style={mobile ? undefined : { rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d' }}>
            <div className="absolute -inset-3 rounded-[2.5rem] bg-gradient-to-br from-brand-300/30 to-gold-400/20 blur-2xl" />
            <EditableImage
              contentKey="home.hero.image"
              src={`${BASE}hero-money.png`}
              alt="Happy Mosasana Capital client with cash"
              eager
              className="relative w-full rounded-3xl border border-white/60 shadow-2xl"
            />
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              style={mobile ? undefined : { transform: 'translateZ(50px)' }}
              className="absolute bottom-2 left-2 flex items-center gap-2 rounded-2xl border border-brand-100 bg-white/95 px-3 py-2.5 shadow-xl backdrop-blur-sm sm:-bottom-5 sm:-left-5 sm:gap-3 sm:px-4 sm:py-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-growth-500/10 text-growth-500">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div className="leading-tight">
                <EditableText
                  as="p"
                  contentKey="home.hero.badge.title"
                  className="text-sm font-bold text-brand-900"
                >
                  Loan approved
                </EditableText>
                <EditableText
                  as="p"
                  contentKey="home.hero.badge.subtitle"
                  className="text-xs text-brand-500"
                >
                  Funds on the way
                </EditableText>
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
    const t = setInterval(() => setTick((v) => v + 1), 5200)
    return () => clearInterval(t)
  }, [])

  // Mirrors the real customer dashboard layout (balances, progress, payment history).
  const principal = 5000
  const totalDue = 5500
  const paid = 2000
  const outstanding = totalDue - paid
  const pct = Math.round((paid / totalDue) * 100)

  return (
    <div className="relative w-full max-w-md overflow-hidden">
      <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-brand-300/25 to-gold-400/15 blur-2xl" />
      <div className="relative overflow-hidden rounded-3xl border border-brand-100 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-brand-50 px-5 py-3.5">
          <div>
            <p className="text-xs text-brand-400">My Dashboard</p>
            <p className="font-display text-base font-bold text-brand-900">Welcome back, Client</p>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-growth-500/10 px-2.5 py-1 text-[11px] font-semibold text-growth-600">
            <motion.span
              className="h-1.5 w-1.5 rounded-full bg-growth-500"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            Live
          </span>
        </div>

        <div className="space-y-4 p-4 sm:p-5" key={tick}>
          {/* Active loan hero — same as customer dashboard */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 p-4 text-white shadow-lg shadow-brand-900/15"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-brand-100">Active loan</p>
                <p className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                  {formatPula(outstanding)}
                </p>
                <p className="mt-1 text-xs text-brand-100">Outstanding balance · Groceries · 2 months</p>
              </div>
              <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-[11px] font-semibold capitalize text-brand-800">
                disbursed
              </span>
            </div>

            <div className="mt-4">
              <div className="flex justify-between text-[11px] text-brand-100">
                <span>
                  Paid {formatPula(paid)} of {formatPula(totalDue)}
                </span>
                <span>{pct}%</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/20">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 1.1, delay: 0.25, ease: 'easeOut' }}
                  className="h-full rounded-full bg-emerald-300"
                />
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-brand-100">
              <span className="flex items-center gap-1">
                <CalendarClock className="h-3.5 w-3.5" />
                Due 15 Jul 2026
              </span>
              <span className="flex items-center gap-1">
                <Wallet className="h-3.5 w-3.5" />
                Applied {formatPula(principal)}
              </span>
            </div>
          </motion.div>

          {/* Application card with repayment summary */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.45 }}
            className="overflow-hidden rounded-2xl border border-brand-100"
          >
            <div className="flex items-start justify-between gap-3 border-b border-brand-100 bg-brand-50/50 px-4 py-3">
              <div>
                <p className="text-xl font-bold text-brand-900">{formatPula(principal)}</p>
                <p className="mt-0.5 text-xs text-brand-600">Groceries · 2-month term</p>
              </div>
              <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-[11px] font-semibold capitalize text-brand-800">
                disbursed
              </span>
            </div>

            <div className="space-y-3 p-4">
              <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-brand-50 p-3.5 ring-1 ring-emerald-100">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-emerald-700">
                      <TrendingDown className="h-3 w-3" />
                      Outstanding
                    </p>
                    <p className="text-xl font-bold text-emerald-900">{formatPula(outstanding)}</p>
                  </div>
                  <div className="text-right text-xs text-brand-700">
                    <p>
                      Paid <strong>{formatPula(paid)}</strong>
                    </p>
                    <p className="text-[10px] text-brand-500">of {formatPula(totalDue)} total</p>
                  </div>
                </div>
                <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-emerald-100">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1.1, delay: 0.4, ease: 'easeOut' }}
                    className="h-full rounded-full bg-emerald-500"
                  />
                </div>
                <p className="mt-2 flex items-center gap-1 text-[10px] text-brand-500">
                  <CalendarClock className="h-3 w-3" /> Due 15 Jul 2026
                </p>
              </div>

              <div className="rounded-xl border border-brand-100 bg-white p-2.5">
                <p className="mb-1.5 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-brand-600">
                  <History className="h-3 w-3" />
                  Payment history
                </p>
                <ul className="space-y-1">
                  {[
                    { amount: 1000, date: '8 Jun 2026' },
                    { amount: 1000, date: '22 May 2026' },
                  ].map((p, i) => (
                    <motion.li
                      key={p.date}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.55 + i * 0.12 }}
                      className="flex items-center justify-between rounded-lg bg-brand-50/80 px-2.5 py-1.5 text-xs"
                    >
                      <span className="font-medium text-brand-900">{formatPula(p.amount)}</span>
                      <span className="text-[10px] text-brand-400">{p.date}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
