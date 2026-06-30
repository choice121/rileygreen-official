import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GMAIL = Deno.env.get('GMAIL_ADDRESS') ?? ''
const GMAIL_PASS = Deno.env.get('GMAIL_APP_PASSWORD') ?? ''
const SITE_URL = 'https://morganwallenofficial.pages.dev'

interface EmailPayload {
  type: 'newsletter_confirm' | 'contact_notify' | 'welcome' | 'contact_auto_reply'
  to?: string
  name?: string
  firstName?: string
  subject?: string
  message?: string
  // legacy fields
  confirmationToken?: string
  contactName?: string
  contactEmail?: string
  contactSubject?: string
  contactMessage?: string
  contactType?: string
}

const GOLD = '#C9A84C'
const DARK = '#0A0A0A'
const BG = '#111111'
const CREAM = '#F5F0E8'
const CREAM_DIM = '#888880'
const BORDER = '#1E1E1E'

function base(title: string, preheader: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>${title}</title></head>
<body style="margin:0;padding:0;background:${DARK};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:${DARK};">${preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${DARK};">
  <tr><td align="center" style="padding:48px 16px 32px;">
    <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">
      <!-- HEADER -->
      <tr><td style="padding:0 0 28px;text-align:center;border-bottom:1px solid ${BORDER};">
        <p style="margin:0;font-family:Georgia,serif;font-size:10px;letter-spacing:8px;color:${GOLD};text-transform:uppercase;">★ &nbsp; Morgan Wallen &nbsp; ★</p>
        <p style="margin:6px 0 0;font-family:Georgia,serif;font-size:28px;color:${CREAM};letter-spacing:4px;font-weight:400;">OFFICIAL</p>
      </td></tr>
      <!-- BODY -->
      <tr><td style="background:${BG};border:1px solid ${BORDER};border-top:none;padding:48px 48px 40px;">
        ${body}
      </td></tr>
      <!-- FOOTER -->
      <tr><td style="padding:28px 40px;text-align:center;border-top:none;">
        <p style="margin:0 0 6px;font-size:10px;color:#333;letter-spacing:4px;text-transform:uppercase;">Morgan Wallen Official</p>
        <p style="margin:0 0 4px;font-size:11px;"><a href="${SITE_URL}" style="color:#444;text-decoration:none;">morganwallen.com</a></p>
        <p style="margin:8px 0 0;font-size:10px;color:#222;">© 2025 Morgan Wallen. All rights reserved.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`
}

function btn(label: string, href: string): string {
  return `<table cellpadding="0" cellspacing="0" border="0"><tr><td style="background:${GOLD};"><a href="${href}" style="display:inline-block;color:${DARK};padding:14px 36px;text-decoration:none;font-size:11px;letter-spacing:4px;text-transform:uppercase;font-weight:700;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">${label}</a></td></tr></table>`
}

function h(text: string): string {
  return `<h2 style="margin:0 0 6px;font-family:Georgia,serif;font-size:28px;color:${CREAM};font-weight:400;line-height:1.2;">${text}</h2>`
}

function sub(text: string): string {
  return `<p style="margin:0 0 32px;font-size:11px;color:${GOLD};letter-spacing:4px;text-transform:uppercase;">${text}</p>`
}

function p(text: string, mb = '20px'): string {
  return `<p style="margin:0 0 ${mb};font-size:15px;color:${CREAM_DIM};line-height:1.8;">${text}</p>`
}

// --- Email Templates ---

function newsletterConfirm(name?: string): { subject: string; html: string } {
  const first = name?.split(' ')[0] || 'Friend'
  const body = `
    ${h('You\'re on the list.')}
    ${sub('Welcome to the fan club')}
    ${p(`Hey ${first},`)}
    ${p('Thanks for subscribing to the Morgan Wallen newsletter. You\'ll be the first to know about new music, exclusive tour announcements, merch drops, and everything going on.')}
    ${p('Big thanks from Morgan and the whole team. Stay tuned.', '36px')}
    ${btn('Visit the Site', SITE_URL)}
    <p style="margin:32px 0 0;font-size:11px;color:#333;border-top:1px solid ${BORDER};padding-top:20px;">
      You\'re receiving this because you signed up at morganwallen.com.
      <a href="${SITE_URL}" style="color:#444;text-decoration:underline;">Unsubscribe</a>
    </p>
  `
  return {
    subject: '🤠 You\'re on the list — Morgan Wallen',
    html: base('Welcome — Morgan Wallen Newsletter', `${first}, you're officially on the list. New music, tour dates & more coming your way.`, body),
  }
}

function welcomeEmail(name?: string): { subject: string; html: string } {
  const first = name?.split(' ')[0] || 'there'
  const body = `
    ${h('Welcome to the fan hub.')}
    ${sub('Your account is ready')}
    ${p(`Hey ${first},`)}
    ${p('Your Morgan Wallen fan account has been created. You now have full access to everything on the site — early announcements, exclusive content, and more coming soon.')}
    ${p('Glad to have you here.', '36px')}
    ${btn('Sign In to Your Account', `${SITE_URL}/login`)}
  `
  return {
    subject: 'Welcome to Morgan Wallen Fan Hub 🤠',
    html: base('Welcome — Morgan Wallen Fan Hub', `${first}, your account is set up and ready.`, body),
  }
}

function contactNotify(name: string, email: string, subj: string, msg: string, type: string): { subject: string; html: string } {
  const rows = [
    ['From', name],
    ['Email', `<a href="mailto:${email}" style="color:${GOLD};">${email}</a>`],
    ['Type', type || 'General'],
    ['Subject', subj || '(no subject)'],
  ]
  const tableRows = rows.map(([k, v]) => `
    <tr>
      <td style="padding:10px 16px 10px 0;border-bottom:1px solid ${BORDER};font-size:11px;color:#555;letter-spacing:2px;text-transform:uppercase;white-space:nowrap;vertical-align:top;">${k}</td>
      <td style="padding:10px 0;border-bottom:1px solid ${BORDER};font-size:14px;color:${CREAM};">${v}</td>
    </tr>`).join('')
  const body = `
    ${h('New Contact Message')}
    ${sub('Received via website contact form')}
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px;">${tableRows}</table>
    <div style="background:#0D0D0D;border:1px solid ${BORDER};border-left:3px solid ${GOLD};padding:24px;margin:0 0 32px;">
      <p style="margin:0;font-size:14px;color:#999;line-height:1.9;white-space:pre-wrap;">${msg.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
    </div>
    ${btn(`Reply to ${name}`, `mailto:${email}?subject=Re: ${subj}`)}
  `
  return {
    subject: `📬 New message from ${name} — Morgan Wallen Site`,
    html: base('New Contact Message', `${name} sent a message via the contact form`, body),
  }
}

function contactAutoReply(name?: string): { subject: string; html: string } {
  const first = name?.split(' ')[0] || 'there'
  const body = `
    ${h('Message received.')}
    ${sub("We'll be in touch")}
    ${p(`Hey ${first},`)}
    ${p("Thanks for reaching out. Your message has been received and the team will get back to you as soon as possible.")}
    ${p("In the meantime, check out the latest music, tour dates, and merch on the site.", '36px')}
    ${btn('Visit the Site', SITE_URL)}
  `
  return {
    subject: 'Thanks for reaching out — Morgan Wallen',
    html: base('Message received — Morgan Wallen', `${first}, we got your message and will be in touch soon.`, body),
  }
}

// --- Send via Gmail SMTP ---

async function send(to: string, subject: string, html: string) {
  const { SMTPClient } = await import('https://deno.land/x/denomailer@1.6.0/mod.ts')
  const client = new SMTPClient({
    connection: {
      hostname: 'smtp.gmail.com',
      port: 465,
      tls: true,
      auth: { username: GMAIL, password: GMAIL_PASS },
    },
  })
  try {
    await client.send({ from: `"Morgan Wallen Official" <${GMAIL}>`, to, subject, html })
  } finally {
    await client.close()
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const payload: EmailPayload = await req.json()
    const { type } = payload

    // Support legacy field names
    const name = payload.name || payload.contactName || payload.firstName
    const toAddr = payload.to || payload.contactEmail || ''
    const subject = payload.subject || payload.contactSubject
    const message = payload.message || payload.contactMessage

    let emailData: { subject: string; html: string }
    let recipient = toAddr

    switch (type) {
      case 'newsletter_confirm':
        emailData = newsletterConfirm(name)
        recipient = toAddr
        break
      case 'welcome':
        emailData = welcomeEmail(name)
        recipient = toAddr
        break
      case 'contact_notify':
        emailData = contactNotify(name || 'Anonymous', toAddr, subject || '', message || '', payload.contactType || 'general')
        recipient = GMAIL
        break
      case 'contact_auto_reply':
        emailData = contactAutoReply(name)
        recipient = toAddr
        break
      default:
        return new Response(JSON.stringify({ error: `Unknown type: ${type}` }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }

    if (!recipient) {
      return new Response(JSON.stringify({ error: 'No recipient address' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    await send(recipient, emailData.subject, emailData.html)
    console.log(`[send-email] ✅ ${type} → ${recipient}`)

    return new Response(
      JSON.stringify({ success: true, type, to: recipient }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('[send-email] ❌', err)
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
