// Supabase Edge Function: loan-reminders
//
// Sends repayment reminder emails to clients via Brevo SMTP. Intended to be
// invoked once a day by a pg_cron schedule (see supabase/schema.sql).
//
// Deploy:
//   supabase functions deploy loan-reminders --no-verify-jwt
//
// Required secrets (supabase secrets set KEY=value):
//   BREVO_SMTP_LOGIN    - your Brevo account login email (SMTP username)
//   BREVO_SMTP_KEY      - your Brevo SMTP key (starts with xsmtpsib-)
//   BREVO_SENDER_EMAIL  - a verified sender, e.g. noreply@mosasanacapital.com
//   BREVO_SENDER_NAME   - e.g. "Mosasana Capital"
// Optional:
//   BREVO_SMTP_HOST     - defaults to smtp-relay.brevo.com
//   BREVO_SMTP_PORT     - defaults to 587
//   CRON_SECRET         - shared secret; callers must send it as the
//                         x-cron-secret header (protects this endpoint)
//
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided automatically.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts'

const DAY_MS = 24 * 60 * 60 * 1000
const ACTIVE_STATUSES = ['approved', 'disbursed']

interface LoanRow {
  id: string
  full_name: string
  email: string
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

function messageFor(
  loan: LoanRow,
  daysLeft: number,
  balanceLabel: string,
  dueDate: Date,
): { subject: string; html: string } {
  const dueStr = dueDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  let subject: string
  let line: string
  if (daysLeft < 0) {
    subject = 'Your Mosasana Capital loan repayment is overdue'
    line = `Your loan repayment of <strong>${balanceLabel}</strong> was due on ${dueStr} and is now overdue by ${Math.abs(daysLeft)} day(s). Please make your payment as soon as possible to avoid additional charges.`
  } else if (daysLeft === 0) {
    subject = 'Your Mosasana Capital loan repayment is due today'
    line = `This is a friendly reminder that your loan repayment of <strong>${balanceLabel}</strong> is due today (${dueStr}).`
  } else {
    subject = `Reminder: loan repayment due in ${daysLeft} day(s)`
    line = `Your loan repayment of <strong>${balanceLabel}</strong> is due in ${daysLeft} day(s), on ${dueStr}. Please ensure funds are available.`
  }

  const html = `<div style="font-family:Arial,Helvetica,sans-serif;color:#1f3f57;line-height:1.6">
    <p>Hi ${loan.full_name},</p>
    <p>${line}</p>
    <p>Thank you,<br>Mosasana Capital</p>
  </div>`
  return { subject, html }
}

Deno.serve(async (req) => {
  // Protect the endpoint: only callers presenting the shared secret may run it.
  const cronSecret = Deno.env.get('CRON_SECRET')
  if (cronSecret) {
    const provided = req.headers.get('x-cron-secret')
    if (provided !== cronSecret) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  }

  const smtpLogin = Deno.env.get('BREVO_SMTP_LOGIN')
  const smtpKey = Deno.env.get('BREVO_SMTP_KEY')
  const senderEmail = Deno.env.get('BREVO_SENDER_EMAIL')
  const senderName = Deno.env.get('BREVO_SENDER_NAME') ?? 'Mosasana Capital'
  const smtpHost = Deno.env.get('BREVO_SMTP_HOST') ?? 'smtp-relay.brevo.com'
  const smtpPort = Number(Deno.env.get('BREVO_SMTP_PORT') ?? '587')

  if (!smtpLogin || !smtpKey || !senderEmail) {
    return new Response(
      JSON.stringify({ error: 'Missing BREVO_SMTP_LOGIN / BREVO_SMTP_KEY / BREVO_SENDER_EMAIL' }),
      { status: 500 },
    )
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { data: loans, error } = await supabase
    .from('loan_requests')
    .select(
      'id, full_name, email, loan_amount, total_repayable, amount_paid, due_date, term_months, created_at, status',
    )
    .in('status', ACTIVE_STATUSES)

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  const client = new SMTPClient({
    connection: {
      hostname: smtpHost,
      port: smtpPort,
      tls: false, // STARTTLS is negotiated automatically on port 587
      auth: { username: smtpLogin, password: smtpKey },
    },
  })

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  let emailsSent = 0

  try {
    for (const loan of (loans as LoanRow[]) ?? []) {
      if (!loan.email) continue
      const dueDate = getDueDate(loan)
      if (!dueDate) continue

      const startOfDue = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate())
      const daysLeft = Math.round((startOfDue.getTime() - startOfToday.getTime()) / DAY_MS)
      const kind = milestoneFor(daysLeft)
      if (!kind) continue

      // Skip if we already sent this milestone email for this loan.
      const { data: existing } = await supabase
        .from('loan_reminder_log')
        .select('id')
        .eq('loan_id', loan.id)
        .eq('kind', kind)
        .eq('channel', 'email')
        .maybeSingle()
      if (existing) continue

      const balance =
        loan.total_repayable != null
          ? Math.max(loan.total_repayable - (loan.amount_paid ?? 0), 0)
          : loan.loan_amount
      const balanceLabel = `P${balance.toLocaleString()}`
      const { subject, html } = messageFor(loan, daysLeft, balanceLabel, dueDate)

      try {
        await client.send({
          from: `${senderName} <${senderEmail}>`,
          to: `${loan.full_name} <${loan.email}>`,
          subject,
          html,
        })
        await supabase.from('loan_reminder_log').insert({ loan_id: loan.id, kind, channel: 'email' })
        emailsSent++
      } catch (sendErr) {
        console.error('Failed to send to', loan.email, sendErr)
      }
    }
  } finally {
    await client.close()
  }

  return new Response(JSON.stringify({ ok: true, emailsSent }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
