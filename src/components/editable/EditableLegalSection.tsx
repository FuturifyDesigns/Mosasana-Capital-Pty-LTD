import { EditableText } from '@/components/editable/EditableText'

interface EditableLegalSectionProps {
  sectionKey: string
  title: string
  body: string
}

export function EditableLegalSection({ sectionKey, title, body }: EditableLegalSectionProps) {
  return (
    <section>
      <EditableText
        as="h2"
        contentKey={`${sectionKey}.title`}
        className="font-display text-xl font-bold text-brand-900"
      >
        {title}
      </EditableText>
      <EditableText
        as="div"
        multiline
        contentKey={`${sectionKey}.body`}
        className="mt-3 block whitespace-pre-line text-sm leading-relaxed sm:text-base"
      >
        {body}
      </EditableText>
    </section>
  )
}
