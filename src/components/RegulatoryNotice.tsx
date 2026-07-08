import { COMPANY } from '@/lib/constants'

export function RegulatoryNotice({ className = '' }: { className?: string }) {
  return (
    <p className={`text-xs leading-relaxed text-brand-400 sm:text-sm ${className}`}>
      {COMPANY.borrowingCaution} {COMPANY.shortName} offers short-term loan products from{' '}
      {COMPANY.loanAmountRangeLabel} with repayment terms from {COMPANY.loanTermRange}, depending on
      customer eligibility. {COMPANY.legalName} is a registered micro lender licensed and regulated by
      the {COMPANY.regulator} (licence {COMPANY.nbfiraLicense}). Incorporated in Botswana with the
      Companies &amp; Intellectual Property Authority (registration {COMPANY.companyRegistration}).
    </p>
  )
}
