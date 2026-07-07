import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Shield, Clock, HeartHandshake, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { FlagStrands } from '@/components/FlagStrands'
import { COMPANY } from '@/lib/constants'

const features = [
  {
    icon: Clock,
    title: 'Fast Processing',
    description: 'Quick review and turnaround on your loan application so you get relief when you need it.',
  },
  {
    icon: Shield,
    title: 'Secure & Trusted',
    description: 'Your data is protected with industry-standard security and transparent lending practices.',
  },
  {
    icon: HeartHandshake,
    title: 'Client-Focused',
    description: 'We deliver financial solutions with integrity, transparency, and genuine care.',
  },
  {
    icon: TrendingUp,
    title: 'Flexible Solutions',
    description: 'Short-term cash loans tailored to help you regain stability and confidence.',
  },
]

export function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-brand-100" />
        <FlagStrands variant="light" />
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-brand-200/40 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-gold-400/10 blur-3xl" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:py-28">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block rounded-full bg-brand-100 px-4 py-1.5 text-sm font-medium text-brand-700">
              Short-Term Financial Relief
            </span>
            <h1 className="mt-6 font-display text-4xl font-bold leading-tight text-brand-900 sm:text-5xl lg:text-6xl">
              Stability &amp; Confidence When You Need It
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-brand-600">
              {COMPANY.shortName} provides accessible, reliable cash loan solutions with integrity and care.
              Apply online or via WhatsApp — whichever works best for you.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/apply">
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
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex justify-center"
          >
            <img
              src={`${import.meta.env.BASE_URL}logo-transparent.png`}
              alt={COMPANY.name}
              className="animate-float h-64 w-auto drop-shadow-xl sm:h-80 lg:h-96"
            />
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mb-12 text-center">
          <h2 className="font-display text-3xl font-bold text-brand-900 sm:text-4xl">Why Choose Us</h2>
          <p className="mx-auto mt-4 max-w-2xl text-brand-600">
            Professional lending services designed around your needs.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, i) => (
            <Card key={feature.title} hover className="text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100 text-brand-600">
                  <feature.icon className="h-7 w-7" />
                </div>
                <h3 className="text-lg font-semibold text-brand-900">{feature.title}</h3>
                <p className="mt-2 text-sm text-brand-600">{feature.description}</p>
              </motion.div>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-gradient-to-r from-brand-700 to-brand-600 py-20 text-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-10 md:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="font-display text-2xl font-bold sm:text-3xl">Our Vision</h2>
              <p className="mt-4 leading-relaxed text-brand-100">{COMPANY.vision}</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 }}
            >
              <h2 className="font-display text-2xl font-bold sm:text-3xl">Our Mission</h2>
              <p className="mt-4 leading-relaxed text-brand-100">{COMPANY.mission}</p>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-display text-3xl font-bold text-brand-900">Ready to Get Started?</h2>
          <p className="mx-auto mt-4 max-w-xl text-brand-600">
            Create an account to track your applications, or apply directly. You can also reach us on WhatsApp.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link to="/register">
              <Button size="lg">Create Account</Button>
            </Link>
            <Link to="/apply">
              <Button variant="gold" size="lg">
                Apply Now
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>
    </>
  )
}
