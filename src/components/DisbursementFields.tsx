import { useWatch, type Control, type FieldErrors, type UseFormRegister } from 'react-hook-form'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { DISBURSEMENT_PROVIDERS, isMobileWalletProvider } from '@/lib/constants'
import type { LoanRequestFormData } from '@/lib/validation'

const DISBURSEMENT_OPTIONS = DISBURSEMENT_PROVIDERS.map((p) => ({
  value: p.value,
  label: p.label,
}))

function walletNumberHint(provider: string | undefined): string {
  if (provider === 'orange-money') return 'Enter the 8-digit mobile number registered with Orange Money.'
  if (provider === 'myzaka') return 'Enter the 8-digit mobile number linked to your MyZaka wallet.'
  return 'Enter your bank account number (digits only).'
}

function walletNumberLabel(provider: string | undefined): string {
  if (provider === 'orange-money') return 'Orange Money Number'
  if (provider === 'myzaka') return 'MyZaka Mobile Number'
  return 'Bank Account Number'
}

interface DisbursementFieldsProps {
  register: UseFormRegister<LoanRequestFormData>
  control: Control<LoanRequestFormData>
  errors: FieldErrors<LoanRequestFormData>
}

export function DisbursementFields({ register, control, errors }: DisbursementFieldsProps) {
  const disbursementProvider = useWatch({ control, name: 'disbursementProvider' })
  const isMobileWallet = isMobileWalletProvider(disbursementProvider)

  return (
    <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-4">
      <p className="mb-1 text-sm font-semibold text-brand-800">Loan disbursement details</p>
      <p className="mb-3 text-xs text-brand-500">
        Where should we pay your loan? Choose your bank, Orange Money, or MyZaka.
      </p>
      <div className="space-y-4">
        <Select
          label="Bank / Wallet"
          required
          hint="Banks and mobile money (Orange Money, MyZaka) are listed here."
          options={DISBURSEMENT_OPTIONS}
          {...register('disbursementProvider')}
          error={errors.disbursementProvider?.message}
        />
        <Input
          label="Name on Account"
          required
          hint="Your name as registered with this bank or wallet."
          {...register('bankAccountHolderName')}
          error={errors.bankAccountHolderName?.message}
        />
        <Input
          label={walletNumberLabel(disbursementProvider)}
          required
          inputMode="numeric"
          autoComplete="off"
          hint={walletNumberHint(disbursementProvider)}
          {...register('bankAccountNumber')}
          error={errors.bankAccountNumber?.message}
        />
        {!isMobileWallet && (
          <>
            <Input
              label="Branch Code"
              required
              inputMode="numeric"
              autoComplete="off"
              hint="Your bank branch code (3–6 digits)."
              {...register('bankBranchCode')}
              error={errors.bankBranchCode?.message}
            />
            <Input
              label="Branch Name"
              required
              hint="The name of your bank branch."
              {...register('bankBranchName')}
              error={errors.bankBranchName?.message}
            />
          </>
        )}
      </div>
    </div>
  )
}
