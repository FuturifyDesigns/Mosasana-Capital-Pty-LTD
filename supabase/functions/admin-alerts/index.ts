// Supabase Edge Function: admin-alerts (deploy as "Email-notifications")
//
// Required secrets: BREVO_API_KEY, BREVO_SENDER_EMAIL, CRON_SECRET
// Optional: BREVO_SENDER_NAME, ADMIN_ALERT_EMAILS

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

function detailTable(rows: Array<{ label: string; value: unknown }>): string {
  const trs = rows
    .map(
      ({ label, value }) =>
        `<tr><td style="padding:10px 12px;color:${MUTED};font-size:14px;width:130px;vertical-align:top;border-bottom:1px solid #eef2f6">${escapeHtml(label)}</td>
<td style="padding:10px 12px;font-size:14px;color:${BRAND_DARK};border-bottom:1px solid #eef2f6">${escapeHtml(value)}</td></tr>`,
    )
    .join('')
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8eef3;border-radius:8px;overflow:hidden">${trs}</table>`
}

async function sendBrevoEmail(opts: {
  apiKey: string
  senderEmail: string
  senderName: string
  toEmail: string
  subject: string
  html: string
  replyTo?: string
  tags?: string[]
}): Promise<{ ok: boolean; detail: string }> {
  const payload: Record<string, unknown> = {
    sender: { name: opts.senderName, email: opts.senderEmail },
    to: [{ email: opts.toEmail }],
    subject: opts.subject,
    htmlContent: opts.html,
    textContent: htmlToText(opts.html),
    tags: opts.tags,
  }
  if (opts.replyTo) payload.replyTo = { email: opts.replyTo }
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': opts.apiKey, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) return { ok: false, detail: `${res.status} ${await res.text()}` }
  return { ok: true, detail: 'sent' }
}

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
  return raw.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
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
  const name = String(data.full_name ?? 'Applicant')
  const subject = `Mosasana Capital — New loan application from ${name}`

  const bodyHtml = detailTable([
    { label: 'Applicant', value: data.full_name },
    { label: 'Email', value: data.email },
    { label: 'Phone', value: data.phone },
    { label: 'Amount', value: formatPula(data.loan_amount) },
    { label: 'Purpose', value: data.loan_purpose },
  ])

  const html = wrapEmail({
    preheader: `${name} applied for ${formatPula(data.loan_amount)}. Review in the admin portal.`,
    title: 'New loan application',
    intro: 'A new loan request was submitted on the Mosasana Capital website.',
    bodyHtml,
    ctaLabel: 'Review application',
    ctaUrl: adminLink,
  })

  return { subject, html, replyTo: String(data.email ?? '') || undefined }
}

function buildEnquiryEmail(data: Record<string, unknown>) {
  const adminLink = `${SITE_URL}/#/admin?tab=enquiries`
  const name = String(data.full_name ?? 'Contact')
  const subject = `Mosasana Capital — New enquiry from ${name}`

  const bodyHtml =
    detailTable([
      { label: 'Name', value: data.full_name },
      { label: 'Email', value: data.email },
      { label: 'Phone', value: data.phone ?? '—' },
      { label: 'Subject', value: data.subject },
    ]) +
    `<div style="margin-top:16px;padding:16px;background:#f8fafc;border-radius:8px;border:1px solid #e8eef3">
      <p style="margin:0 0 6px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.04em">Message</p>
      <p style="margin:0;font-size:14px;line-height:1.6;white-space:pre-wrap;color:#1f3f57">${escapeHtml(data.message)}</p>
    </div>`

  const html = wrapEmail({
    preheader: `${name} sent a message: ${String(data.subject ?? '').slice(0, 80)}`,
    title: 'New contact enquiry',
    intro: 'Someone submitted the contact form on the Mosasana Capital website.',
    bodyHtml,
    ctaLabel: 'View enquiry',
    ctaUrl: adminLink,
  })

  return { subject, html, replyTo: String(data.email ?? '') || undefined }
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

    let body: AlertBody
    try {
      body = await req.json()
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 })
    }

    if (!body?.type || !body?.data) {
      return new Response(JSON.stringify({ error: 'Expected { type, data }' }), { status: 400 })
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

    const recipients = adminEmails()
    let sent = 0
    const errors: string[] = []

    for (const toEmail of recipients) {
      const result = await sendBrevoEmail({
        apiKey,
        senderEmail,
        senderName,
        toEmail,
        subject: email.subject,
        html: email.html,
        replyTo: email.replyTo,
        tags: ['admin-alert', body.type],
      })
      if (result.ok) sent++
      else errors.push(`${toEmail}: ${result.detail}`)
    }

    return new Response(
      JSON.stringify({ ok: sent > 0, sent, recipients, errors: errors.length ? errors : undefined }),
      { headers: { 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error('admin-alerts error:', err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})
