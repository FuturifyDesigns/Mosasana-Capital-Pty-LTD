import { PageHero } from '@/components/ui/PageHero'
import { Card } from '@/components/ui/Card'
import { Reveal, RevealGroup, RevealItem } from '@/components/Reveal'
import { BotswanaFlag } from '@/components/icons/BotswanaFlag'
import { EditableText } from '@/components/editable/EditableText'
import { EditableImage } from '@/components/editable/EditableImage'
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
  Sprout,
  Home,
  BadgeCheck,
  MapPin,
  CalendarClock,
  type LucideIcon,
} from 'lucide-react'

const BASE = import.meta.env.BASE_URL

interface TreeNode {
  icon: LucideIcon
  title: string
  description: string
}

const storyTree: TreeNode[] = [
  {
    icon: Sprout,
    title: 'A place of shelter',
    description:
      'Mosasana is a Setswana word for a temporary structure that shields people from harsh weather while they make long-term habitat plans.',
  },
  {
    icon: Home,
    title: 'Built to relieve',
    description:
      'In the same spirit, Mosasana Capital exists to provide relief — albeit short term — for everyday financial shortfalls.',
  },
  {
    icon: BadgeCheck,
    title: 'Licensed in 2026',
    description:
      'Licensed by the Non Bank Financial Institutions Regulatory Authority (NBFIRA) and held to high customer and ethical standards.',
  },
  {
    icon: MapPin,
    title: 'Grounded in Botswana',
    description:
      'Based in Gaborone, we service clients across the breadth and width of Botswana.',
  },
  {
    icon: CalendarClock,
    title: 'Flexible cash loans',
    description:
      'Short-term loans from 1 to 12 months at a reasonable interest rate, tailored to each customer’s needs.',
  },
]

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
        subtitle="A NBFIRA-licensed Botswana lender providing short-term relief for daily financial shortfalls."
        titleKey="about.hero.title"
        subtitleKey="about.hero.subtitle"
      />

      {/* Who we are */}
      <section className="mx-auto max-w-6xl overflow-x-clip px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
          <Reveal direction="right">
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-brand-700">
              <BotswanaFlag className="h-3.5 w-5 rounded-sm ring-1 ring-black/5" />
              Proudly Botswana
            </span>
            <EditableText
              as="h2"
              contentKey="about.who.title"
              className="mt-5 font-display text-3xl font-bold text-brand-900 sm:text-4xl"
            >
              {COMPANY.name}
            </EditableText>
            <EditableText
              as="p"
              multiline
              contentKey="about.who.p1"
              className="mt-4 leading-relaxed text-brand-600"
            >
              {`${COMPANY.name} was licensed by the Non Bank Financial Institutions Regulatory Authority (NBFIRA) in 2026. Based in Gaborone, we service clients across the breadth and width of Botswana.`}
            </EditableText>
            <EditableText
              as="p"
              multiline
              contentKey="about.who.p2"
              className="mt-4 leading-relaxed text-brand-600"
            >
              {'We offer short-term loans — commonly known as cash loans — ranging from 1 to 12 months at a reasonable interest rate. We pride ourselves in tailoring our offerings to each customer’s needs while upholding high customer and ethical standards.'}
            </EditableText>
          </Reveal>

          <Reveal direction="left" className="relative overflow-hidden">
            <div className="absolute -inset-3 rounded-[2.5rem] bg-gradient-to-br from-brand-300/25 to-gold-400/15 blur-2xl" />
            <div className="relative flex items-center justify-center rounded-3xl border border-white/60 bg-gradient-to-br from-brand-50 to-white p-10 shadow-2xl transition duration-500 ease-out hover:-translate-y-1.5 hover:shadow-brand-500/25 sm:p-14">
              <EditableImage
                contentKey="about.who.image"
                src={`${BASE}logo-transparent.png`}
                alt={COMPANY.name}
                className="w-full max-w-xs transition-transform duration-500 ease-out hover:scale-[1.03]"
                wrapperClassName="max-w-xs"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* Story tree */}
      <section className="border-y border-brand-100/60 bg-gradient-to-b from-brand-50/60 via-white to-white">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:py-24">
          <Reveal className="text-center">
            <EditableText
              as="span"
              contentKey="about.tree.eyebrow"
              className="text-sm font-semibold uppercase tracking-widest text-growth-600"
            >
              What&apos;s in a name
            </EditableText>
            <EditableText
              as="h2"
              contentKey="about.tree.title"
              className="mt-3 font-display text-3xl font-bold text-brand-900 sm:text-4xl"
            >
              Rooted in meaning
            </EditableText>
            <EditableText
              as="p"
              multiline
              contentKey="about.tree.text"
              className="mx-auto mt-4 max-w-2xl leading-relaxed text-brand-600"
            >
              Our story grows from a single Setswana word — follow it from its roots to what we
              offer today.
            </EditableText>
          </Reveal>

          {/* Canopy */}
          <Reveal className="mt-12 flex flex-col items-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-growth-500 to-growth-600 text-white shadow-xl shadow-growth-500/30">
              <Sprout className="h-10 w-10" />
            </div>
          </Reveal>

          {/* Trunk + branches */}
          <div className="relative mt-2">
            {/* central trunk */}
            <div
              className="absolute left-7 top-0 h-full w-1 rounded-full bg-gradient-to-b from-growth-500 via-brand-400 to-brand-600 md:left-1/2 md:-translate-x-1/2"
              aria-hidden="true"
            />

            <RevealGroup className="space-y-8 pt-8">
              {storyTree.map((node, i) => {
                const leftSide = i % 2 === 0
                return (
                  <RevealItem key={node.title}>
                    <div
                      className={`relative flex items-center pl-16 md:pl-0 ${
                        leftSide ? 'md:justify-start' : 'md:justify-end'
                      }`}
                    >
                      {/* branch stub — points from the trunk toward the card */}
                      <span
                        className={`absolute left-7 top-1/2 h-1 w-8 -translate-y-1/2 rounded-full bg-brand-300 md:w-10 ${
                          leftSide ? 'md:left-auto md:right-1/2' : 'md:left-1/2'
                        }`}
                        aria-hidden="true"
                      />
                      {/* node dot sits on the trunk */}
                      <span
                        className="absolute left-7 top-1/2 z-10 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white bg-growth-500 shadow md:left-1/2"
                        aria-hidden="true"
                      />

                      <Card
                        hover
                        className="group w-full md:w-[calc(50%-2.5rem)]"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-500 text-white shadow-lg shadow-brand-600/25 transition-transform duration-500 group-hover:-translate-y-1 group-hover:scale-110">
                            <node.icon className="h-6 w-6" />
                          </div>
                          <div>
                            <EditableText
                              as="h3"
                              contentKey={`about.tree.${i}.title`}
                              className="text-lg font-semibold text-brand-900"
                            >
                              {node.title}
                            </EditableText>
                            <EditableText
                              as="p"
                              multiline
                              contentKey={`about.tree.${i}.desc`}
                              className="mt-1.5 text-sm leading-relaxed text-brand-600"
                            >
                              {node.description}
                            </EditableText>
                          </div>
                        </div>
                      </Card>
                    </div>
                  </RevealItem>
                )
              })}
            </RevealGroup>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="border-y border-brand-100/60 bg-white/70 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
          <Reveal className="mb-12 text-center">
            <EditableText
              as="span"
              contentKey="about.values.eyebrow"
              className="text-sm font-semibold uppercase tracking-widest text-brand-500"
            >
              What we stand for
            </EditableText>
            <EditableText
              as="h2"
              contentKey="about.values.title"
              className="mt-3 font-display text-3xl font-bold text-brand-900 sm:text-4xl"
            >
              Our core values
            </EditableText>
          </Reveal>
          <RevealGroup className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value, i) => (
              <RevealItem key={i}>
                <Card hover className="group h-full text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-500 text-white shadow-lg shadow-brand-600/25 transition-transform duration-500 group-hover:-translate-y-1 group-hover:scale-110">
                    <value.icon className="h-7 w-7" />
                  </div>
                  <EditableText
                    as="h3"
                    contentKey={`about.value.${i}.title`}
                    className="text-lg font-semibold text-brand-900"
                  >
                    {value.title}
                  </EditableText>
                  <EditableText
                    as="p"
                    multiline
                    contentKey={`about.value.${i}.desc`}
                    className="mt-2 text-sm text-brand-600"
                  >
                    {value.description}
                  </EditableText>
                </Card>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
        <RevealGroup className="grid gap-6 md:grid-cols-2">
          <RevealItem>
            <Card hover className="group h-full">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-600 transition-transform duration-500 group-hover:scale-110">
                <Target className="h-6 w-6" />
              </div>
              <EditableText
                as="h3"
                contentKey="about.vision.title"
                className="font-display text-xl font-bold text-brand-900"
              >
                Our Vision
              </EditableText>
              <EditableText
                as="p"
                multiline
                contentKey="about.vision.text"
                className="mt-3 leading-relaxed text-brand-600"
              >
                {COMPANY.vision}
              </EditableText>
            </Card>
          </RevealItem>
          <RevealItem>
            <Card hover className="group h-full">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gold-500/15 text-gold-600 transition-transform duration-500 group-hover:scale-110">
                <Compass className="h-6 w-6" />
              </div>
              <EditableText
                as="h3"
                contentKey="about.mission.title"
                className="font-display text-xl font-bold text-brand-900"
              >
                Our Mission
              </EditableText>
              <EditableText
                as="p"
                multiline
                contentKey="about.mission.text"
                className="mt-3 leading-relaxed text-brand-600"
              >
                {COMPANY.mission}
              </EditableText>
            </Card>
          </RevealItem>
        </RevealGroup>
      </section>

      {/* Leadership team */}
      <section className="border-t border-brand-100/60 bg-white/70 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
          <Reveal className="mb-10 text-center">
            <EditableText
              as="span"
              contentKey="about.team.eyebrow"
              className="text-sm font-semibold uppercase tracking-widest text-brand-500"
            >
              The people behind Mosasana
            </EditableText>
            <EditableText
              as="h2"
              contentKey="about.team.title"
              className="mt-3 font-display text-3xl font-bold text-brand-900 sm:text-4xl"
            >
              Leadership Team
            </EditableText>
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
      <section className="relative overflow-hidden bg-gradient-to-r from-brand-700 to-brand-500 py-12 text-white sm:py-16">
        <div className="absolute -right-10 -top-10 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-12 left-1/4 h-56 w-56 rounded-full bg-gold-400/15 blur-3xl" />
        <div className="relative mx-auto flex max-w-4xl flex-col items-center gap-5 px-4 text-center sm:px-6">
          <BotswanaFlag className="h-14 w-20 rounded-lg shadow-xl ring-2 ring-white/40 transition-transform duration-500 hover:scale-105" />
          <EditableText
            as="h2"
            contentKey="about.banner.title"
            className="font-display text-2xl font-bold sm:text-3xl"
          >
            Proudly Botswana
          </EditableText>
          <EditableText
            as="p"
            multiline
            contentKey="about.banner.text"
            className="max-w-2xl leading-relaxed text-brand-100"
          >
            {`${COMPANY.shortName} is a Botswana business built to serve Batswana — providing accessible, responsible financial support to the communities we call home.`}
          </EditableText>
        </div>
      </section>
    </>
  )
}
