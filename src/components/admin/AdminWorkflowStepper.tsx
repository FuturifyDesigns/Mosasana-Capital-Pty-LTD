import { Check, Lock } from 'lucide-react'
import {
  ADMIN_WORKFLOW_STEPS,
  getActiveWorkflowStepId,
  getWorkflowStepState,
} from '@/lib/loanStatus'
import type { LoanRequest } from '@/lib/supabase'

interface AdminWorkflowStepperProps {
  loan: LoanRequest
}

export function AdminWorkflowStepper({ loan }: AdminWorkflowStepperProps) {
  const active = getActiveWorkflowStepId(loan)
  if (active === 'closed') return null

  return (
    <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {ADMIN_WORKFLOW_STEPS.map((step, index) => {
        const state = getWorkflowStepState(loan, step.id)
        const isCurrent = state === 'current'
        const isComplete = state === 'complete'
        const isLocked = state === 'locked'

        return (
          <li
            key={step.id}
            className={`rounded-xl border p-3 ${
              isCurrent
                ? 'border-brand-400 bg-brand-50 ring-2 ring-brand-200'
                : isComplete
                  ? 'border-emerald-200 bg-emerald-50/70'
                  : 'border-brand-100 bg-brand-50/30 opacity-70'
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  isCurrent
                    ? 'bg-brand-600 text-white'
                    : isComplete
                      ? 'bg-emerald-600 text-white'
                      : 'bg-brand-200 text-brand-600'
                }`}
              >
                {isComplete ? <Check className="h-3.5 w-3.5" /> : isLocked ? <Lock className="h-3 w-3" /> : index + 1}
              </span>
              <p className={`text-xs font-semibold ${isCurrent ? 'text-brand-900' : 'text-brand-700'}`}>
                {step.label}
                {isCurrent && <span className="ml-1 text-[10px] font-bold uppercase text-brand-500">Now</span>}
              </p>
            </div>
            <p className="mt-1.5 pl-8 text-[10px] leading-snug text-brand-600">{step.description}</p>
          </li>
        )
      })}
    </ol>
  )
}
