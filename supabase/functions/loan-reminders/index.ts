// Supabase Edge Function: loan-reminders
//
// Sends repayment reminder emails to clients via Brevo. Intended to be invoked
// once a day by a pg_cron schedule (see supabase/schema.sql).
//
// Deploy:
//   supabase functions deploy loan-reminders --no-verify-jwt
//
// Required secrets (supabase secrets set KEY=value):
//   BREVO_API_KEY          - Brevo (Sendinblue) transactional API key
//   BREVO_SENDER_EMAIL     - verified sender, e.g. noreply@mosasanacapital.com
//   BREVO_SENDER_NAME      - e.g. "Mosasana Capital"
//
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided automatically.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
): { subject: string; body: string } {
  const dueStr = dueDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  if (daysLeft < 0) {
    return {
      subject: 'Your Mosasana Capital loan repayment is overdue',
      body: `Hi ${loan.full_name},<br><br>Your loan repayment of <strong>${balanceLabel}</strong> was due on ${dueStr} and is now overdue by ${Math.abs(daysLeft)} day(s). Please make your payment as soon as possible to avoid additional charges.<br><br>Thank you,<br>Mosasana Capital`,
    }
  }
  if (daysLeft === 0) {
    return {
      subject: 'Your Mosasana Capital loan repayment is due today',
      body: `Hi ${loan.full_name},<br><br>This is a friendly reminder that your loan repayment of <strong>${balanceLabel}</strong> is due today (${dueStr}).<br><br>Thank you,<br>Mosasana Capital`,
    }
  }
  return {
    subject: `Reminder: loan repayment due in ${daysLeft} day(s)`,
    body: `Hi ${loan.full_name},<br><br>Your loan repayment of <strong>${balanceLabel}</strong> is due in ${daysLeft} day(s), on ${dueStr}. Please ensure funds are available.<br><br>Thank you,<br>Mosasana Capital`,
  }
}

async function sendEmail(to: string, name: string, subject: string, htmlBody: string): Promise<boolean> {
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
      htmlContent: `<div style="font-family:Arial,Helvetica,sans-serif;color:#1f3f57;line-height:1.6">${htmlBody}</div>`,
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
      'id, full_name, email, loan_amount, total_repayable, amount_paid, due_date, term_months, created_at, status',
    )
    .in('status', ACTIVE_STATUSES)

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  let emailsSent = 0

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
    const { subject, body } = messageFor(loan, daysLeft, balanceLabel, dueDate)

    const ok = await sendEmail(loan.email, loan.full_name, subject, body)
    if (ok) {
      await supabase.from('loan_reminder_log').insert({ loan_id: loan.id, kind, channel: 'email' })
      emailsSent++
    }
  }

  return new Response(JSON.stringify({ ok: true, emailsSent }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
