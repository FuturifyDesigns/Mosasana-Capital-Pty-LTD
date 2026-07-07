import { Link } from 'react-router-dom'
import { Mail, Phone } from 'lucide-react'
import { COMPANY } from '@/lib/constants'

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-brand-200 bg-brand-800 text-brand-100">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <img
            src={`${import.meta.env.BASE_URL}logo-transparent.png`}
            alt={COMPANY.name}
            className="mb-4 h-16 w-auto"
          />
          <p className="text-sm leading-relaxed text-brand-200">{COMPANY.tagline}</p>
        </div>

        <div>
          <h3 className="mb-3 font-semibold text-white">Contact</h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-medium text-brand-100">Principal Officer</p>
              <p>{COMPANY.principalOfficer.name}</p>
              <a href={`tel:${COMPANY.principalOfficer.cell}`} className="flex items-center gap-1.5 hover:text-white">
                <Phone className="h-3.5 w-3.5" /> {COMPANY.principalOfficer.cell}
              </a>
              <a href={`mailto:${COMPANY.principalOfficer.email}`} className="flex items-center gap-1.5 hover:text-white">
                <Mail className="h-3.5 w-3.5" /> {COMPANY.principalOfficer.email}
              </a>
            </div>
            <div>
              <p className="font-medium text-brand-100">Compliance Officer</p>
              <p>{COMPANY.complianceOfficer.name}</p>
              <a href={`tel:${COMPANY.complianceOfficer.cell}`} className="flex items-center gap-1.5 hover:text-white">
                <Phone className="h-3.5 w-3.5" /> {COMPANY.complianceOfficer.cell}
              </a>
              <a href={`mailto:${COMPANY.complianceOfficer.email}`} className="flex items-center gap-1.5 hover:text-white">
                <Mail className="h-3.5 w-3.5" /> {COMPANY.complianceOfficer.email}
              </a>
            </div>
          </div>
        </div>

        <div>
          <h3 className="mb-3 font-semibold text-white">Quick Links</h3>
          <div className="flex flex-col gap-2 text-sm">
            <Link to="/apply" className="hover:text-white">
              Apply for a Loan
            </Link>
            <Link to="/about" className="hover:text-white">
              About Us
            </Link>
            <Link to="/contact" className="hover:text-white">
              Contact Us
            </Link>
            <Link to="/login" className="hover:text-white">
              Client Login
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t border-brand-700">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-center text-sm text-brand-300 sm:flex-row sm:px-6 sm:text-left">
          <p>&copy; {year} {COMPANY.name}. All rights reserved.</p>
          <p>
            Built by{' '}
            <a
              href={COMPANY.builtBy.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-gold-400 hover:text-gold-300"
            >
              {COMPANY.builtBy.name}
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
