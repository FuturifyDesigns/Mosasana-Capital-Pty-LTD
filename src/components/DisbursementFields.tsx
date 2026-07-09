import { useWatch, type Control, type FieldErrors, type UseFormRegister } from 'react-hook-form'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useLanguage } from '@/context/LanguageContext'
import { DISBURSEMENT_PROVIDERS, isMobileWalletProvider } from '@/lib/constants'
import type { LoanRequestFormData } from '@/lib/validation'

interface DisbursementFieldsProps {
  register: UseFormRegister<LoanRequestFormData>
  control: Control<LoanRequestFormData>
  errors: FieldErrors<LoanRequestFormData>
}

export function DisbursementFields({ register, control, errors }: DisbursementFieldsProps) {
  const { t } = useLanguage()
  const disbursementProvider = useWatch({ control, name: 'disbursementProvider' })
  const isMobileWallet = isMobileWalletProvider(disbursementProvider)

  const disbursementOptions = DISBURSEMENT_PROVIDERS.map((p) => ({
    value: p.value,
    label: p.label,
  }))

  const accountNumberLabel =
    disbursementProvider === 'orange-money'
      ? t('apply.disbursement.orangeNumber')
      : disbursementProvider === 'myzaka'
        ? t('apply.disbursement.myzakaNumber')
        : t('apply.disbursement.bankNumber')

  const accountNumberHint =
    disbursementProvider === 'orange-money'
      ? t('apply.disbursement.orangeHint')
      : disbursementProvider === 'myzaka'
        ? t('apply.disbursement.myzakaHint')
        : t('apply.disbursement.bankHint')

  return (
    <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-4">
      <p className="mb-1 text-sm font-semibold text-brand-800">{t('apply.disbursement.title')}</p>
      <p className="mb-3 text-xs text-brand-500">{t('apply.disbursement.intro')}</p>
      <div className="space-y-4">
        <Select
          label={t('apply.disbursement.provider')}
          required
          hint={t('apply.disbursement.providerHint')}
          options={disbursementOptions}
          {...register('disbursementProvider')}
          error={errors.disbursementProvider?.message}
        />
        <Input
          label={t('apply.disbursement.accountName')}
          required
          hint={t('apply.disbursement.accountNameHint')}
          {...register('bankAccountHolderName')}
          error={errors.bankAccountHolderName?.message}
        />
        <Input
          label={accountNumberLabel}
          required
          inputMode="numeric"
          autoComplete="off"
          hint={accountNumberHint}
          {...register('bankAccountNumber')}
          error={errors.bankAccountNumber?.message}
        />
        {!isMobileWallet && (
          <>
            <Input
              label={t('apply.disbursement.branchCode')}
              required
              inputMode="numeric"
              autoComplete="off"
              hint={t('apply.disbursement.branchCodeHint')}
              {...register('bankBranchCode')}
              error={errors.bankBranchCode?.message}
            />
            <Input
              label={t('apply.disbursement.branchName')}
              required
              hint={t('apply.disbursement.branchNameHint')}
              {...register('bankBranchName')}
              error={errors.bankBranchName?.message}
            />
          </>
        )}
      </div>
    </div>
  )
}
