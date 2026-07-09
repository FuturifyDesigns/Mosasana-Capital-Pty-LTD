import type { ReactNode } from 'react'
import { EditableText } from '@/components/editable/EditableText'
import { useLanguage } from '@/context/LanguageContext'
import type { TranslationKey } from '@/lib/i18n'

interface TranslatedTextProps {
  tnKey: TranslationKey
  contentKey?: string
  children: ReactNode
  className?: string
  as?: 'p' | 'span' | 'h1' | 'h2' | 'h3' | 'h4' | 'div'
  multiline?: boolean
}

export function TranslatedText({
  tnKey,
  contentKey,
  children,
  className,
  as = 'p',
  multiline,
}: TranslatedTextProps) {
  const { language, t } = useLanguage()

  if (language === 'tn') {
    const Tag = as
    return <Tag className={className}>{t(tnKey)}</Tag>
  }

  if (contentKey) {
    return (
      <EditableText as={as} contentKey={contentKey} className={className} multiline={multiline}>
        {String(children)}
      </EditableText>
    )
  }

  const Tag = as
  return <Tag className={className}>{children}</Tag>
}
