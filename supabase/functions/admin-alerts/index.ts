// Supabase Edge Function: admin-alerts
//
// Sends email alerts to Mosasana admin inboxes when a new loan or enquiry arrives.
// In-app notifications still go to admin profiles via SQL triggers; this adds email.
//
// Deploy:
//   supabase functions deploy admin-alerts --no-verify-jwt
//
// Required secrets (same Brevo setup as loan-reminders):
//   BREVO_SMTP_LOGIN, BREVO_SMTP_KEY, BREVO_SENDER_EMAIL
// Optional:
//   BREVO_SENDER_NAME, BREVO_SMTP_HOST, BREVO_SMTP_PORT
//   ADMIN_ALERT_EMAILS - comma-separated, defaults to ondiweni + tnkile
//   CRON_SECRET        - callers must send x-cron-secret header (from DB trigger)
//
// Database trigger setup: run supabase/admin-email-alerts.sql

import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts'

const SITE_URL = 'https://mosasanacapital.com'
const DEFAULT_ADMIN_EMAILS = [
  'ondiweni@mosasanacapital.com',
  'tnkile@mosasanacapital.com',
]

interface AlertBody {
  type: 'new_loan' | 'new_enquiry'
  data: Record<string, unknown>
}

function adminEmails(): string[] {
  const raw = Deno.env.get('ADMIN_ALERT_EMAILS')
  if (!raw?.trim()) return DEFAULT_ADMIN_EMAILS
  return raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function formatPula(amount: unknown): string {
  const n = Number(amount)
  if (!Number.isFinite(n)) return String(amount ?? '')
  return `P${n.toLocaleString('en-GB')}`
}

function buildLoanEmail(data: Record<string, unknown>) {
  const loanId = String(data.loan_id ?? '')
  const adminLink = loanId
    ? `${SITE_URL}/#/admin?tab=loans&loan=${loanId}`
    : `${SITE_URL}/#/admin?tab=loans`

  const subject = `New loan application — ${data.full_name ?? 'Applicant'}`
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;color:#1f3f57;line-height:1.6;max-width:560px">
    <h2 style="margin:0 0 12px;color:#2f6d9a">New loan application</h2>
    <p style="margin:0 0 16px">A new loan request was submitted on the Mosasana Capital website.</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr><td style="padding:6px 0;color:#64748b;width:120px">Applicant</td><td style="padding:6px 0"><strong>${escapeHtml(data.full_name)}</strong></td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Email</td><td style="padding:6px 0">${escapeHtml(data.email)}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Phone</td><td style="padding:6px 0">${escapeHtml(data.phone)}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Amount</td><td style="padding:6px 0"><strong>${escapeHtml(formatPula(data.loan_amount))}</strong></td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Purpose</td><td style="padding:6px 0">${escapeHtml(data.loan_purpose)}</td></tr>
    </table>
    <p style="margin:20px 0 0">
      <a href="${adminLink}" style="display:inline-block;background:#2f6d9a;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600">Open in admin portal</a>
    </p>
    <p style="margin:20px 0 0;font-size:12px;color:#94a3b8">Mosasana Capital admin alert</p>
  </div>`

  return { subject, html }
}

function buildEnquiryEmail(data: Record<string, unknown>) {
  const adminLink = `${SITE_URL}/#/admin?tab=enquiries`
  const subject = `New enquiry — ${data.full_name ?? 'Contact'}`
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;color:#1f3f57;line-height:1.6;max-width:560px">
    <h2 style="margin:0 0 12px;color:#2f6d9a">New contact enquiry</h2>
    <p style="margin:0 0 16px">Someone submitted the contact form on the Mosasana Capital website.</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr><td style="padding:6px 0;color:#64748b;width:120px">Name</td><td style="padding:6px 0"><strong>${escapeHtml(data.full_name)}</strong></td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Email</td><td style="padding:6px 0">${escapeHtml(data.email)}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Phone</td><td style="padding:6px 0">${escapeHtml(data.phone ?? '—')}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Subject</td><td style="padding:6px 0"><strong>${escapeHtml(data.subject)}</strong></td></tr>
    </table>
    <p style="margin:16px 0 0;padding:12px;background:#f8fafc;border-radius:8px;font-size:14px;white-space:pre-wrap">${escapeHtml(data.message)}</p>
    <p style="margin:20px 0 0">
      <a href="${adminLink}" style="display:inline-block;background:#2f6d9a;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600">Open enquiries</a>
    </p>
    <p style="margin:20px 0 0;font-size:12px;color:#94a3b8">Mosasana Capital admin alert</p>
  </div>`

  return { subject, html }
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  const cronSecret = Deno.env.get('CRON_SECRET')
  if (cronSecret) {
    const provided = req.headers.get('x-cron-secret')
    if (provided !== cronSecret) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
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

  let body: AlertBody
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 })
  }

  if (!body?.type || !body?.data || typeof body.data !== 'object') {
    return new Response(JSON.stringify({ error: 'Expected { type, data }' }), { status: 400 })
  }

  const recipients = adminEmails()
  if (!recipients.length) {
    return new Response(JSON.stringify({ error: 'No admin alert recipients configured' }), { status: 500 })
  }

  const email =
    body.type === 'new_loan'
      ? buildLoanEmail(body.data)
      : body.type === 'new_enquiry'
        ? buildEnquiryEmail(body.data)
        : null

  if (!email) {
    return new Response(JSON.stringify({ error: 'Unknown alert type' }), { status: 400 })
  }

  const client = new SMTPClient({
    connection: {
      hostname: smtpHost,
      port: smtpPort,
      tls: false,
      auth: { username: smtpLogin, password: smtpKey },
    },
  })

  let sent = 0
  try {
    for (const to of recipients) {
      try {
        await client.send({
          from: `${senderName} <${senderEmail}>`,
          to,
          subject: email.subject,
          html: email.html,
        })
        sent++
      } catch (err) {
        console.error('Failed to send admin alert to', to, err)
      }
    }
  } finally {
    await client.close()
  }

  return new Response(JSON.stringify({ ok: true, sent, recipients }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
