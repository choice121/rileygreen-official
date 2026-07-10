// Zero external imports — uses only Deno built-ins.
// Deno.serve() is native (Deno 1.35+, Supabase edge-runtime v1.34+).
// SMTP is implemented directly over Deno.connectTls() so no denomailer needed.

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-site-secret',
}

const GMAIL      = Deno.env.get('GMAIL_ADDRESS')    ?? ''
const GMAIL_PASS = Deno.env.get('GMAIL_APP_PASSWORD') ?? ''
const SECRET     = Deno.env.get('SITE_CALL_SECRET')  ?? ''
const SITE_URL   = 'https://rileygreen-official.pages.dev'

// ── Minimal SMTP over TLS ──────────────────────────────────────────────────────

async function smtpSend(to: string, subject: string, html: string): Promise<void> {
  const enc = new TextEncoder()
  const dec = new TextDecoder()

  const conn = await Deno.connectTls({ hostname: 'smtp.gmail.com', port: 465 })

  async function read(): Promise<string> {
    const buf = new Uint8Array(8192)
    const n = await conn.read(buf)
    const line = dec.decode(buf.subarray(0, n ?? 0)).trim()
    console.log('[smtp ←]', line.slice(0, 120))
    return line
  }

  async function cmd(line: string): Promise<string> {
    const safe = line.startsWith('AUTH') ? line.slice(0, 20) + '…' : line
    console.log('[smtp →]', safe)
    await conn.write(enc.encode(line + '\r\n'))
    return await read()
  }

  try {
    await read() // 220 greeting

    const ehlo = await cmd(`EHLO mx.rileygreen.fan`)
    if (!ehlo.includes('250')) throw new Error('EHLO failed: ' + ehlo)

    const auth = await cmd('AUTH LOGIN')
    if (!auth.includes('334')) throw new Error('AUTH LOGIN rejected: ' + auth)

    const u = await cmd(btoa(GMAIL))
    if (!u.includes('334')) throw new Error('Username rejected: ' + u)

    const p = await cmd(btoa(GMAIL_PASS))
    if (!p.includes('235')) throw new Error('Password rejected (bad App Password?): ' + p)

    const from = await cmd(`MAIL FROM:<${GMAIL}>`)
    if (!from.includes('250')) throw new Error('MAIL FROM failed: ' + from)

    const rcpt = await cmd(`RCPT TO:<${to}>`)
    if (!rcpt.includes('250')) throw new Error('RCPT TO failed: ' + rcpt)

    const data = await cmd('DATA')
    if (!data.includes('354')) throw new Error('DATA failed: ' + data)

    const body =
      `From: "Riley Green Official" <${GMAIL}>\r\n` +
      `To: ${to}\r\n` +
      `Subject: ${subject}\r\n` +
      `MIME-Version: 1.0\r\n` +
      `Content-Type: text/html; charset=UTF-8\r\n` +
      `\r\n` +
      html +
      `\r\n.\r\n`

    await conn.write(enc.encode(body))
    const sent = await read()
    if (!sent.includes('250')) throw new Error('Message rejected: ' + sent)

    await cmd('QUIT')
  } finally {
    try { conn.close() } catch { /* ignore */ }
  }
}

// ── Design tokens ─────────────────────────────────────────────────────────────

const GOLD   = '#C9A84C'
const DARK   = '#0A0A0A'
const BG     = '#111111'
const DIM    = '#888880'
const BORDER = '#1E1E1E'

function wrap(preheader: string, body: string): string {
  return `<!DOCTYPE html><html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:${DARK};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${DARK};">
<tr><td align="center" style="padding:48px 16px 32px;">
<table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">
<tr><td style="padding:0 0 28px;text-align:center;border-bottom:1px solid ${BORDER};">
  <p style="margin:0;font-family:Georgia,serif;font-size:10px;letter-spacing:8px;color:${GOLD};text-transform:uppercase;">&#9733; &nbsp; Riley Green &nbsp; &#9733;</p>
  <p style="margin:6px 0 0;font-family:Georgia,serif;font-size:28px;color:#F5F0E8;letter-spacing:4px;font-weight:400;">OFFICIAL</p>
</td></tr>
<tr><td style="background:${BG};border:1px solid ${BORDER};border-top:none;padding:48px 48px 40px;">${body}</td></tr>
<tr><td style="padding:28px 40px;text-align:center;">
  <p style="margin:0 0 6px;font-size:10px;color:#333;letter-spacing:4px;text-transform:uppercase;">Riley Green Official</p>
  <p style="margin:0 0 4px;font-size:11px;"><a href="${SITE_URL}" style="color:#444;text-decoration:none;">rileygreen.com</a></p>
  <p style="margin:8px 0 0;font-size:10px;color:#222;">&#169; 2026 Riley Green. All rights reserved.</p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`
}

const btn  = (label: string, href: string) =>
  `<table cellpadding="0" cellspacing="0" border="0"><tr><td style="background:${GOLD};">` +
  `<a href="${href}" style="display:inline-block;color:${DARK};padding:14px 36px;text-decoration:none;` +
  `font-size:11px;letter-spacing:4px;text-transform:uppercase;font-weight:700;">${label}</a></td></tr></table>`

const h2   = (t: string) =>
  `<h2 style="margin:0 0 6px;font-family:Georgia,serif;font-size:28px;color:#F5F0E8;font-weight:400;">${t}</h2>`

const eye  = (t: string) =>
  `<p style="margin:0 0 32px;font-size:11px;color:${GOLD};letter-spacing:4px;text-transform:uppercase;">${t}</p>`

const p    = (t: string, mb = '20px') =>
  `<p style="margin:0 0 ${mb};font-size:15px;color:${DIM};line-height:1.8;">${t}</p>`

// ── Templates ──────────────────────────────────────────────────────────────────

function tplNewsletterConfirm(name: string) {
  const first = (name || '').split(' ')[0] || 'Friend'
  return {
    subject: "You're on the list \u2014 Riley Green",
    html: wrap(
      `${first}, you're officially on the list!`,
      h2("You're on the list.") +
      eye('Welcome to the fan club') +
      p(`Hey ${first},`) +
      p("Thanks for subscribing to the Riley Green newsletter. You'll be the first to hear about new music, tour announcements, merch drops, and everything going on.") +
      p('Big thanks from Morgan and the whole team. Stay tuned.', '36px') +
      btn('Visit the Site', SITE_URL) +
      `<p style="margin:32px 0 0;font-size:11px;color:#333;border-top:1px solid ${BORDER};padding-top:20px;">You're receiving this because you signed up at rileygreen.com.</p>`
    ),
  }
}

function tplWelcome(name: string) {
  const first = (name || '').split(' ')[0] || 'there'
  return {
    subject: 'Welcome to Riley Green Fan Hub',
    html: wrap(
      `${first}, your account is set up and ready.`,
      h2('Welcome to the fan hub.') +
      eye('Your account is ready') +
      p(`Hey ${first},`) +
      p("Your Riley Green fan account has been created. You now have access to early announcements, exclusive content, and more coming soon.") +
      p('Glad to have you here.', '36px') +
      btn('Sign In to Your Account', SITE_URL + '/login')
    ),
  }
}

function tplContactNotify(name: string, email: string, subj: string, msg: string, type: string) {
  const rows = [
    ['From', name || 'Anonymous'],
    ['Email', `<a href="mailto:${email}" style="color:${GOLD};">${email}</a>`],
    ['Type', type || 'general'],
    ['Subject', subj || '(no subject)'],
  ].map(([k, v]) =>
    `<tr>
      <td style="padding:10px 16px 10px 0;border-bottom:1px solid ${BORDER};font-size:11px;color:#555;letter-spacing:2px;text-transform:uppercase;white-space:nowrap;vertical-align:top;">${k}</td>
      <td style="padding:10px 0;border-bottom:1px solid ${BORDER};font-size:14px;color:#F5F0E8;">${v}</td>
    </tr>`
  ).join('')

  return {
    subject: `New message from ${name} \u2014 Riley Green Site`,
    html: wrap(
      `${name} sent a message via the contact form`,
      h2('New Contact Message') +
      eye('Received via website contact form') +
      `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px;">${rows}</table>` +
      `<div style="background:#0D0D0D;border:1px solid ${BORDER};border-left:3px solid ${GOLD};padding:24px;margin:0 0 32px;">` +
      `<p style="margin:0;font-size:14px;color:#999;line-height:1.9;white-space:pre-wrap;">${(msg || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p></div>` +
      btn(`Reply to ${name}`, `mailto:${email}?subject=Re: ${subj}`)
    ),
  }
}

function tplContactAutoReply(name: string) {
  const first = (name || '').split(' ')[0] || 'there'
  return {
    subject: 'Thanks for reaching out \u2014 Riley Green',
    html: wrap(
      `${first}, we got your message and will be in touch soon.`,
      h2('Message received.') +
      eye("We'll be in touch") +
      p(`Hey ${first},`) +
      p("Thanks for reaching out. Your message has been received and the team will get back to you as soon as possible.") +
      p('In the meantime, check out the latest music, tour dates, and merch on the site.', '36px') +
      btn('Visit the Site', SITE_URL)
    ),
  }
}

// ── Handler ────────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  if (SECRET) {
    const provided = req.headers.get('x-site-secret') ?? ''
    if (provided !== SECRET) {
      console.warn('[send-email] Rejected: bad x-site-secret')
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }
  }

  try {
    const payload = await req.json()
    const type        = payload.type        as string
    const name        = (payload.name || payload.contactName || payload.firstName || '') as string
    const toAddr      = (payload.to || payload.contactEmail || '') as string
    const subj        = (payload.subject || payload.contactSubject || '') as string
    const msg         = (payload.message || payload.contactMessage || '') as string
    const contactType = (payload.contactType || 'general') as string

    let tpl: { subject: string; html: string }
    let recipient = toAddr

    if (type === 'newsletter_confirm') {
      tpl = tplNewsletterConfirm(name)
    } else if (type === 'welcome') {
      tpl = tplWelcome(name)
    } else if (type === 'contact_notify') {
      tpl = tplContactNotify(name, toAddr, subj, msg, contactType)
      recipient = GMAIL   // notify goes to admin inbox
    } else if (type === 'contact_auto_reply') {
      tpl = tplContactAutoReply(name)
    } else {
      return new Response(JSON.stringify({ error: 'Unknown type: ' + type }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    if (!recipient) {
      return new Response(JSON.stringify({ error: 'No recipient address' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    if (!GMAIL || !GMAIL_PASS) {
      return new Response(JSON.stringify({ error: 'GMAIL_ADDRESS or GMAIL_APP_PASSWORD not set' }), {
        status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    await smtpSend(recipient, tpl.subject, tpl.html)

    console.log('[send-email] OK:', type, '->', recipient)
    return new Response(
      JSON.stringify({ success: true, type, to: recipient }),
      { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('[send-email] ERROR:', err)
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } }
    )
  }
})
