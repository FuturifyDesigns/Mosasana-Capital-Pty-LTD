import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { CheckCircle, AlertCircle, Mail, Phone, MapPin, MessageCircle } from 'lucide-react'
import { PageHero } from '@/components/ui/PageHero'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'
import { contactSchema, sanitizeText, type ContactFormData } from '@/lib/validation'
import { COMPANY } from '@/lib/constants'
import { buildWhatsAppContactUrl } from '@/lib/whatsapp'

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
  })

  const formValues = watch()

  const onSubmit = async (data: ContactFormData) => {
    setSubmitting(true)
    setError(null)

    try {
      const { error: insertError } = await supabase.from('contact_enquiries').insert({
        full_name: sanitizeText(data.fullName),
        email: sanitizeText(data.email).toLowerCase(),
        phone: data.phone ? sanitizeText(data.phone) : null,
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
      />

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <h3 className="font-semibold text-brand-900">Principal Officer</h3>
              <p className="mt-1 text-brand-700">{COMPANY.principalOfficer.name}</p>
              <a
                href={`tel:${COMPANY.principalOfficer.cell}`}
                className="mt-3 flex items-center gap-2 text-sm text-brand-600 hover:text-brand-800"
              >
                <Phone className="h-4 w-4" /> {COMPANY.principalOfficer.cell}
              </a>
              <a
                href={`mailto:${COMPANY.principalOfficer.email}`}
                className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-800"
              >
                <Mail className="h-4 w-4" /> {COMPANY.principalOfficer.email}
              </a>
            </Card>

            <Card>
              <h3 className="font-semibold text-brand-900">Compliance Officer</h3>
              <p className="mt-1 text-brand-700">{COMPANY.complianceOfficer.name}</p>
              <a
                href={`tel:${COMPANY.complianceOfficer.cell}`}
                className="mt-3 flex items-center gap-2 text-sm text-brand-600 hover:text-brand-800"
              >
                <Phone className="h-4 w-4" /> {COMPANY.complianceOfficer.cell}
              </a>
              <a
                href={`mailto:${COMPANY.complianceOfficer.email}`}
                className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-800"
              >
                <Mail className="h-4 w-4" /> {COMPANY.complianceOfficer.email}
              </a>
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
                      <MessageCircle className="h-4 w-4" /> Chat on WhatsApp
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
                <Input label="Full Name" required {...register('fullName')} error={errors.fullName?.message} />
                <Input label="Email" type="email" required {...register('email')} error={errors.email?.message} />
                <Input label="Phone (optional)" {...register('phone')} error={errors.phone?.message} />
                <Input label="Subject" required {...register('subject')} error={errors.subject?.message} />
                <Textarea
                  label="Message"
                  rows={5}
                  required
                  {...register('message')}
                  error={errors.message?.message}
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
