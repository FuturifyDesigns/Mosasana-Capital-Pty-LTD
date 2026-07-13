// Supabase Edge Function: loan-reminders (deploy as "Reminder")
//
// Required secrets: BREVO_API_KEY, BREVO_SENDER_EMAIL, CRON_SECRET
// Optional: BREVO_SENDER_NAME

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SITE_URL = 'https://mosasanacapital.com'
const BRAND = '#2f6d9a'
const BRAND_DARK = '#1f3f57'
const MUTED = '#64748b'
const FOOTER = 'Mosasana Capital (PTY) LTD · Gaborone, Botswana · NBFIRA 11/1/6(243)'

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function wrapEmail(opts: {
  preheader: string
  title: string
  intro?: string
  bodyHtml: string
  ctaLabel?: string
  ctaUrl?: string
}): string {
  const { preheader, title, intro, bodyHtml, ctaLabel, ctaUrl } = opts
  const ctaBlock =
    ctaLabel && ctaUrl
      ? `<tr><td style="padding:24px 32px 8px"><a href="${ctaUrl}" style="display:inline-block;background:${BRAND};color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:15px;font-weight:600">${escapeHtml(ctaLabel)}</a></td></tr>`
      : ''
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:#eef4f8;font-family:Arial,Helvetica,sans-serif">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef4f8;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(31,63,87,0.08)">
<tr><td style="background:${BRAND};padding:20px 32px"><p style="margin:0;font-size:13px;color:rgba(255,255,255,0.85);letter-spacing:0.04em;text-transform:uppercase">Mosasana Capital</p>
<h1 style="margin:6px 0 0;font-size:22px;font-weight:700;color:#ffffff;line-height:1.3">${escapeHtml(title)}</h1></td></tr>
${intro ? `<tr><td style="padding:24px 32px 0;font-size:15px;line-height:1.6;color:${BRAND_DARK}">${intro}</td></tr>` : ''}
<tr><td style="padding:24px 32px;font-size:15px;line-height:1.6;color:${BRAND_DARK}">${bodyHtml}</td></tr>${ctaBlock}
<tr><td style="padding:24px 32px 28px;border-top:1px solid #e8eef3"><p style="margin:0;font-size:12px;line-height:1.5;color:${MUTED}">${FOOTER}</p>
<p style="margin:8px 0 0;font-size:12px;color:${MUTED}"><a href="https://mosasanacapital.com" style="color:${BRAND};text-decoration:none">mosasanacapital.com</a></p></td></tr>
</table></td></tr></table></body></html>`
}

async function sendBrevoEmail(opts: {
  apiKey: string
  senderEmail: string
  senderName: string
  toEmail: string
  toName?: string
  subject: string
  html: string
  tags?: string[]
}): Promise<{ ok: boolean; detail: string }> {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': opts.apiKey, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      sender: { name: opts.senderName, email: opts.senderEmail },
      to: [{ email: opts.toEmail, name: opts.toName ?? opts.toEmail }],
      subject: opts.subject,
      htmlContent: opts.html,
      textContent: htmlToText(opts.html),
      tags: opts.tags,
    }),
  })
  if (!res.ok) return { ok: false, detail: `${res.status} ${await res.text()}` }
  return { ok: true, detail: 'sent' }
}

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
): { subject: string; html: string; preheader: string; title: string } {
  const dueStr = dueDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const firstName = loan.full_name.split(' ')[0] || loan.full_name

  if (daysLeft < 0) {
    return {
      subject: `Mosasana Capital — Payment overdue (${balanceLabel})`,
      title: 'Payment overdue',
      preheader: `Your repayment of ${balanceLabel} is overdue. Please pay as soon as possible.`,
      html: wrapEmail({
        preheader: `Your repayment of ${balanceLabel} is overdue.`,
        title: 'Payment overdue',
        intro: `Hi ${escapeHtml(firstName)},`,
        bodyHtml: `<p style="margin:0 0 16px">Your loan repayment of <strong>${escapeHtml(balanceLabel)}</strong> was due on <strong>${escapeHtml(dueStr)}</strong> and is now overdue by <strong>${Math.abs(daysLeft)} day(s)</strong>.</p>
          <p style="margin:0">Please make your payment as soon as possible to avoid additional charges. If you have already paid, please disregard this message.</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;border:1px solid #fde8e8;border-radius:8px;background:#fff8f8">
            <tr><td style="padding:14px 16px;font-size:14px;color:#1f3f57"><strong>Amount due:</strong> ${escapeHtml(balanceLabel)}</td></tr>
          </table>`,
        ctaLabel: 'View your loan',
        ctaUrl: `${SITE_URL}/#/dashboard`,
      }),
    }
  }

  if (daysLeft === 0) {
    return {
      subject: `Mosasana Capital — Payment due today (${balanceLabel})`,
      title: 'Payment due today',
      preheader: `Your repayment of ${balanceLabel} is due today.`,
      html: wrapEmail({
        preheader: `Your repayment of ${balanceLabel} is due today.`,
        title: 'Payment due today',
        intro: `Hi ${escapeHtml(firstName)},`,
        bodyHtml: `<p style="margin:0 0 16px">This is a friendly reminder that your loan repayment of <strong>${escapeHtml(balanceLabel)}</strong> is <strong>due today</strong> (${escapeHtml(dueStr)}).</p>
          <p style="margin:0">Please ensure funds are available. Thank you for choosing Mosasana Capital.</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;border:1px solid #e8eef3;border-radius:8px;background:#f8fafc">
            <tr><td style="padding:14px 16px;font-size:14px;color:#1f3f57"><strong>Amount due:</strong> ${escapeHtml(balanceLabel)}</td></tr>
          </table>`,
        ctaLabel: 'View your loan',
        ctaUrl: `${SITE_URL}/#/dashboard`,
      }),
    }
  }

  return {
    subject: `Mosasana Capital — Payment due in ${daysLeft} day(s)`,
    title: `Payment due in ${daysLeft} day(s)`,
    preheader: `Your repayment of ${balanceLabel} is due on ${dueStr}.`,
    html: wrapEmail({
      preheader: `Your repayment of ${balanceLabel} is due on ${dueStr}.`,
      title: `Payment due in ${daysLeft} day(s)`,
      intro: `Hi ${escapeHtml(firstName)},`,
      bodyHtml: `<p style="margin:0 0 16px">Your loan repayment of <strong>${escapeHtml(balanceLabel)}</strong> is due in <strong>${daysLeft} day(s)</strong>, on <strong>${escapeHtml(dueStr)}</strong>.</p>
        <p style="margin:0">Please ensure funds are available before the due date.</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;border:1px solid #e8eef3;border-radius:8px;background:#f8fafc">
          <tr><td style="padding:14px 16px;font-size:14px;color:#1f3f57"><strong>Amount due:</strong> ${escapeHtml(balanceLabel)}</td></tr>
        </table>`,
      ctaLabel: 'View your loan',
      ctaUrl: `${SITE_URL}/#/dashboard`,
    }),
  }
}

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
    }

    const cronSecret = Deno.env.get('CRON_SECRET')
    if (cronSecret && req.headers.get('x-cron-secret') !== cronSecret) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    const apiKey = Deno.env.get('BREVO_API_KEY')
    const senderEmail = Deno.env.get('BREVO_SENDER_EMAIL')
    const senderName = Deno.env.get('BREVO_SENDER_NAME') ?? 'Mosasana Capital'

    if (!apiKey || !senderEmail) {
      return new Response(
        JSON.stringify({ error: 'Missing BREVO_API_KEY or BREVO_SENDER_EMAIL' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
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

    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    let emailsSent = 0
    const errors: string[] = []

    for (const loan of (loans as LoanRow[]) ?? []) {
      if (!loan.email) continue
      const dueDate = getDueDate(loan)
      if (!dueDate) continue

      const startOfDue = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate())
      const daysLeft = Math.round((startOfDue.getTime() - startOfToday.getTime()) / DAY_MS)
      const kind = milestoneFor(daysLeft)
      if (!kind) continue

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
      const balanceLabel = `P${balance.toLocaleString('en-GB')}`
      const { subject, html } = messageFor(loan, daysLeft, balanceLabel, dueDate)

      const result = await sendBrevoEmail({
        apiKey,
        senderEmail,
        senderName,
        toEmail: loan.email,
        toName: loan.full_name,
        subject,
        html,
        tags: ['loan-reminder', kind],
      })

      if (result.ok) {
        await supabase.from('loan_reminder_log').insert({ loan_id: loan.id, kind, channel: 'email' })
        emailsSent++
      } else {
        errors.push(`${loan.email}: ${result.detail}`)
      }
    }

    return new Response(
      JSON.stringify({ ok: true, emailsSent, errors: errors.length ? errors : undefined }),
      { headers: { 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error('loan-reminders error:', err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})
