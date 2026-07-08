import { EditableText } from '@/components/editable/EditableText'
import { COMPANY } from '@/lib/constants'

export function RegulatoryNotice({ className = '' }: { className?: string }) {
  const defaultText = `${COMPANY.borrowingCaution} ${COMPANY.shortName} offers short-term loan products from ${COMPANY.loanAmountRangeLabel} with repayment terms from ${COMPANY.loanTermRange}, depending on customer eligibility. ${COMPANY.legalName} is a registered micro lender licensed and regulated by the ${COMPANY.regulator}. ${COMPANY.nbfiraLicense}. Incorporated in Botswana with the Companies & Intellectual Property Authority (registration ${COMPANY.companyRegistration}). Personal data is processed in accordance with Botswana's ${COMPANY.dataProtection.actReference} under the supervision of the ${COMPANY.dataProtection.regulator}.`

  return (
    <EditableText
      as="p"
      multiline
      contentKey="site.regulatory.notice"
      className={`text-xs leading-relaxed text-brand-400 sm:text-sm ${className}`}
    >
      {defaultText}
    </EditableText>
  )
}
