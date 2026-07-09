import { Wallet } from 'lucide-react'
import {
  getDisbursementProviderLabel,
  getDisbursementTypeLabel,
  isMobileWalletProvider,
} from '@/lib/constants'

interface DisbursementDetailsProps {
  disbursementType?: string | null
  bankName?: string | null
  bankAccountName?: string | null
  bankAccountNumber?: string | null
  bankBranchCode?: string | null
  bankBranchName?: string | null
  compact?: boolean
}

export function DisbursementDetails({
  disbursementType,
  bankName,
  bankAccountName,
  bankAccountNumber,
  bankBranchCode,
  bankBranchName,
  compact = false,
}: DisbursementDetailsProps) {
  if (!bankName && !bankAccountNumber) return null

  const mobile = isMobileWalletProvider(bankName) || disbursementType === 'mobile'
  const numberLabel = mobile ? 'Wallet number' : 'Account number'

  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-brand-600">
        <span className="flex items-center gap-1.5">
          <Wallet className="h-3.5 w-3.5 text-brand-400" />
          {getDisbursementProviderLabel(bankName)}
          {bankAccountName ? ` · ${bankAccountName}` : ''}
          {bankAccountNumber ? ` · ${bankAccountNumber}` : ''}
        </span>
        {!mobile && (bankBranchCode || bankBranchName) && (
          <span className="text-brand-500">
            Branch: {bankBranchCode || '—'}
            {bankBranchName ? ` (${bankBranchName})` : ''}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-brand-100 bg-brand-50/60 p-3 text-sm text-brand-700">
      <p className="mb-2 flex items-center gap-1.5 font-semibold text-brand-800">
        <Wallet className="h-4 w-4 text-brand-500" />
        Loan payout details
        {disbursementType && (
          <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-600 ring-1 ring-brand-100">
            {getDisbursementTypeLabel(disbursementType)}
          </span>
        )}
      </p>
      <dl className="grid gap-1.5 sm:grid-cols-2">
        <div>
          <dt className="text-xs text-brand-500">{mobile ? 'Wallet' : 'Bank'}</dt>
          <dd className="font-medium text-brand-900">{getDisbursementProviderLabel(bankName)}</dd>
        </div>
        {bankAccountName && (
          <div>
            <dt className="text-xs text-brand-500">Name on account</dt>
            <dd className="font-medium text-brand-900">{bankAccountName}</dd>
          </div>
        )}
        {bankAccountNumber && (
          <div>
            <dt className="text-xs text-brand-500">{numberLabel}</dt>
            <dd className="font-medium text-brand-900">{bankAccountNumber}</dd>
          </div>
        )}
        {!mobile && bankBranchCode && (
          <div>
            <dt className="text-xs text-brand-500">Branch code</dt>
            <dd className="font-medium text-brand-900">{bankBranchCode}</dd>
          </div>
        )}
        {!mobile && bankBranchName && (
          <div className="sm:col-span-2">
            <dt className="text-xs text-brand-500">Branch name</dt>
            <dd className="font-medium text-brand-900">{bankBranchName}</dd>
          </div>
        )}
      </dl>
    </div>
  )
}
