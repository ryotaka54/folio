// Supabase Edge Function: sync-google-calendar
// Called server-side to create/update/delete Google Calendar events.
// Never exposes tokens to the client — all API calls happen here.
//
// Deploy: supabase functions deploy sync-google-calendar
// Required env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface SyncPayload {
  action: 'create' | 'update' | 'delete';
  application: {
    id: string;
    user_id: string;
    company: string;
    role: string;
    deadline: string | null;
    status: string;
    google_calendar_event_id?: string | null;
  };
}

const GCAL_BASE = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

// Refresh an access token using the stored refresh token
async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'refresh_token',
      refresh_token: refreshToken,
      client_id:     Deno.env.get('GOOGLE_CLIENT_ID')!,
      client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET')!,
    }),
  });
  if (!res.ok) throw new Error(`Token refresh failed: ${await res.text()}`);
  return res.json();
}

function buildGCalEvent(app: SyncPayload['application']) {
  const dateStr = app.deadline!; // YYYY-MM-DD
  const nextDay = new Date(new Date(dateStr + 'T00:00:00').getTime() + 86400000)
    .toISOString().split('T')[0];

  const isInterview = ['Phone / Recruiter Screen', 'Final Round Interviews', 'Recruiter Screen',
    'Technical / Case Interview', 'Final Round'].includes(app.status);
  const isOA     = app.status === 'OA / Online Assessment';
  const isOffer  = ['Offer', 'Offer — Negotiating'].includes(app.status);
  const label    = isInterview ? 'Interview' : isOA ? 'Online Assessment' : isOffer ? 'Offer Deadline' : 'Application Deadline';
  // Google Calendar colors: 1=lavender 2=sage 3=grape 4=flamingo 5=banana 6=tangerine 7=peacock 8=graphite 9=blueberry 10=basil 11=tomato
  const colorId  = isInterview ? '9' : isOA ? '3' : isOffer ? '10' : '5';

  return {
    summary: `Applyd — ${app.company} — ${label}`,
    description: `${app.role}\n\nManage this application in Applyd: https://useapplyd.com`,
    start: { date: dateStr },
    end:   { date: nextDay },
    colorId,
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 24 * 60 },
        { method: 'popup', minutes: 60 },
      ],
    },
  };
}

serve(async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const payload: SyncPayload = await req.json();
  const { action, application } = payload;

  // Only sync if there's a deadline
  if (!application.deadline && action !== 'delete') {
    return new Response(JSON.stringify({ skipped: true }), { status: 200 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Fetch user's tokens
  const { data: integration, error: intErr } = await supabase
    .from('user_integrations')
    .select('access_token, refresh_token, token_expiry')
    .eq('user_id', application.user_id)
    .eq('provider', 'google_calendar')
    .maybeSingle();

  if (intErr || !integration) {
    // User hasn't connected Google Calendar — skip silently
    return new Response(JSON.stringify({ skipped: true, reason: 'not_connected' }), { status: 200 });
  }

  // Refresh token if needed
  let accessToken = integration.access_token;
  if (integration.token_expiry && new Date(integration.token_expiry) <= new Date()) {
    if (!integration.refresh_token) {
      return new Response(JSON.stringify({ error: 'token_expired_no_refresh' }), { status: 400 });
    }
    const refreshed = await refreshAccessToken(integration.refresh_token);
    accessToken = refreshed.access_token;
    // Update stored token
    await supabase.from('user_integrations').update({
      access_token: accessToken,
      token_expiry: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
    }).eq('user_id', application.user_id).eq('provider', 'google_calendar');
  }

  const headers = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

  try {
    if (action === 'create') {
      const res = await fetch(GCAL_BASE, {
        method: 'POST', headers,
        body: JSON.stringify(buildGCalEvent(application)),
      });
      if (!res.ok) throw new Error(await res.text());
      const event = await res.json() as { id: string };
      // Store Google Calendar event ID back on the application
      await supabase.from('applications')
        .update({ google_calendar_event_id: event.id })
        .eq('id', application.id);
      return new Response(JSON.stringify({ eventId: event.id }), { status: 200 });

    } else if (action === 'update') {
      const eventId = application.google_calendar_event_id;
      if (!eventId) {
        // No existing event — create one instead
        const res = await fetch(GCAL_BASE, {
          method: 'POST', headers,
          body: JSON.stringify(buildGCalEvent(application)),
        });
        if (!res.ok) throw new Error(await res.text());
        const event = await res.json() as { id: string };
        await supabase.from('applications')
          .update({ google_calendar_event_id: event.id })
          .eq('id', application.id);
        return new Response(JSON.stringify({ eventId: event.id }), { status: 200 });
      }
      const res = await fetch(`${GCAL_BASE}/${eventId}`, {
        method: 'PUT', headers,
        body: JSON.stringify(buildGCalEvent(application)),
      });
      if (!res.ok) throw new Error(await res.text());
      return new Response(JSON.stringify({ updated: true }), { status: 200 });

    } else if (action === 'delete') {
      const eventId = application.google_calendar_event_id;
      if (!eventId) return new Response(JSON.stringify({ skipped: true }), { status: 200 });
      await fetch(`${GCAL_BASE}/${eventId}`, { method: 'DELETE', headers });
      return new Response(JSON.stringify({ deleted: true }), { status: 200 });
    }
  } catch (err) {
    console.error('Google Calendar sync error:', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }

  return new Response('Bad action', { status: 400 });
});
