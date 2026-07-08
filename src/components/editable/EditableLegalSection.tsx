import { EditableText } from '@/components/editable/EditableText'

interface EditableLegalSectionProps {
  sectionKey: string
  title: string
  body: string
  index?: number
  variant?: 'privacy' | 'terms'
}

function sectionNumber(title: string, index?: number) {
  if (index != null) return String(index)
  const match = title.match(/^(\d+)\./)
  return match?.[1] ?? '•'
}

export function EditableLegalSection({
  sectionKey,
  title,
  body,
  index,
  variant = 'privacy',
}: EditableLegalSectionProps) {
  const num = sectionNumber(title, index)
  const accent =
    variant === 'terms'
      ? 'bg-gradient-to-br from-gold-400 to-gold-600 text-brand-900'
      : 'bg-gradient-to-br from-brand-600 to-brand-500 text-white'

  return (
    <section
      id={sectionKey}
      className="scroll-mt-28 rounded-2xl border border-brand-100 bg-white p-5 shadow-sm transition hover:border-brand-200 hover:shadow-md sm:p-6"
    >
      <div className="flex gap-4 sm:gap-5">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-display text-sm font-bold shadow-sm sm:h-11 sm:w-11 sm:text-base ${accent}`}
        >
          {num}
        </span>
        <div className="min-w-0 flex-1">
          <EditableText
            as="h2"
            contentKey={`${sectionKey}.title`}
            className="font-display text-lg font-bold leading-snug text-brand-900 sm:text-xl"
          >
            {title.replace(/^\d+\.\s*/, '')}
          </EditableText>
          <EditableText
            as="div"
            multiline
            contentKey={`${sectionKey}.body`}
            className="mt-3 block whitespace-pre-line text-sm leading-relaxed text-brand-700 sm:text-[15px] sm:leading-7"
          >
            {body}
          </EditableText>
        </div>
      </div>
    </section>
  )
}
