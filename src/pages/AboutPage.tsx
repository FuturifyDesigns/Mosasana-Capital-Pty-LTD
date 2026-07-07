import { PageHero } from '@/components/ui/PageHero'
import { Card } from '@/components/ui/Card'
import { Reveal, RevealGroup, RevealItem } from '@/components/Reveal'
import { COMPANY } from '@/lib/constants'
import { Mail, Phone, User } from 'lucide-react'

export function AboutPage() {
  return (
    <>
      <PageHero
        title="About Us"
        subtitle="Learn more about who we are and the values that guide our work."
      />

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-2">
          <Reveal direction="right">
            <h2 className="font-display text-3xl font-bold text-brand-900">
              {COMPANY.name}
            </h2>
            <p className="mt-4 leading-relaxed text-brand-600">
              {COMPANY.shortName} is a trusted provider of short-term financial relief in Botswana.
              We understand that life can present unexpected challenges, and we are here to offer
              accessible, reliable cash loan solutions when you need them most.
            </p>
            <p className="mt-4 leading-relaxed text-brand-600">
              Our team is committed to delivering financial services with integrity, transparency,
              and genuine care — ensuring every client finds peace of mind and the support they deserve.
            </p>
          </Reveal>

          <Reveal direction="left" className="flex items-center justify-center">
            <img
              src={`${import.meta.env.BASE_URL}logo-transparent.png`}
              alt={COMPANY.name}
              className="h-56 w-auto opacity-90"
            />
          </Reveal>
        </div>

        <RevealGroup className="mt-16 grid gap-6 md:grid-cols-2">
          <RevealItem>
            <Card className="h-full">
              <h3 className="font-display text-xl font-bold text-brand-900">Our Vision</h3>
              <p className="mt-3 text-brand-600">{COMPANY.vision}</p>
            </Card>
          </RevealItem>
          <RevealItem>
            <Card className="h-full">
              <h3 className="font-display text-xl font-bold text-brand-900">Our Mission</h3>
              <p className="mt-3 text-brand-600">{COMPANY.mission}</p>
            </Card>
          </RevealItem>
        </RevealGroup>

        <div className="mt-16">
          <Reveal className="mb-8 text-center">
            <h2 className="font-display text-3xl font-bold text-brand-900">Leadership Team</h2>
          </Reveal>
          <RevealGroup className="grid gap-6 md:grid-cols-2">
            <RevealItem>
              <Card hover className="h-full">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600">
                    <User className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-brand-900">Principal Officer</h3>
                    <p className="font-medium text-brand-700">{COMPANY.principalOfficer.name}</p>
                    <a
                      href={`tel:${COMPANY.principalOfficer.cell}`}
                      className="mt-2 flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-800"
                    >
                      <Phone className="h-3.5 w-3.5 shrink-0" /> {COMPANY.principalOfficer.cell}
                    </a>
                    <a
                      href={`mailto:${COMPANY.principalOfficer.email}`}
                      className="flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-800"
                    >
                      <Mail className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{COMPANY.principalOfficer.email}</span>
                    </a>
                  </div>
                </div>
              </Card>
            </RevealItem>

            <RevealItem>
              <Card hover className="h-full">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600">
                    <User className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-brand-900">Compliance Officer</h3>
                    <p className="font-medium text-brand-700">{COMPANY.complianceOfficer.name}</p>
                    <a
                      href={`tel:${COMPANY.complianceOfficer.cell}`}
                      className="mt-2 flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-800"
                    >
                      <Phone className="h-3.5 w-3.5 shrink-0" /> {COMPANY.complianceOfficer.cell}
                    </a>
                    <a
                      href={`mailto:${COMPANY.complianceOfficer.email}`}
                      className="flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-800"
                    >
                      <Mail className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{COMPANY.complianceOfficer.email}</span>
                    </a>
                  </div>
                </div>
              </Card>
            </RevealItem>
          </RevealGroup>
        </div>
      </section>
    </>
  )
}
