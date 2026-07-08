import { COMPANY } from './constants'

const { dataProtection: DPA } = COMPANY

export const PRIVACY_SECTIONS = [
  {
    key: 'privacy.intro',
    title: '1. Introduction and data controller',
    body: `${COMPANY.legalName} ("Mosasana Capital", "we", "our", "us") is the data controller responsible for your personal data when you use our website, client portal, WhatsApp channels, or other lending services.

This Privacy Policy explains how we collect, use, store, share, and protect personal data in compliance with Botswana's ${DPA.actReference} (effective ${DPA.actEffectiveDate}), the ${COMPANY.regulatorShort} micro-lending framework, and other applicable laws.

We process personal data lawfully, fairly, transparently, and only for specified purposes. We apply data minimisation, accuracy, storage limitation, integrity, confidentiality, and accountability in line with the Act.`,
  },
  {
    key: 'privacy.scope',
    title: '2. Scope',
    body: `This policy applies to:
• Visitors to ${COMPANY.shortName}'s website and online forms
• Registered clients using our dashboard, loan application, and account services
• Individuals who contact us by email, phone, WhatsApp, or enquiry forms
• Loan applicants and borrowers, including via WhatsApp-assisted applications

It does not apply to personal data processed purely for household or personal activities unrelated to our business.`,
  },
  {
    key: 'privacy.collect',
    title: '3. Personal data we collect',
    body: `Depending on your relationship with us, we may collect identity data, contact data, financial data, employment data, application data, account data, communications, and technical data (such as browser type, IP address, and cookies).`,
  },
  {
    key: 'privacy.sensitive',
    title: '4. Sensitive personal data',
    body: `We only collect sensitive personal data where necessary for lending, fraud prevention, or legal compliance, and where we have a lawful basis — typically your explicit consent, contractual necessity, or a legal obligation. Uploading an ID document or submitting a loan application constitutes consent to process that sensitive data for the purposes described in this policy.`,
  },
  {
    key: 'privacy.use',
    title: '5. How and why we use personal data',
    body: `We use personal data to register accounts, assess applications, administer loans, communicate with clients, prevent fraud, comply with regulators, respond to enquiries, improve security, and defend legal claims. We do not use personal data for incompatible purposes without informing you.`,
  },
  {
    key: 'privacy.basis',
    title: '6. Lawful bases for processing',
    body: `We rely on consent, contract, legal obligation, and legitimate interests (such as responsible lending and security). Where consent is the basis, you may withdraw it at any time, subject to legal and contractual limits.`,
  },
  {
    key: 'privacy.automated',
    title: '7. Automated processing and loan decisions',
    body: `We may use automated systems to assist loan reviews. A human decision-maker is involved in approval or rejection. You may request human review of any decision that significantly affects you.`,
  },
  {
    key: 'privacy.cookies',
    title: '8. Cookies and similar technologies',
    body: `Our website uses essential cookies to keep you signed in and operate core features. Additional cookies are used only with your consent via our cookie banner.`,
  },
  {
    key: 'privacy.sharing',
    title: '9. Sharing personal data',
    body: `We may share data with ${COMPANY.regulatorShort}, the ${DPA.regulator}, credit bureaus, payment providers, professional advisers, technology processors, and law enforcement where required by law. We do not sell personal data.`,
  },
  {
    key: 'privacy.transfers',
    title: '10. Data processors and cross-border transfers',
    body: `We use trusted processors for hosting, authentication, and optional sign-in services. Where data is transferred outside Botswana, we implement appropriate safeguards as required by the ${DPA.actName}.`,
  },
  {
    key: 'privacy.security',
    title: '11. Data security',
    body: `We use encryption, access controls, secure document storage, monitoring, and staff training. No method of transmission is completely secure — please protect your account credentials.`,
  },
  {
    key: 'privacy.retention',
    title: '12. Data retention',
    body: `We retain personal data only as long as necessary for lending, legal, regulatory, and dispute-resolution purposes, then securely delete or anonymise it where possible.`,
  },
  {
    key: 'privacy.rights',
    title: '13. Your rights as a data subject',
    body: `Under ${DPA.actReference}, you have the right to be informed, access, correct, erase, restrict, port, object, avoid solely automated decisions where applicable, and lodge a complaint with the ${DPA.regulator}. We respond within ${DPA.responseDays} days where possible.`,
  },
  {
    key: 'privacy.marketing',
    title: '14. Direct marketing',
    body: `We will not send marketing communications without consent where required by law. You may opt out at any time.`,
  },
  {
    key: 'privacy.breaches',
    title: '15. Personal data breaches',
    body: `If a breach is likely to risk your rights, we will notify the ${DPA.regulator} within 72 hours where required and inform affected data subjects without undue delay when high risk applies.`,
  },
  {
    key: 'privacy.children',
    title: '16. Children',
    body: `Our services are for persons aged 18 and over. We do not knowingly collect data from children.`,
  },
  {
    key: 'privacy.contact',
    title: '17. Contact and privacy enquiries',
    body: `Data protection contact: ${COMPANY.complianceOfficer.name}, ${COMPANY.legalName}, ${COMPANY.location}, Botswana. Email: ${COMPANY.complianceOfficer.email}. Phone: +267 ${COMPANY.complianceOfficer.cell}. Principal officer: ${COMPANY.principalOfficer.name} — ${COMPANY.principalOfficer.email}. You may lodge a complaint with the ${DPA.regulator}.`,
  },
  {
    key: 'privacy.changes',
    title: '18. Changes to this policy',
    body: `We may update this Privacy Policy to reflect changes in law or our practices. Material changes will be posted here with an updated effective date.`,
  },
] as const
