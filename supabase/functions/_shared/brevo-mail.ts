// Shared Brevo email helpers for Edge Functions (import from ../_shared/brevo-mail.ts)

const BRAND = '#2f6d9a'
const BRAND_DARK = '#1f3f57'
const MUTED = '#64748b'
const FOOTER = 'Mosasana Capital (PTY) LTD · Gaborone, Botswana · NBFIRA 11/1/6(243)'

export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function htmlToText(html: string): string {
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

/** Table-based layout — renders well in Gmail/Outlook and improves deliverability. */
export function wrapEmail(opts: {
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
      ? `<tr><td style="padding:24px 32px 8px">
          <a href="${ctaUrl}" style="display:inline-block;background:${BRAND};color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:15px;font-weight:600">${escapeHtml(ctaLabel)}</a>
        </td></tr>`
      : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:#eef4f8;font-family:Arial,Helvetica,sans-serif">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef4f8;padding:24px 12px">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(31,63,87,0.08)">
        <tr><td style="background:${BRAND};padding:20px 32px">
          <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.85);letter-spacing:0.04em;text-transform:uppercase">Mosasana Capital</p>
          <h1 style="margin:6px 0 0;font-size:22px;font-weight:700;color:#ffffff;line-height:1.3">${escapeHtml(title)}</h1>
        </td></tr>
        ${intro ? `<tr><td style="padding:24px 32px 0;font-size:15px;line-height:1.6;color:${BRAND_DARK}">${intro}</td></tr>` : ''}
        <tr><td style="padding:24px 32px;font-size:15px;line-height:1.6;color:${BRAND_DARK}">${bodyHtml}</td></tr>
        ${ctaBlock}
        <tr><td style="padding:24px 32px 28px;border-top:1px solid #e8eef3">
          <p style="margin:0;font-size:12px;line-height:1.5;color:${MUTED}">${FOOTER}</p>
          <p style="margin:8px 0 0;font-size:12px;color:${MUTED}"><a href="https://mosasanacapital.com" style="color:${BRAND};text-decoration:none">mosasanacapital.com</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export function detailTable(rows: Array<{ label: string; value: unknown }>): string {
  const trs = rows
    .map(
      ({ label, value }) =>
        `<tr>
          <td style="padding:10px 12px;color:${MUTED};font-size:14px;width:130px;vertical-align:top;border-bottom:1px solid #eef2f6">${escapeHtml(label)}</td>
          <td style="padding:10px 12px;font-size:14px;color:${BRAND_DARK};border-bottom:1px solid #eef2f6">${escapeHtml(value)}</td>
        </tr>`,
    )
    .join('')
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8eef3;border-radius:8px;overflow:hidden">${trs}</table>`
}

export interface BrevoSendOptions {
  apiKey: string
  senderEmail: string
  senderName: string
  toEmail: string
  toName?: string
  subject: string
  html: string
  replyTo?: string
  tags?: string[]
}

export async function sendBrevoEmail(opts: BrevoSendOptions): Promise<{ ok: boolean; detail: string }> {
  const payload: Record<string, unknown> = {
    sender: { name: opts.senderName, email: opts.senderEmail },
    to: [{ email: opts.toEmail, name: opts.toName ?? opts.toEmail }],
    subject: opts.subject,
    htmlContent: opts.html,
    textContent: htmlToText(opts.html),
  }
  if (opts.replyTo) payload.replyTo = { email: opts.replyTo }
  if (opts.tags?.length) payload.tags = opts.tags

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': opts.apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    return { ok: false, detail: `${res.status} ${await res.text()}` }
  }
  return { ok: true, detail: 'sent' }
}
