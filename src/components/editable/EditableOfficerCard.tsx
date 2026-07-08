import { Mail, Phone } from 'lucide-react'
import { EditableText } from '@/components/editable/EditableText'
import { useContent } from '@/context/ContentContext'
import { botswanaTelHref, formatBotswanaPhone, normalizeBotswanaPhone } from '@/lib/phone'

interface OfficerDefaults {
  name: string
  email: string
  cell: string
}

interface EditableOfficerCardProps {
  role: string
  prefix: string
  defaults: OfficerDefaults
  /** footer = dark card styling, light = contact page card */
  variant?: 'footer' | 'light'
}

export function EditableOfficerCard({
  role,
  prefix,
  defaults,
  variant = 'light',
}: EditableOfficerCardProps) {
  const { getText } = useContent()
  const email = getText(`${prefix}.email`, defaults.email)
  const cell = normalizeBotswanaPhone(getText(`${prefix}.cell`, defaults.cell))

  if (variant === 'footer') {
    return (
      <div className="min-w-0 rounded-xl border border-brand-700/50 bg-brand-800/40 p-3 sm:p-4">
        <h3 className="text-[10px] font-semibold uppercase tracking-wider text-gold-400 sm:text-[11px] sm:tracking-widest">
          {role}
        </h3>
        <EditableText
          as="p"
          contentKey={`${prefix}.name`}
          className="mt-1 text-xs font-semibold leading-tight text-white sm:mt-1.5 sm:text-base"
        >
          {defaults.name}
        </EditableText>
        <a
          href={botswanaTelHref(cell)}
          className="mt-1.5 flex items-center gap-1.5 text-[11px] text-brand-300 sm:mt-2 sm:gap-2 sm:text-sm"
        >
          <Phone className="h-3 w-3 shrink-0 text-brand-400 sm:h-3.5 sm:w-3.5" />
          <EditableText as="span" contentKey={`${prefix}.cell`} className="truncate">
            {formatBotswanaPhone(defaults.cell)}
          </EditableText>
        </a>
        <a
          href={`mailto:${email}`}
          className="mt-1 hidden items-start gap-2 text-sm text-brand-300 transition hover:text-white sm:flex"
        >
          <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-400" />
          <EditableText as="span" contentKey={`${prefix}.email`} className="break-all">
            {defaults.email}
          </EditableText>
        </a>
      </div>
    )
  }

  return (
    <div>
      <h3 className="font-semibold text-brand-900">{role}</h3>
      <EditableText as="p" contentKey={`${prefix}.name`} className="mt-1 text-brand-700">
        {defaults.name}
      </EditableText>
      <a
        href={botswanaTelHref(cell)}
        className="mt-3 flex items-center gap-2 text-sm text-brand-600 hover:text-brand-800"
      >
        <Phone className="h-4 w-4" />
        <EditableText as="span" contentKey={`${prefix}.cell`}>
          {formatBotswanaPhone(defaults.cell)}
        </EditableText>
      </a>
      <a
        href={`mailto:${email}`}
        className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-800"
      >
        <Mail className="h-4 w-4" />
        <EditableText as="span" contentKey={`${prefix}.email`}>
          {defaults.email}
        </EditableText>
      </a>
    </div>
  )
}
