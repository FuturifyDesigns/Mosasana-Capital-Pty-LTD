import { COMPANY } from './constants'

const { dataProtection: DPA } = COMPANY

export const TERMS_SECTIONS = [
  {
    key: 'terms.agreement',
    title: '1. Agreement',
    body: `By creating an account, applying for a loan, submitting an enquiry, or using any service provided by ${COMPANY.legalName}, you agree to these Terms and Conditions and our Privacy Policy.`,
  },
  {
    key: 'terms.about',
    title: '2. About Mosasana Capital',
    body: `${COMPANY.legalName} is a registered micro lender licensed and regulated by the ${COMPANY.regulator}. ${COMPANY.nbfiraLicense}. Incorporated in Botswana with registration ${COMPANY.companyRegistration}, based in ${COMPANY.location}.`,
  },
  {
    key: 'terms.products',
    title: '3. Loan products',
    body: `We offer short-term loan products from ${COMPANY.loanAmountRangeLabel} with repayment terms from ${COMPANY.loanTermRange}, depending on eligibility and creditworthiness. Approval is not guaranteed. Interest, fees, and schedules are disclosed before you accept any offer.`,
  },
  {
    key: 'terms.responsible',
    title: '4. Responsible borrowing',
    body: `${COMPANY.borrowingCaution} Only borrow what you can afford to repay.`,
  },
  {
    key: 'terms.eligibility',
    title: '5. Eligibility',
    body: `You must be at least 18, a Botswana resident with valid ID, provide accurate information, and hold only one active loan at a time unless we agree otherwise in writing.`,
  },
  {
    key: 'terms.application',
    title: '6. Application and verification',
    body: `Applications may be submitted via our website or WhatsApp. We may request supporting documents and may approve, decline, or request further information. False information may result in rejection or legal action.`,
  },
  {
    key: 'terms.repayments',
    title: '7. Repayments',
    body: `You agree to repay according to your loan agreement. Late or missed payments may result in additional charges, collection action, and credit reporting where permitted by law.`,
  },
  {
    key: 'terms.security',
    title: '8. Account security',
    body: `You are responsible for keeping login credentials secure and notifying us of suspected unauthorised access.`,
  },
  {
    key: 'terms.privacy',
    title: '9. Data protection and privacy',
    body: `We process personal data under ${DPA.actReference}, supervised by the ${DPA.regulator}. See our Privacy Policy for your rights and how we handle identification and financial information.`,
  },
  {
    key: 'terms.credit',
    title: '10. Credit checks and information sharing',
    body: `We may obtain and report information via credit bureaus and share data with ${COMPANY.regulatorShort}, the ${DPA.regulator}, courts, and law enforcement where required or permitted by law.`,
  },
  {
    key: 'terms.automated',
    title: '11. Automated and manual decisions',
    body: `Loan assessments may involve automated tools. Significant decisions are reviewed by authorised staff. You may request human intervention as described in our Privacy Policy.`,
  },
  {
    key: 'terms.regulatory',
    title: '12. Regulatory compliance',
    body: `Mosasana Capital operates under ${COMPANY.regulatorShort} supervision and applicable micro-lending regulations in Botswana.`,
  },
  {
    key: 'terms.liability',
    title: '13. Limitation of liability',
    body: `To the fullest extent permitted by law, Mosasana Capital is not liable for indirect or consequential losses except where liability cannot be excluded under applicable law.`,
  },
  {
    key: 'terms.changes',
    title: '14. Changes',
    body: `We may update these Terms from time to time. Material changes will be posted with an updated effective date. Continued use constitutes acceptance, subject to your rights under applicable law.`,
  },
  {
    key: 'terms.contact',
    title: '15. Contact',
    body: `Questions: ${COMPANY.principalOfficer.email} or ${COMPANY.complianceOfficer.email} (compliance/privacy). Visit our contact page on the website.`,
  },
] as const
