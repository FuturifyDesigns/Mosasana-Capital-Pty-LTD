import { LegalPageLayout, LegalSection } from '@/components/LegalPageLayout'
import { COMPANY } from '@/lib/constants'

export function PrivacyPage() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      subtitle={`${COMPANY.legalName} · Effective ${COMPANY.privacyEffectiveDate}`}
    >
      <LegalSection title="1. Introduction">
        <p>
          {COMPANY.legalName} (&quot;Mosasana Capital&quot;, &quot;we&quot;, &quot;our&quot;, &quot;us&quot;)
          is committed to protecting the privacy and confidentiality of personal information collected from
          our clients, employees, and stakeholders. This Privacy Policy explains how we collect, use,
          store, and safeguard personal data in compliance with the Data Protection Act, 2018 of Botswana
          and applicable {COMPANY.regulatorShort} regulations.
        </p>
      </LegalSection>

      <LegalSection title="2. Information we collect">
        <p>We may collect the following categories of personal information:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Identification details:</strong> Full name, national ID number, passport number.
          </li>
          <li>
            <strong>Contact information:</strong> Phone number, email address, residential and postal
            address.
          </li>
          <li>
            <strong>Financial information:</strong> Bank account details, income records, credit history.
          </li>
          <li>
            <strong>Employment details:</strong> Employer name, position, salary information.
          </li>
          <li>
            <strong>Loan-related data:</strong> Loan applications, repayment history, collateral details.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Purpose of collection">
        <p>Personal information is collected and processed for the following purposes:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Assessing loan applications and creditworthiness.</li>
          <li>Managing loan agreements and repayments.</li>
          <li>Complying with regulatory and legal obligations under {COMPANY.regulatorShort}.</li>
          <li>Preventing fraud, money laundering, and financial crime.</li>
          <li>Communicating with clients regarding services, repayments, and updates.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Legal basis">
        <p>We process personal data based on:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Consent provided by the client.</li>
          <li>Contractual necessity to provide lending services.</li>
          <li>Legal obligations under Botswana law.</li>
          <li>Legitimate interests in ensuring responsible lending and risk management.</li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Data sharing">
        <p>We may share personal information with:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>{COMPANY.regulatorShort} and other regulators for compliance.</li>
          <li>Credit reference bureaus for credit checks.</li>
          <li>Law enforcement agencies when required by law.</li>
          <li>
            Third-party service providers (e.g., IT, auditing, debt collection) under strict
            confidentiality agreements.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="6. Data security">
        <p>Mosasana Capital implements appropriate technical and organizational measures to protect personal data, including:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Secure electronic storage systems.</li>
          <li>Restricted access to authorized personnel only.</li>
          <li>Encryption of sensitive financial information.</li>
          <li>Regular audits and compliance checks.</li>
        </ul>
      </LegalSection>

      <LegalSection title="7. Data retention">
        <p>
          Personal information will be retained only as long as necessary to fulfill the purposes outlined
          above or as required by law. Once retention periods expire, data will be securely deleted or
          anonymized.
        </p>
      </LegalSection>

      <LegalSection title="8. Client rights">
        <p>Under Botswana&apos;s Data Protection Act, clients have the right to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Access their personal information.</li>
          <li>Request correction of inaccurate data.</li>
          <li>Withdraw consent for processing (where applicable).</li>
          <li>Request deletion of personal data, subject to legal and contractual obligations.</li>
          <li>Lodge complaints with the Information and Data Protection Commissioner.</li>
        </ul>
      </LegalSection>

      <LegalSection title="9. Cross-border transfers">
        <p>
          If personal data is transferred outside Botswana, Mosasana Capital will ensure adequate
          safeguards are in place in line with the Data Protection Act.
        </p>
      </LegalSection>

      <LegalSection title="10. Policy updates">
        <p>
          This Privacy Policy may be updated periodically to reflect changes in law, regulation, or
          business practices. Clients will be notified of significant changes through official
          communication channels.
        </p>
      </LegalSection>

      <LegalSection title="11. Contact information">
        <p>
          For questions or concerns regarding this Privacy Policy or personal data handling, please
          contact:
        </p>
        <p>
          {COMPANY.legalName}
          <br />
          {COMPANY.location}, Botswana
          <br />
          Email:{' '}
          <a href={`mailto:${COMPANY.principalOfficer.email}`} className="font-semibold text-brand-700">
            {COMPANY.principalOfficer.email}
          </a>
          <br />
          Phone: {COMPANY.principalOfficer.cell}
        </p>
        <p className="text-sm text-brand-500">
          This policy is aligned with Botswana&apos;s Data Protection Act, 2018 and {COMPANY.regulatorShort}&apos;s
          micro lending regulations.
        </p>
      </LegalSection>
    </LegalPageLayout>
  )
}
