// Supabase Edge Function: send-email
// Deploy with: supabase functions deploy send-email
// This function handles newsletter confirmation and contact form notification emails
// via Google SMTP (Gmail App Password)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const GMAIL = Deno.env.get('GMAIL_ADDRESS') ?? ''
const GMAIL_PASS = Deno.env.get('GMAIL_APP_PASSWORD') ?? ''
const SITE_NAME = 'Morgan Wallen Official'

interface EmailPayload {
  type: 'newsletter_confirm' | 'contact_notify'
  to?: string
  firstName?: string
  confirmationToken?: string
  contactName?: string
  contactEmail?: string
  contactSubject?: string
  contactMessage?: string
  contactType?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const payload: EmailPayload = await req.json()

    let subject = ''
    let html = ''
    let to = ''

    if (payload.type === 'newsletter_confirm') {
      to = payload.to ?? ''
      subject = `Welcome to the ${SITE_NAME} Fan Club!`
      html = `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #0d0d14; color: #F0EAD6; padding: 40px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="font-size: 28px; color: #c9a84c; letter-spacing: 0.1em; text-transform: uppercase;">Morgan Wallen</h1>
            <p style="color: #c9a84c; font-size: 11px; letter-spacing: 0.3em; text-transform: uppercase;">Official Fan Club</p>
          </div>
          <h2 style="font-size: 22px; margin-bottom: 16px;">Hey ${payload.firstName ?? 'there'}!</h2>
          <p style="color: rgba(240,234,214,0.7); line-height: 1.7;">
            Thanks for subscribing to the official Morgan Wallen newsletter. You'll be the first to know about new music, tour dates, exclusive content, and more.
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="https://morganwallenofficial.pages.dev/news" style="display: inline-block; background: #c9a84c; color: #0d0d14; padding: 14px 32px; text-decoration: none; font-family: sans-serif; font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase; font-weight: 700;">
              Visit the Site
            </a>
          </div>
          <p style="color: rgba(240,234,214,0.4); font-size: 12px; text-align: center;">
            Don't want to receive these emails? <a href="#" style="color: #c9a84c;">Unsubscribe here</a>
          </p>
        </div>
      `
    } else if (payload.type === 'contact_notify') {
      to = GMAIL
      subject = `[${SITE_NAME}] New ${payload.contactType ?? 'general'} inquiry from ${payload.contactName}`
      html = `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #0d0d14; color: #F0EAD6; padding: 40px;">
          <h2 style="color: #c9a84c;">New Contact Form Submission</h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <tr><td style="padding: 10px 0; border-bottom: 1px solid rgba(201,168,76,0.2); color: rgba(240,234,214,0.5); width: 120px;">Type</td><td style="padding: 10px 0; border-bottom: 1px solid rgba(201,168,76,0.2);">${payload.contactType}</td></tr>
            <tr><td style="padding: 10px 0; border-bottom: 1px solid rgba(201,168,76,0.2); color: rgba(240,234,214,0.5);">Name</td><td style="padding: 10px 0; border-bottom: 1px solid rgba(201,168,76,0.2);">${payload.contactName}</td></tr>
            <tr><td style="padding: 10px 0; border-bottom: 1px solid rgba(201,168,76,0.2); color: rgba(240,234,214,0.5);">Email</td><td style="padding: 10px 0; border-bottom: 1px solid rgba(201,168,76,0.2);"><a href="mailto:${payload.contactEmail}" style="color: #c9a84c;">${payload.contactEmail}</a></td></tr>
            <tr><td style="padding: 10px 0; border-bottom: 1px solid rgba(201,168,76,0.2); color: rgba(240,234,214,0.5);">Subject</td><td style="padding: 10px 0; border-bottom: 1px solid rgba(201,168,76,0.2);">${payload.contactSubject ?? '—'}</td></tr>
          </table>
          <div style="margin-top: 24px; padding: 20px; background: #13131f; border-left: 3px solid #c9a84c;">
            <p style="color: rgba(240,234,214,0.7); line-height: 1.7; white-space: pre-wrap;">${payload.contactMessage}</p>
          </div>
          <p style="color: rgba(240,234,214,0.3); font-size: 12px; margin-top: 24px;">
            Submitted via morganwallenofficial.pages.dev
          </p>
        </div>
      `
    }

    if (!to || !subject || !html) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400 })
    }

    // Send via Gmail SMTP using Deno
    const { SMTPClient } = await import('https://deno.land/x/denomailer@1.6.0/mod.ts')
    const client = new SMTPClient({
      connection: { hostname: 'smtp.gmail.com', port: 465, tls: true, auth: { username: GMAIL, password: GMAIL_PASS } }
    })
    await client.send({ from: `${SITE_NAME} <${GMAIL}>`, to, subject, html })
    await client.close()

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  }
})
