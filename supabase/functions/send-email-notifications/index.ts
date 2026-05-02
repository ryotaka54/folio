// Supabase Edge Function: send-email-notifications
// Sends deadline reminders and weekly digests via Resend.
//
// Deploy: supabase functions deploy send-email-notifications
// Required env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY
//
// Triggered by Supabase Scheduler (pg_cron):
//   Deadline reminders: 0 8 * * *   (daily at 08:00 UTC)
//   Weekly digest:      0 9 * * 1   (Mondays at 09:00 UTC)
//
// Invoke manually:
//   supabase functions invoke send-email-notifications --body '{"type":"deadline_reminder"}'
//   supabase functions invoke send-email-notifications --body '{"type":"weekly_digest"}'

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_KEY   = Deno.env.get('RESEND_API_KEY')!;
const FROM_EMAIL   = 'Applyd <notifications@applyd.co>';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// ─── Resend helper ─────────────────────────────────────────────────────────────

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${RESEND_KEY}`,
    },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  });
  return res.ok;
}

// ─── Deadline reminders ────────────────────────────────────────────────────────

async function sendDeadlineReminders() {
  const today = new Date();
  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() + 3);

  // Get users with deadline reminders enabled and pro
  const { data: users } = await supabase
    .from('users')
    .select('id, name, email:id')
    .eq('email_deadline_reminders', true)
    .eq('pro', true);

  if (!users?.length) return;

  for (const user of users) {
    // Get auth email
    const { data: authUser } = await supabase.auth.admin.getUserById(user.id);
    const email = authUser?.user?.email;
    if (!email) continue;

    // Applications with deadline in next 3 days, not rejected/withdrawn
    const { data: apps } = await supabase
      .from('applications')
      .select('id, company, role, status, deadline')
      .eq('user_id', user.id)
      .not('status', 'in', '("Rejected","Withdrawn","Offer — Declined")')
      .lte('deadline', cutoff.toISOString().split('T')[0])
      .gte('deadline', today.toISOString().split('T')[0])
      .order('deadline');

    if (!apps?.length) continue;

    for (const app of apps) {
      const refKey = `${app.id}_${app.deadline}`;

      // Skip if already sent
      const { data: existing } = await supabase
        .from('email_notification_log')
        .select('id')
        .eq('user_id', user.id)
        .eq('type', 'deadline_reminder')
        .eq('reference_key', refKey)
        .maybeSingle();
      if (existing) continue;

      const deadlineDate = new Date(app.deadline + 'T00:00:00Z');
      const daysLeft = Math.ceil((deadlineDate.getTime() - today.getTime()) / 86400000);
      const urgency  = daysLeft <= 1 ? '🚨' : daysLeft <= 2 ? '⚠️' : '📅';

      const subject = `${urgency} ${app.company} deadline in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`;
      const html = `
        <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <p style="font-size:16px;font-weight:600;color:#0f172a;margin:0 0 8px">
            ${app.company} — ${app.role}
          </p>
          <p style="font-size:14px;color:#64748b;margin:0 0 16px">
            Deadline: <strong>${app.deadline}</strong> (${daysLeft} day${daysLeft !== 1 ? 's' : ''} away)
          </p>
          <p style="font-size:13px;color:#64748b;margin:0 0 20px">Status: ${app.status}</p>
          <a href="https://applyd.co/dashboard" style="display:inline-block;padding:10px 20px;background:#1e3a5f;color:#fff;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600">
            View in Applyd →
          </a>
          <p style="font-size:11px;color:#94a3b8;margin:24px 0 0">
            You're receiving this because deadline reminders are enabled.
            <a href="https://applyd.co/settings?section=notifications" style="color:#94a3b8">Manage preferences</a>
          </p>
        </div>`;

      const sent = await sendEmail(email, subject, html);
      if (sent) {
        await supabase.from('email_notification_log').insert({
          user_id: user.id,
          type: 'deadline_reminder',
          reference_key: refKey,
        });
      }
    }
  }
}

// ─── Weekly digest ─────────────────────────────────────────────────────────────

function isoWeek(d: Date): string {
  const jan4 = new Date(d.getFullYear(), 0, 4);
  const weekNum = Math.ceil(((d.getTime() - jan4.getTime()) / 86400000 + jan4.getDay() + 1) / 7);
  return `week_${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

async function sendWeeklyDigests() {
  const { data: users } = await supabase
    .from('users')
    .select('id, name')
    .eq('email_weekly_digest', true)
    .eq('pro', true);

  if (!users?.length) return;

  const refKey = isoWeek(new Date());

  for (const user of users) {
    const { data: authUser } = await supabase.auth.admin.getUserById(user.id);
    const email = authUser?.user?.email;
    if (!email) continue;

    const { data: existing } = await supabase
      .from('email_notification_log')
      .select('id')
      .eq('user_id', user.id)
      .eq('type', 'weekly_digest')
      .eq('reference_key', refKey)
      .maybeSingle();
    if (existing) continue;

    const { data: apps } = await supabase
      .from('applications')
      .select('id, company, role, status, deadline, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (!apps?.length) continue;

    const active = apps.filter(a => !['Rejected','Withdrawn','Offer — Declined','Accepted'].includes(a.status));
    const upcoming = apps.filter(a => a.deadline && new Date(a.deadline) >= new Date() && !['Rejected','Withdrawn'].includes(a.status))
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
      .slice(0, 5);

    const statusCounts: Record<string, number> = {};
    for (const a of active) {
      statusCounts[a.status] = (statusCounts[a.status] ?? 0) + 1;
    }

    const statusRows = Object.entries(statusCounts)
      .map(([s, n]) => `<tr><td style="padding:4px 8px;font-size:13px;color:#64748b">${s}</td><td style="padding:4px 8px;font-size:13px;font-weight:600;color:#0f172a;text-align:right">${n}</td></tr>`)
      .join('');

    const deadlineRows = upcoming.map(a =>
      `<tr><td style="padding:4px 8px;font-size:13px;color:#0f172a">${a.company}</td><td style="padding:4px 8px;font-size:13px;color:#64748b">${a.role}</td><td style="padding:4px 8px;font-size:13px;color:#dc2626;text-align:right">${a.deadline}</td></tr>`
    ).join('');

    const html = `
      <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:24px">
        <p style="font-size:18px;font-weight:700;color:#0f172a;margin:0 0 4px">Your weekly brief</p>
        <p style="font-size:13px;color:#64748b;margin:0 0 20px">${active.length} active application${active.length !== 1 ? 's' : ''}</p>

        ${statusRows ? `
        <p style="font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;margin:0 0 8px">Pipeline</p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px">${statusRows}</table>` : ''}

        ${deadlineRows ? `
        <p style="font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;margin:0 0 8px">Upcoming deadlines</p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px">${deadlineRows}</table>` : ''}

        <a href="https://applyd.co/dashboard" style="display:inline-block;padding:10px 20px;background:#1e3a5f;color:#fff;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600">
          Open dashboard →
        </a>
        <p style="font-size:11px;color:#94a3b8;margin:24px 0 0">
          Weekly digest from Applyd.
          <a href="https://applyd.co/settings?section=notifications" style="color:#94a3b8">Manage preferences</a>
        </p>
      </div>`;

    const sent = await sendEmail(email, `Your Applyd weekly brief — ${active.length} active apps`, html);
    if (sent) {
      await supabase.from('email_notification_log').insert({
        user_id: user.id,
        type: 'weekly_digest',
        reference_key: refKey,
      });
    }
  }
}

// ─── Entry point ───────────────────────────────────────────────────────────────

serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({}));
    const type = body.type as string | undefined;

    if (type === 'deadline_reminder') {
      await sendDeadlineReminders();
    } else if (type === 'weekly_digest') {
      await sendWeeklyDigests();
    } else {
      return new Response(JSON.stringify({ error: 'type must be deadline_reminder or weekly_digest' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
