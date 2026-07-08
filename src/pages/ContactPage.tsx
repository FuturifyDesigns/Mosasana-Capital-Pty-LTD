import { useState } from 'react'
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
import { contactSchema, sanitizeText, type ContactFormData } from '@/lib/validation'
import { checkRateLimit, rateLimitMessage } from '@/lib/rateLimit'
import { COMPANY } from '@/lib/constants'
import { buildWhatsAppContactUrl } from '@/lib/whatsapp'
import { PrivacyConsentField } from '@/components/PrivacyConsentField'
import { EditableOfficerCard } from '@/components/editable/EditableOfficerCard'
import { EditableText } from '@/components/editable/EditableText'
import { normalizeBotswanaPhone } from '@/lib/phone'

export function ContactPage() {
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: { acceptPrivacy: false },
  })

  const formValues = watch()

  const onSubmit = async (data: ContactFormData) => {
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
      setError(err instanceof Error ? err.message : 'Failed to send enquiry. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <PageHero
        title="Contact Us"
        subtitle="Have a question? Reach out to our team — we're here to help."
        titleKey="contact.hero.title"
        subtitleKey="contact.hero.subtitle"
      />

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-8 lg:grid-cols-5 lg:gap-10">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <EditableOfficerCard
                role="Principal Officer"
                prefix="site.principal"
                defaults={COMPANY.principalOfficer}
              />
            </Card>

            <Card>
              <EditableOfficerCard
                role="Compliance Officer"
                prefix="site.compliance"
                defaults={COMPANY.complianceOfficer}
              />
            </Card>

            <Card>
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 text-brand-500" />
                <div>
                  <h3 className="font-semibold text-brand-900">Where we are</h3>
                  <p className="mt-1 text-sm text-brand-600">
                    <EditableText as="span" multiline contentKey="contact.location.text">
                      {`Based in ${COMPANY.location}, serving clients across ${COMPANY.serviceArea}.`}
                    </EditableText>
                  </p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 text-brand-500" />
                <div>
                  <h3 className="font-semibold text-brand-900">Prefer WhatsApp?</h3>
                  <p className="mt-1 text-sm text-brand-600">
                    Message us directly for faster responses.
                  </p>
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
                      <WhatsAppIcon className="h-4 w-4" /> Chat on WhatsApp
                    </Button>
                  </a>
                </div>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-3">
            <Card>
              <h2 className="text-xl font-semibold text-brand-900">Send an Enquiry</h2>

              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 flex items-center gap-2 rounded-xl bg-green-50 p-4 text-green-700"
                >
                  <CheckCircle className="h-5 w-5" />
                  <p className="text-sm">Your enquiry has been sent. We&apos;ll get back to you soon.</p>
                </motion.div>
              )}

              {error && (
                <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 p-4 text-red-700">
                  <AlertCircle className="h-5 w-5" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
                <Input
                  label="Full Name"
                  required
                  hint="Letters only — no numbers."
                  {...register('fullName')}
                  error={errors.fullName?.message}
                />
                <Input
                  label="Email"
                  type="email"
                  required
                  hint="We'll reply to this address."
                  {...register('email')}
                  error={errors.email?.message}
                />
                <PhoneInput
                  label="Phone (optional)"
                  hint="Enter your 8-digit mobile number after +267."
                  {...register('phone')}
                  error={errors.phone?.message}
                />
                <Input
                  label="Subject"
                  required
                  hint="A short summary of your enquiry."
                  {...register('subject')}
                  error={errors.subject?.message}
                />
                <Textarea
                  label="Message"
                  rows={5}
                  required
                  hint="Tell us how we can help — at least 10 characters."
                  {...register('message')}
                  error={errors.message?.message}
                />
                <PrivacyConsentField
                  register={register}
                  error={errors.acceptPrivacy?.message}
                  variant="contact"
                />
                <Button type="submit" className="w-full" loading={submitting}>
                  Send Enquiry
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </section>
    </>
  )
}
