import { PageHero } from '@/components/ui/PageHero'
import { Card } from '@/components/ui/Card'
import { Reveal, RevealGroup, RevealItem } from '@/components/Reveal'
import { BotswanaFlag } from '@/components/icons/BotswanaFlag'
import { COMPANY } from '@/lib/constants'
import {
  Mail,
  Phone,
  User,
  ShieldCheck,
  Eye,
  HeartHandshake,
  Gauge,
  Target,
  Compass,
} from 'lucide-react'

const BASE = import.meta.env.BASE_URL

const values = [
  {
    icon: ShieldCheck,
    title: 'Integrity',
    description: 'We do the right thing, always — honest advice and responsible lending you can trust.',
  },
  {
    icon: Eye,
    title: 'Transparency',
    description: 'Clear terms with no hidden surprises, so you always know exactly where you stand.',
  },
  {
    icon: HeartHandshake,
    title: 'Client Care',
    description: 'Every client is treated with respect, empathy, and genuine personal attention.',
  },
  {
    icon: Gauge,
    title: 'Speed',
    description: 'Fast, efficient processing so relief reaches you when you need it most.',
  },
]

export function AboutPage() {
  return (
    <>
      <PageHero
        title="About Us"
        subtitle="Learn more about who we are and the values that guide our work."
      />

      {/* Who we are */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal direction="right">
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-brand-700">
              <BotswanaFlag className="h-3.5 w-5 rounded-sm ring-1 ring-black/5" />
              Proudly Botswana
            </span>
            <h2 className="mt-5 font-display text-3xl font-bold text-brand-900 sm:text-4xl">
              {COMPANY.name}
            </h2>
            <p className="mt-4 leading-relaxed text-brand-600">
              {COMPANY.shortName} is a trusted provider of short-term financial relief in Botswana.
              We understand that life can present unexpected challenges, and we are here to offer
              accessible, reliable cash loan solutions when you need them most.
            </p>
            <p className="mt-4 leading-relaxed text-brand-600">
              Our team is committed to delivering financial services with integrity, transparency,
              and genuine care — ensuring every client finds peace of mind and the support they
              deserve.
            </p>
          </Reveal>

          <Reveal direction="left" className="relative">
            <div className="absolute -inset-3 rounded-[2.5rem] bg-gradient-to-br from-brand-300/25 to-gold-400/15 blur-2xl" />
            <img
              src={`${BASE}consultation.png`}
              alt="Mosasana Capital team assisting a client"
              className="relative w-full rounded-3xl border border-white/60 shadow-2xl transition duration-500 ease-out hover:-translate-y-1.5 hover:scale-[1.02] hover:shadow-brand-500/25"
            />
          </Reveal>
        </div>
      </section>

      {/* Values */}
      <section className="border-y border-brand-100/60 bg-white/70 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
          <Reveal className="mb-12 text-center">
            <span className="text-sm font-semibold uppercase tracking-widest text-brand-500">
              What we stand for
            </span>
            <h2 className="mt-3 font-display text-3xl font-bold text-brand-900 sm:text-4xl">
              Our core values
            </h2>
          </Reveal>
          <RevealGroup className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value) => (
              <RevealItem key={value.title}>
                <Card hover className="group h-full text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-500 text-white shadow-lg shadow-brand-600/25 transition-transform duration-500 group-hover:-translate-y-1 group-hover:scale-110">
                    <value.icon className="h-7 w-7" />
                  </div>
                  <h3 className="text-lg font-semibold text-brand-900">{value.title}</h3>
                  <p className="mt-2 text-sm text-brand-600">{value.description}</p>
                </Card>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
        <RevealGroup className="grid gap-6 md:grid-cols-2">
          <RevealItem>
            <Card hover className="group h-full">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-600 transition-transform duration-500 group-hover:scale-110">
                <Target className="h-6 w-6" />
              </div>
              <h3 className="font-display text-xl font-bold text-brand-900">Our Vision</h3>
              <p className="mt-3 leading-relaxed text-brand-600">{COMPANY.vision}</p>
            </Card>
          </RevealItem>
          <RevealItem>
            <Card hover className="group h-full">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gold-500/15 text-gold-600 transition-transform duration-500 group-hover:scale-110">
                <Compass className="h-6 w-6" />
              </div>
              <h3 className="font-display text-xl font-bold text-brand-900">Our Mission</h3>
              <p className="mt-3 leading-relaxed text-brand-600">{COMPANY.mission}</p>
            </Card>
          </RevealItem>
        </RevealGroup>
      </section>

      {/* Leadership team */}
      <section className="border-t border-brand-100/60 bg-white/70 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
          <Reveal className="mb-10 text-center">
            <span className="text-sm font-semibold uppercase tracking-widest text-brand-500">
              The people behind Mosasana
            </span>
            <h2 className="mt-3 font-display text-3xl font-bold text-brand-900 sm:text-4xl">
              Leadership Team
            </h2>
          </Reveal>
          <RevealGroup className="grid gap-6 md:grid-cols-2">
            {[
              { role: 'Principal Officer', ...COMPANY.principalOfficer },
              { role: 'Compliance Officer', ...COMPANY.complianceOfficer },
            ].map((officer) => (
              <RevealItem key={officer.email}>
                <Card hover className="group h-full">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-400 text-white shadow-lg shadow-brand-600/25 transition-transform duration-500 group-hover:scale-110">
                      <User className="h-7 w-7" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs font-semibold uppercase tracking-widest text-brand-500">
                        {officer.role}
                      </h3>
                      <p className="mt-0.5 text-lg font-semibold text-brand-900">{officer.name}</p>
                      <a
                        href={`tel:${officer.cell.replace(/\s/g, '')}`}
                        className="mt-2 flex items-center gap-1.5 text-sm text-brand-600 transition hover:text-brand-800"
                      >
                        <Phone className="h-3.5 w-3.5 shrink-0" /> {officer.cell}
                      </a>
                      <a
                        href={`mailto:${officer.email}`}
                        className="flex items-center gap-1.5 text-sm text-brand-600 transition hover:text-brand-800"
                      >
                        <Mail className="h-3.5 w-3.5 shrink-0" />{' '}
                        <span className="truncate">{officer.email}</span>
                      </a>
                    </div>
                  </div>
                </Card>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* Proudly Botswana banner */}
      <section className="relative overflow-hidden bg-gradient-to-r from-brand-700 to-brand-500 py-16 text-white">
        <div className="absolute -right-10 -top-10 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-12 left-1/4 h-56 w-56 rounded-full bg-gold-400/15 blur-3xl" />
        <div className="relative mx-auto flex max-w-4xl flex-col items-center gap-5 px-4 text-center sm:px-6">
          <BotswanaFlag className="h-14 w-20 rounded-lg shadow-xl ring-2 ring-white/40 transition-transform duration-500 hover:scale-105" />
          <h2 className="font-display text-2xl font-bold sm:text-3xl">Proudly Botswana</h2>
          <p className="max-w-2xl leading-relaxed text-brand-100">
            {COMPANY.shortName} is a Botswana business built to serve Batswana — providing accessible,
            responsible financial support to the communities we call home.
          </p>
        </div>
      </section>
    </>
  )
}
