// src/lib/email.ts
import { supabase } from './supabase';

type ReminderSettings = {
  reminder_30_days: boolean;
  reminder_7_days: boolean;
  reminder_1_day: boolean;
};

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID as string;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string;
const PUBLIC_KEY  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY as string;
const FROM_NAME   = (import.meta.env.VITE_EMAILJS_FROM_NAME as string) || 'SubTracker';
const REPLY_TO    = (import.meta.env.VITE_EMAILJS_REPLY_TO as string) || 'no-reply@subtracker.com';

// Brand envs (all optional)
const BRAND_NAME   = (import.meta.env.VITE_BRAND_NAME as string) || 'SubTracker';
const APP_URL      = (import.meta.env.VITE_APP_URL as string) || '';
const LOGO_URL     = (import.meta.env.VITE_LOGO_URL as string) || '';

const GRAD_FROM    = (import.meta.env.VITE_BRAND_GRADIENT_FROM as string) || '#10B981'; // emerald
const GRAD_TO      = (import.meta.env.VITE_BRAND_GRADIENT_TO as string)   || '#6366F1'; // indigo
const TEXT_COLOR   = (import.meta.env.VITE_TEXT_COLOR as string)          || '#0F172A';
const MUTED_COLOR  = (import.meta.env.VITE_MUTED_COLOR as string)         || '#64748B';
const BORDER_COLOR = (import.meta.env.VITE_BORDER_COLOR as string)        || '#E5E7EB';
const BG_SOFT      = (import.meta.env.VITE_BG_SOFT as string)             || '#F8FAFC';

function daysLeftOf(iso: string) {
  const today = new Date(); today.setHours(0,0,0,0);
  const d = new Date(iso);  d.setHours(0,0,0,0);
  return Math.round((+d - +today) / 86400000);
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

type SendResult =
  | { sent: true; count: number }
  | { sent: false; reason: 'no_toggles_selected' | 'no_matches' | 'rate_limited'; nextAllowedAt?: string };

export async function sendTestReminderEmail(reminderSettings: ReminderSettings): Promise<SendResult> {
  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
    throw new Error('EmailJS env vars missing. Check VITE_EMAILJS_* in .env.local');
  }

  // 1) Session
  const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
  if (sessionErr) throw sessionErr;
  if (!session?.user) throw new Error('You must be signed in.');

  // 2) Target email
  let toEmail: string | null = session.user.email ?? null;
  if (!toEmail) {
    const { data: row } = await supabase
      .from('users') // change if your table is "profiles"
      .select('email')
      .eq('id', session.user.id)
      .maybeSingle();
    toEmail = row?.email ?? null;
  }
  if (!toEmail) throw new Error('No email found for your account.');

  // 3) Anchor date (resets monthly limit when settings change)
  const { data: prefs, error: prefsErr } = await supabase
    .from('notification_preferences')
    .select('updated_at')
    .eq('user_id', session.user.id)
    .maybeSingle();
  if (prefsErr) throw prefsErr;

  const anchor = prefs?.updated_at ? new Date(prefs.updated_at) : new Date();

  // 4) Rate limit by month
  const { data: lastLogRows, error: logErr } = await supabase
    .from('email_logs')
    .select('sent_at')
    .eq('user_id', session.user.id)
    .eq('email_type', 'renewal_reminder')
    .order('sent_at', { ascending: false })
    .limit(1);
  if (logErr) throw logErr;

  const lastSentAt = lastLogRows?.[0]?.sent_at ? new Date(lastLogRows[0].sent_at) : null;
  const now = new Date();

  if (lastSentAt && lastSentAt >= anchor) {
    const msSince = now.getTime() - lastSentAt.getTime();
    if (msSince < THIRTY_DAYS_MS) {
      const nextAllowedAt = new Date(lastSentAt.getTime() + THIRTY_DAYS_MS).toISOString();
      return { sent: false, reason: 'rate_limited', nextAllowedAt };
    }
  }

  // 5) Active subs
  const { data: subs, error: subsErr } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', session.user.id)
    .eq('status', 'active');
  if (subsErr) throw subsErr;

  // 6) Selected windows
  const ranges: Array<[number, number]> = [];
  if (reminderSettings.reminder_30_days) ranges.push([1, 30]);
  if (reminderSettings.reminder_7_days)  ranges.push([1, 7]);
  if (reminderSettings.reminder_1_day)   ranges.push([0, 1]);
  if (ranges.length === 0) return { sent: false, reason: 'no_toggles_selected' };

  const matches = (subs || [])
    .map(s => ({ ...s, daysLeft: daysLeftOf(s.next_renewal) }))
    .filter(s => ranges.some(([min, max]) => s.daysLeft >= min && s.daysLeft <= max));

  if (!matches.length) return { sent: false, reason: 'no_matches' };

  // 7) Build PROFESSIONAL HTML (no EmailJS branding)
  const brandButton = APP_URL
    ? `<a href="${APP_URL}" style="display:inline-block;padding:12px 18px;border-radius:12px;background:${GRAD_TO};color:#fff;text-decoration:none;font-weight:600">Open ${BRAND_NAME}</a>`
    : '';

  const rows = matches.map(s => {
    const amount = Number(s.cost || 0).toFixed(2);
    const date   = new Date(s.next_renewal).toLocaleDateString();
    const label =
      s.daysLeft < 0 ? `${Math.abs(s.daysLeft)} day(s) overdue` :
      s.daysLeft === 0 ? 'due today' :
      s.daysLeft === 1 ? 'due tomorrow' : `in ${s.daysLeft} day(s)`;

    // badge color logic
    const badgeBg =
      s.daysLeft < 0 ? '#FEE2E2' :           // red-100
      s.daysLeft <= 1 ? '#FFEDD5' :          // orange-100
      s.daysLeft <= 7 ? '#FEF9C3' :          // yellow-100
                        '#DBEAFE';           // blue-100
    const badgeTx =
      s.daysLeft < 0 ? '#B91C1C' :
      s.daysLeft <= 1 ? '#C2410C' :
      s.daysLeft <= 7 ? '#854D0E' :
                        '#1D4ED8';

    return `
      <tr>
        <td style="padding:14px 16px;border-bottom:1px solid ${BORDER_COLOR}">
          <div style="font-weight:600;color:${TEXT_COLOR};">${s.service_name}</div>
          <div style="font-size:12px;color:${MUTED_COLOR};margin-top:4px;">$${amount} • ${s.billing_cycle}</div>
        </td>
        <td style="padding:14px 16px;border-bottom:1px solid ${BORDER_COLOR};white-space:nowrap;text-align:right;">
          <div style="font-size:13px;color:${TEXT_COLOR};">${date}</div>
          <span style="display:inline-block;margin-top:6px;padding:4px 10px;border-radius:999px;background:${badgeBg};color:${badgeTx};font-size:12px;font-weight:600;">
            ${label}
          </span>
        </td>
      </tr>
    `;
  }).join('');

  const html = `
  <!doctype html>
  <html>
  <head>
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta charSet="utf-8" />
    <title>${BRAND_NAME} • Renewal Reminder</title>
  </head>
  <body style="margin:0;padding:0;background:${BG_SOFT};">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;background:${BG_SOFT};padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:640px;max-width:92%;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid ${BORDER_COLOR}">
            <!-- Header -->
            <tr>
              <td style="padding:28px 24px;background:linear-gradient(135deg, ${GRAD_FROM}, ${GRAD_TO});">
                <table width="100%">
                  <tr>
                    <td style="vertical-align:middle;">
                      ${LOGO_URL
                        ? `<img src="${LOGO_URL}" alt="${BRAND_NAME}" height="32" style="height:32px;display:block;" />`
                        : `<div style="font-size:20px;font-weight:700;color:#fff;">${BRAND_NAME}</div>`
                      }
                    </td>
                    <td style="text-align:right;vertical-align:middle;">
                      <div style="font-size:13px;color:rgba(255,255,255,.9);font-weight:600;">Renewal Reminder</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Content -->
            <tr>
              <td style="padding:24px 24px 4px 24px;">
                <div style="font-family:Segoe UI,Arial,sans-serif;color:${TEXT_COLOR};">
                  <h1 style="margin:0 0 8px 0;font-size:20px;line-height:1.3;">Hi ${toEmail},</h1>
                  <p style="margin:0 0 16px 0;color:${MUTED_COLOR};">
                    Here are the subscriptions that match your reminder window(s) today.
                  </p>
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:0 24px 8px 24px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;border:1px solid ${BORDER_COLOR};border-radius:14px;overflow:hidden;background:#fff">
                  ${rows}
                </table>
              </td>
            </tr>

            ${APP_URL ? `
            <tr>
              <td style="padding:8px 24px 24px 24px;">
                <div style="padding:16px;border:1px dashed ${BORDER_COLOR};border-radius:14px;background:${BG_SOFT};text-align:center;">
                  <div style="font-size:13px;color:${MUTED_COLOR};margin-bottom:8px;">
                    Manage, pause, or cancel subscriptions anytime.
                  </div>
                  ${brandButton}
                </div>
              </td>
            </tr>
            ` : ''}

            <!-- Footer -->
            <tr>
              <td style="padding:20px 24px;background:#fff;border-top:1px solid ${BORDER_COLOR}">
                <table width="100%">
                  <tr>
                    <td style="font-size:12px;color:${MUTED_COLOR};">
                      You’re receiving this because renewal reminders are enabled in your ${BRAND_NAME} settings.
                    </td>
                    <td style="text-align:right;font-size:12px;color:${MUTED_COLOR};">
                      © ${new Date().getFullYear()} ${BRAND_NAME}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;

  // 8) Send via EmailJS (content has NO EmailJS branding)
  const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id: SERVICE_ID,
      template_id: TEMPLATE_ID,
      user_id: PUBLIC_KEY,
      template_params: {
        to_email: toEmail,                // EmailJS template "To" must be {{to_email}}
        subject: 'Subscription renewal reminder',
        html_content: html,               // Template body is just {{{html_content}}}
        from_name: FROM_NAME,
        reply_to: REPLY_TO,
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`EmailJS failed: ${text}`);
  }

  // 9) Log send (for monthly rate limit)
  await supabase.from('email_logs').insert({
    user_id: session.user.id,
    subscription_id: null,
    email_type: 'renewal_reminder',
    email_subject: 'Subscription renewal reminder',
    sent_at: new Date().toISOString(),
  });

  return { sent: true, count: matches.length };
}
