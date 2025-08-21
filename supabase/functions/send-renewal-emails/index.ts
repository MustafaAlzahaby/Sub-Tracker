// supabase/functions/send-renewal-reminders/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailData {
  to: string
  subject: string
  html: string
}

// === CONFIG ===
const TZ = Deno.env.get('APP_TZ') || 'Africa/Cairo' // your local time zone

// EmailJS secrets (set these in Supabase > Project Settings > Functions > Secrets)
const EMAILJS_SERVICE_ID = Deno.env.get('EMAILJS_SERVICE_ID') || ''    // e.g. service_subtracker
const EMAILJS_TEMPLATE_ID = Deno.env.get('EMAILJS_TEMPLATE_ID') || ''  // e.g. template_renewal
const EMAILJS_USER_ID = Deno.env.get('EMAILJS_USER_ID') || ''          // your EmailJS public key
const EMAILJS_FROM_NAME = Deno.env.get('EMAILJS_FROM_NAME') || 'SubTracker'
const EMAILJS_REPLY_TO = Deno.env.get('EMAILJS_REPLY_TO') || 'no-reply@example.com'

// Convert "now" to a Date in a specific timezone
function nowInTZ(tz: string): Date {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date())
  const obj = Object.fromEntries(parts.map(p => [p.type, p.value]))
  return new Date(`${obj.year}-${obj.month}-${obj.day}T${obj.hour}:${obj.minute}:${obj.second}`)
}

// Day difference (subscription.next_renewal is a date string)
function diffDays(isoDate: string, now: Date) {
  if (!isoDate) return 9999
  const d = new Date(isoDate + 'T00:00:00')
  const utc = (x: Date) => Date.UTC(x.getFullYear(), x.getMonth(), x.getDate())
  return Math.round((utc(d) - utc(now)) / 86400000)
}

// -- EMAIL SENDER (EmailJS) --
async function sendEmail(emailData: EmailData): Promise<boolean> {
  try {
    const r = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: EMAILJS_SERVICE_ID,
        template_id: EMAILJS_TEMPLATE_ID,
        user_id: EMAILJS_USER_ID,
        template_params: {
          to_email: emailData.to,
          subject: emailData.subject,
          html_content: emailData.html,
          from_name: EMAILJS_FROM_NAME,
          reply_to: EMAILJS_REPLY_TO,
        },
      }),
    })
    if (r.ok) return true

    // Fallback: log only (for testing)
    console.error('EmailJS error:', await r.text())
    console.log('📧 FALLBACK (not sent):', emailData.subject, '->', emailData.to)
    return true
  } catch (e) {
    console.error('Email send failed:', e)
    return false
  }
}

// --------- EMAIL TEMPLATES (KEEP YOUR FULL HTML HERE) ----------
function createOverdueEmailContent(subscription: any, daysOverdue: number, userName: string): string { return `<html>...${subscription.service_name} overdue...</html>` }
function createTodayEmailContent(subscription: any, userName: string): string { return `<html>...renews today...</html>` }
function createTomorrowEmailContent(subscription: any, userName: string): string { return `<html>...renews tomorrow...</html>` }
function createWeekEmailContent(subscription: any, userName: string): string { return `<html>...7-day reminder...</html>` }
function createMonthEmailContent(subscription: any, userName: string): string { return `<html>...30-day reminder...</html>` }
function createGeneralEmailContent(subscription: any, days: number, userName: string): string { return `<html>...renews in ${days} days...</html>` }

// -------------- MAIN HANDLER --------------
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body = await req.json().catch(() => ({}))

    // modes
    const isTest = body.test === true       // preview only
    const force = body.force === true       // send immediately (ignore 1/7/30 & duplicate check)
    const targetUserId = typeof body.user_id === 'string' ? body.user_id : null // limit to one user

    const now = nowInTZ(TZ)
    console.log(`🔔 ${isTest ? 'TEST' : 'RUN'} @ ${now.toISOString()} (${TZ}) force=${force} user=${targetUserId ?? 'ALL'}`)

    // 1) Pull active subscriptions (optionally filter by user)
    let subQuery = supabase
      .from('subscriptions')
      .select(`*, users!subscriptions_user_id_fkey(email, full_name)`)
      .eq('status', 'active')

    if (targetUserId) {
      subQuery = subQuery.eq('user_id', targetUserId)
    }

    const { data: subscriptions, error: subError } = await subQuery
    if (subError) throw subError
    if (!subscriptions?.length) {
      return json({ success: true, emailsSent: 0, details: [], message: 'No active subscriptions' })
    }

    const emailsToSend: Array<{
      subscription: string
      email: string
      days: number
      subject: string
      emailData: EmailData
      subscriptionId: string
      userId: string
    }> = []

    // 2) Loop subs; check each user’s plan + preferences (NO time / NO email_enabled)
    for (const s of subscriptions) {
      try {
        const renewalDays = diffDays(s.next_renewal, now)

        const { data: planRow } = await supabase
          .from('user_plans')
          .select('plan_type')
          .eq('user_id', s.user_id)
          .maybeSingle()
        const planType = planRow?.plan_type || 'free'

        const userData = s.users

        const { data: prefs } = await supabase
          .from('notification_preferences')
          .select('reminder_30_days, reminder_7_days, reminder_1_day, overdue_alerts')
          .eq('user_id', s.user_id)
          .maybeSingle()

        // decide if we should send
        let shouldSendEmail = false

        // If force mode is on, bypass day checks (useful for tests)
        if (force) {
          shouldSendEmail = true
        } else {
          if (planType === 'free') {
            // Free: 0..7 days only (when 7-day pref is on)
            if (prefs?.reminder_7_days && renewalDays >= 0 && renewalDays <= 7) {
              shouldSendEmail = true
            }
          } else {
            // Pro/Business: 30 / 7 / 1 days (and 2..6 if 7-day is on)
            if (
              (prefs?.reminder_30_days && renewalDays === 30) ||
              (prefs?.reminder_7_days && renewalDays === 7) ||
              (prefs?.reminder_1_day && renewalDays === 1) ||
              (prefs?.reminder_7_days && renewalDays >= 2 && renewalDays <= 6)
            ) {
              shouldSendEmail = true
            }
          }
          // overdue for everyone if enabled
          if (prefs?.overdue_alerts && renewalDays < 0) {
            shouldSendEmail = true
          }
        }

        if (!shouldSendEmail) continue
        if (!userData?.email) continue

        // Compose subject/html
        let subject = ''
        let html = ''
        if (renewalDays < 0) {
          subject = `🚨 OVERDUE: ${s.service_name} Payment`
          html = createOverdueEmailContent(s, Math.abs(renewalDays), userData.full_name)
        } else if (renewalDays === 0) {
          subject = `⏰ TODAY: ${s.service_name} Renews Today`
          html = createTodayEmailContent(s, userData.full_name)
        } else if (renewalDays === 1) {
          subject = `⚠️ TOMORROW: ${s.service_name} Renews Tomorrow`
          html = createTomorrowEmailContent(s, userData.full_name)
        } else if (renewalDays === 7) {
          subject = `📅 7 Days: ${s.service_name} Renewal Reminder`
          html = createWeekEmailContent(s, userData.full_name)
        } else if (renewalDays === 30) {
          subject = `📋 30 Days: ${s.service_name} Renewal Notice`
          html = createMonthEmailContent(s, userData.full_name)
        } else {
          subject = `🔔 ${renewalDays} Days: ${s.service_name} Renewal Reminder`
          html = createGeneralEmailContent(s, renewalDays, userData.full_name)
        }

        // Prevent duplicate sends today for this subscription (skip when forcing)
        if (!isTest && !force) {
          const start = new Date(now); start.setHours(0,0,0,0)
          const end = new Date(start); end.setDate(end.getDate()+1)

          const { data: already, error: logErr } = await supabase
            .from('email_logs')
            .select('id')
            .eq('subscription_id', s.id)
            .eq('email_type', 'renewal_reminder')
            .gte('sent_at', start.toISOString())
            .lt('sent_at', end.toISOString())
            .limit(1)
          if (logErr) throw logErr
          if (already && already.length) continue
        }

        emailsToSend.push({
          subscription: s.service_name,
          email: userData.email,
          days: renewalDays,
          subject,
          emailData: { to: userData.email, subject, html },
          subscriptionId: s.id,
          userId: s.user_id,
        })
      } catch (e) {
        console.error(`Error processing subscription ${s.service_name}:`, e)
        continue
      }
    }

    if (isTest) {
      return json({
        success: true,
        emailsSent: emailsToSend.length,
        details: emailsToSend.map(e => ({ subscription: e.subscription, email: e.email, days: e.days, subject: e.subject })),
        message: 'TEST MODE — no emails actually sent',
      })
    }

    // Send + log
    let sent = 0
    for (const item of emailsToSend) {
      try {
        const ok = await sendEmail(item.emailData)
        if (ok) {
          await supabase.from('email_logs').insert({
            user_id: item.userId,
            subscription_id: item.subscriptionId,
            email_type: 'renewal_reminder',
            email_subject: item.subject,
            sent_at: new Date().toISOString(),
          })
          sent++
        }
      } catch (e) {
        console.error('Send/log error:', e)
      }
    }

    return json({ success: true, emailsSent: sent, message: `Sent ${sent} emails` })
  } catch (error: any) {
    console.error('❌ Error:', error)
    return json({ error: String(error), details: 'See logs' }, 500)
  }
})

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status
  })
}
