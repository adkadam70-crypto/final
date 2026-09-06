import { Resend } from 'resend'
import { ADMIN_EMAIL } from '@/lib/admin'

// Same shared Resend sandbox sender already used for password-reset emails
// in lib/auth.ts — swap both to a verified domain address together once one
// is bought.
const NOTIFY_FROM = 'Shortlisted <onboarding@resend.dev>'

// Best-effort — a notification failing should never break the request that
// triggered it (a signup or a rate-limited AI call). Errors are swallowed
// after logging rather than thrown.
export async function notifyAdmin(subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error(`notifyAdmin: RESEND_API_KEY not set, dropped notification "${subject}"`)
    return
  }
  try {
    const resend = new Resend(apiKey)
    const { error } = await resend.emails.send({ from: NOTIFY_FROM, to: ADMIN_EMAIL, subject, html })
    if (error) console.error(`notifyAdmin: Resend error for "${subject}":`, error.message)
  } catch (err) {
    console.error(`notifyAdmin: failed to send "${subject}":`, err)
  }
}
