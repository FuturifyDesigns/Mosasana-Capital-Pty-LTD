import { Link } from 'react-router-dom'
import { LegalPageLayout, LegalSection } from '@/components/LegalPageLayout'
import { RegulatoryNotice } from '@/components/RegulatoryNotice'
import { COMPANY } from '@/lib/constants'

export function TermsPage() {
  return (
    <LegalPageLayout
      title="Terms and Conditions"
      subtitle={`Effective ${COMPANY.termsEffectiveDate} · ${COMPANY.legalName}`}
    >
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        <RegulatoryNotice className="!text-amber-950" />
      </div>

      <LegalSection title="1. Agreement">
        <p>
          By creating an account, applying for a loan, or using any service provided by{' '}
          {COMPANY.legalName} (&quot;Mosasana Capital&quot;, &quot;we&quot;, &quot;us&quot;), you agree
          to these Terms and Conditions. If you do not agree, please do not use our services.
        </p>
      </LegalSection>

      <LegalSection title="2. About Mosasana Capital">
        <p>
          {COMPANY.legalName} is a registered micro lender licensed and regulated by the{' '}
          {COMPANY.regulator} under licence number {COMPANY.nbfiraLicense}. The company is incorporated
          in Botswana with the Companies &amp; Intellectual Property Authority under registration number{' '}
          {COMPANY.companyRegistration}, with operations based in {COMPANY.location}.
        </p>
      </LegalSection>

      <LegalSection title="3. Loan products">
        <p>
          We offer short-term loan products from {COMPANY.loanAmountRangeLabel} with repayment terms from{' '}
          {COMPANY.loanTermRange}, depending on customer eligibility, affordability assessment, and
          creditworthiness. Approval is not guaranteed. Interest rates, fees, and repayment schedules
          will be disclosed before you accept any loan offer.
        </p>
      </LegalSection>

      <LegalSection title="4. Responsible borrowing">
        <p>
          You must only borrow what you can afford to repay. {COMPANY.borrowingCaution} Before applying,
          consider your income, existing obligations, and ability to meet repayments on time.
        </p>
      </LegalSection>

      <LegalSection title="5. Eligibility">
        <ul className="list-disc space-y-2 pl-5">
          <li>You must be at least 18 years of age.</li>
          <li>You must be a resident of Botswana with valid identification.</li>
          <li>You must provide accurate and complete information in your application.</li>
          <li>You may only hold one active loan with Mosasana Capital at a time unless we agree otherwise in writing.</li>
        </ul>
      </LegalSection>

      <LegalSection title="6. Application and verification">
        <p>
          Loan applications may be submitted through our website or WhatsApp. We may request supporting
          documents including proof of identity, proof of address, and income verification. We reserve
          the right to approve, decline, or request further information for any application.
        </p>
      </LegalSection>

      <LegalSection title="7. Repayments">
        <p>
          You agree to repay your loan according to the schedule in your loan agreement. Late or missed
          payments may result in additional charges, collection action, and reporting to credit reference
          agencies where permitted by law.
        </p>
      </LegalSection>

      <LegalSection title="8. Account security">
        <p>
          You are responsible for keeping your login credentials secure and for all activity under your
          account. Notify us immediately if you suspect unauthorized access.
        </p>
      </LegalSection>

      <LegalSection title="9. Privacy">
        <p>
          Your personal information is handled in accordance with our{' '}
          <Link to="/privacy" className="font-semibold text-brand-700 underline-offset-2 hover:underline">
            Privacy Policy
          </Link>{' '}
          and Botswana&apos;s Data Protection Act, 2018.
        </p>
      </LegalSection>

      <LegalSection title="10. Regulatory compliance">
        <p>
          Mosasana Capital operates under the supervision of {COMPANY.regulatorShort} and complies with
          applicable micro-lending regulations in Botswana. We may share information with regulators,
          credit bureaus, and law enforcement where required by law.
        </p>
      </LegalSection>

      <LegalSection title="11. Limitation of liability">
        <p>
          To the fullest extent permitted by law, Mosasana Capital is not liable for indirect,
          incidental, or consequential losses arising from use of our services, except where liability
          cannot be excluded under applicable law.
        </p>
      </LegalSection>

      <LegalSection title="12. Changes">
        <p>
          We may update these Terms and Conditions from time to time. Material changes will be posted on
          this page with an updated effective date. Continued use of our services after changes
          constitutes acceptance.
        </p>
      </LegalSection>

      <LegalSection title="13. Contact">
        <p>
          For questions about these terms, contact us at{' '}
          <a href={`mailto:${COMPANY.principalOfficer.email}`} className="font-semibold text-brand-700">
            {COMPANY.principalOfficer.email}
          </a>{' '}
          or call {COMPANY.principalOfficer.cell}. You may also visit our{' '}
          <Link to="/contact" className="font-semibold text-brand-700 underline-offset-2 hover:underline">
            contact page
          </Link>
          .
        </p>
      </LegalSection>
    </LegalPageLayout>
  )
}
