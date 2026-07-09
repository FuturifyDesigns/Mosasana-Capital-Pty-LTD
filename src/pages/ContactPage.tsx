import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { CheckCircle, AlertCircle, MapPin } from 'lucide-react'
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon'
import { PageHero } from '@/components/ui/PageHero'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { PhoneInput } from '@/components/ui/PhoneInput'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'
import { createContactSchema, sanitizeText, type ContactFormData } from '@/lib/validation'
import { checkRateLimit, rateLimitMessage } from '@/lib/rateLimit'
import { COMPANY } from '@/lib/constants'
import { buildWhatsAppContactUrl } from '@/lib/whatsapp'
import { PrivacyConsentField } from '@/components/PrivacyConsentField'
import { EditableOfficerCard } from '@/components/editable/EditableOfficerCard'
import { EditableText } from '@/components/editable/EditableText'
import { useLanguage } from '@/context/LanguageContext'
import { isHoneypotTriggered } from '@/lib/security'
import { normalizeBotswanaPhone } from '@/lib/phone'

export function ContactPage() {
  const { t, language } = useLanguage()
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const schema = useMemo(() => createContactSchema(t), [t])

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(schema),
    defaultValues: { acceptPrivacy: false, companyWebsite: '' },
  })

  const formValues = watch()

  const onSubmit = async (data: ContactFormData) => {
    if (isHoneypotTriggered(data.companyWebsite)) {
      setSuccess(true)
      return
    }

    const limit = checkRateLimit('contact', 4, 5 * 60 * 1000)
    if (!limit.allowed) {
      setError(rateLimitMessage(limit.retryAfterMs))
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const { error: insertError } = await supabase.from('contact_enquiries').insert({
        full_name: sanitizeText(data.fullName),
        email: sanitizeText(data.email).toLowerCase(),
        phone: data.phone ? normalizeBotswanaPhone(sanitizeText(data.phone)) : null,
        subject: sanitizeText(data.subject),
        message: sanitizeText(data.message),
        status: 'new',
      })

      if (insertError) throw insertError
      setSuccess(true)
      reset()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('contact.form.error'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <PageHero
        title={t('contact.hero.title')}
        subtitle={t('contact.hero.subtitle')}
        titleKey={language === 'en' ? 'contact.hero.title' : undefined}
        subtitleKey={language === 'en' ? 'contact.hero.subtitle' : undefined}
      />

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-8 lg:grid-cols-5 lg:gap-10">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <EditableOfficerCard
                role={t('common.principalOfficer')}
                prefix="site.principal"
                defaults={COMPANY.principalOfficer}
              />
            </Card>

            <Card>
              <EditableOfficerCard
                role={t('common.complianceOfficer')}
                prefix="site.compliance"
                defaults={COMPANY.complianceOfficer}
              />
            </Card>

            <Card>
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 text-brand-500" />
                <div>
                  <h3 className="font-semibold text-brand-900">{t('contact.location.title')}</h3>
                  <p className="mt-1 text-sm text-brand-600">
                    <EditableText as="span" multiline contentKey="contact.location.text">
                      {t('contact.location.text')}
                    </EditableText>
                  </p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 text-brand-500" />
                <div>
                  <h3 className="font-semibold text-brand-900">{t('contact.whatsapp.title')}</h3>
                  <p className="mt-1 text-sm text-brand-600">{t('contact.whatsapp.body')}</p>
                  <a
                    href={buildWhatsAppContactUrl(
                      formValues.fullName || 'Client',
                      formValues.message || 'I would like to enquire about your services.',
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-block"
                  >
                    <Button variant="whatsapp" size="sm">
                      <WhatsAppIcon className="h-4 w-4" /> {t('common.whatsappChat')}
                    </Button>
                  </a>
                </div>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-3">
            <Card>
              <h2 className="text-xl font-semibold text-brand-900">{t('contact.form.title')}</h2>

              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 flex items-center gap-2 rounded-xl bg-green-50 p-4 text-green-700"
                >
                  <CheckCircle className="h-5 w-5" />
                  <p className="text-sm">{t('contact.form.success')}</p>
                </motion.div>
              )}

              {error && (
                <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 p-4 text-red-700">
                  <AlertCircle className="h-5 w-5" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
                <input
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  className="pointer-events-none absolute left-[-9999px] h-0 w-0 opacity-0"
                  {...register('companyWebsite')}
                />
                <Input
                  label={t('contact.field.fullName')}
                  required
                  hint={t('contact.field.fullNameHint')}
                  {...register('fullName')}
                  error={errors.fullName?.message}
                />
                <Input
                  label={t('contact.field.email')}
                  type="email"
                  required
                  hint={t('contact.field.emailHint')}
                  {...register('email')}
                  error={errors.email?.message}
                />
                <PhoneInput
                  label={t('contact.field.phone')}
                  hint={t('contact.field.phoneHint')}
                  {...register('phone')}
                  error={errors.phone?.message}
                />
                <Input
                  label={t('contact.field.subject')}
                  required
                  hint={t('contact.field.subjectHint')}
                  {...register('subject')}
                  error={errors.subject?.message}
                />
                <Textarea
                  label={t('contact.field.message')}
                  rows={5}
                  required
                  hint={t('contact.field.messageHint')}
                  {...register('message')}
                  error={errors.message?.message}
                />
                <PrivacyConsentField
                  register={register}
                  error={errors.acceptPrivacy?.message}
                  variant="contact"
                />
                <Button type="submit" className="w-full" loading={submitting}>
                  {t('contact.form.submit')}
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </section>
    </>
  )
}
