// Supabase Edge Function: loan-reminders
//
// Sends repayment reminders to clients by email (Brevo) and, optionally,
// WhatsApp (Meta WhatsApp Cloud API). Intended to be invoked once a day by a
// pg_cron schedule (see supabase/schema.sql).
//
// Deploy:
//   supabase functions deploy loan-reminders --no-verify-jwt
//
// Required secrets (supabase secrets set KEY=value):
//   BREVO_API_KEY          - Brevo (Sendinblue) transactional API key
//   BREVO_SENDER_EMAIL     - verified sender, e.g. noreply@mosasanacapital.com
//   BREVO_SENDER_NAME      - e.g. "Mosasana Capital"
// Optional (enable WhatsApp reminders):
//   WHATSAPP_TOKEN             - Meta WhatsApp Cloud API access token
//   WHATSAPP_PHONE_NUMBER_ID   - the WhatsApp business phone number ID
//   WHATSAPP_TEMPLATE          - approved template name (default: loan_reminder)
//   WHATSAPP_TEMPLATE_LANG     - template language code (default: en)
//
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided automatically.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const DAY_MS = 24 * 60 * 60 * 1000
const ACTIVE_STATUSES = ['approved', 'disbursed']

interface LoanRow {
  id: string
  full_name: string
  email: string
  phone: string
  loan_amount: number
  total_repayable: number | null
  amount_paid: number | null
  due_date: string | null
  term_months: number | null
  created_at: string
  status: string
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

function getDueDate(loan: LoanRow): Date | null {
  if (loan.due_date) return new Date(loan.due_date)
  if (loan.term_months) return addMonths(new Date(loan.created_at), loan.term_months)
  return null
}

/** Which reminder milestone (if any) applies today. */
function milestoneFor(daysLeft: number): string | null {
  if (daysLeft === 7) return 'd-7'
  if (daysLeft === 3) return 'd-3'
  if (daysLeft === 1) return 'd-1'
  if (daysLeft === 0) return 'd-0'
  if (daysLeft < 0) return 'overdue'
  return null
}

function messageFor(loan: LoanRow, daysLeft: number, balanceLabel: string): { subject: string; body: string } {
  if (daysLeft < 0) {
    return {
      subject: 'Your Mosasana Capital loan repayment is overdue',
      body: `Hi ${loan.full_name}, your loan repayment of ${balanceLabel} is overdue by ${Math.abs(daysLeft)} day(s). Please make your payment as soon as possible to avoid additional charges. Thank you — Mosasana Capital.`,
    }
  }
  if (daysLeft === 0) {
    return {
      subject: 'Your Mosasana Capital loan repayment is due today',
      body: `Hi ${loan.full_name}, this is a reminder that your loan repayment of ${balanceLabel} is due today. Thank you — Mosasana Capital.`,
    }
  }
  return {
    subject: `Reminder: loan repayment due in ${daysLeft} day(s)`,
    body: `Hi ${loan.full_name}, your loan repayment of ${balanceLabel} is due in ${daysLeft} day(s). Please ensure funds are available. Thank you — Mosasana Capital.`,
  }
}

async function sendEmail(to: string, name: string, subject: string, body: string): Promise<boolean> {
  const apiKey = Deno.env.get('BREVO_API_KEY')
  const senderEmail = Deno.env.get('BREVO_SENDER_EMAIL')
  const senderName = Deno.env.get('BREVO_SENDER_NAME') ?? 'Mosasana Capital'
  if (!apiKey || !senderEmail) return false

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': apiKey, 'Content-Type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      sender: { email: senderEmail, name: senderName },
      to: [{ email: to, name }],
      subject,
      htmlContent: `<p>${body.replace(/\n/g, '<br>')}</p>`,
    }),
  })
  return res.ok
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  // Botswana numbers: prefix country code if an 8-digit local number was given
  if (digits.length === 8) return `267${digits}`
  return digits
}

async function sendWhatsApp(phone: string, params: string[]): Promise<boolean> {
  const token = Deno.env.get('WHATSAPP_TOKEN')
  const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')
  const template = Deno.env.get('WHATSAPP_TEMPLATE') ?? 'loan_reminder'
  const lang = Deno.env.get('WHATSAPP_TEMPLATE_LANG') ?? 'en'
  if (!token || !phoneNumberId) return false

  const res = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: normalizePhone(phone),
      type: 'template',
      template: {
        name: template,
        language: { code: lang },
        components: [
          {
            type: 'body',
            parameters: params.map((text) => ({ type: 'text', text })),
          },
        ],
      },
    }),
  })
  return res.ok
}

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { data: loans, error } = await supabase
    .from('loan_requests')
    .select(
      'id, full_name, email, phone, loan_amount, total_repayable, amount_paid, due_date, term_months, created_at, status',
    )
    .in('status', ACTIVE_STATUSES)

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  let emailsSent = 0
  let whatsappSent = 0

  for (const loan of (loans as LoanRow[]) ?? []) {
    const dueDate = getDueDate(loan)
    if (!dueDate) continue

    const startOfDue = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate())
    const daysLeft = Math.round((startOfDue.getTime() - startOfToday.getTime()) / DAY_MS)
    const kind = milestoneFor(daysLeft)
    if (!kind) continue

    const balance =
      loan.total_repayable != null
        ? Math.max(loan.total_repayable - (loan.amount_paid ?? 0), 0)
        : loan.loan_amount
    const balanceLabel = `P${balance.toLocaleString()}`
    const { subject, body } = messageFor(loan, daysLeft, balanceLabel)

    // Which channels have we already sent this milestone on?
    const { data: existing } = await supabase
      .from('loan_reminder_log')
      .select('channel')
      .eq('loan_id', loan.id)
      .eq('kind', kind)
    const done = new Set((existing ?? []).map((r: { channel: string }) => r.channel))

    if (loan.email && !done.has('email')) {
      const ok = await sendEmail(loan.email, loan.full_name, subject, body)
      if (ok) {
        await supabase.from('loan_reminder_log').insert({ loan_id: loan.id, kind, channel: 'email' })
        emailsSent++
      }
    }

    if (loan.phone && !done.has('whatsapp')) {
      const dueText =
        daysLeft < 0 ? `overdue by ${Math.abs(daysLeft)} day(s)` : daysLeft === 0 ? 'due today' : `due in ${daysLeft} day(s)`
      const ok = await sendWhatsApp(loan.phone, [loan.full_name, balanceLabel, dueText])
      if (ok) {
        await supabase.from('loan_reminder_log').insert({ loan_id: loan.id, kind, channel: 'whatsapp' })
        whatsappSent++
      }
    }
  }

  return new Response(JSON.stringify({ ok: true, emailsSent, whatsappSent }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
