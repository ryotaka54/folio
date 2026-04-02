// Supabase Edge Function: google-oauth-callback
// Handles the OAuth callback from Google, exchanges the code for tokens,
// stores them in user_integrations, and redirects to /calendar?connected=true
//
// Deploy: supabase functions deploy google-oauth-callback
// Required env vars (set in Supabase dashboard → Edge Functions → Secrets):
//   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, APP_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req: Request) => {
  const url = new URL(req.url);
  const code  = url.searchParams.get('code');
  const state = url.searchParams.get('state'); // user_id
  const error = url.searchParams.get('error');

  const APP_URL = Deno.env.get('APP_URL') ?? 'http://localhost:3000';

  if (error || !code || !state) {
    return Response.redirect(`${APP_URL}/calendar?error=oauth_failed`, 302);
  }

  try {
    // Exchange authorization code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id:     Deno.env.get('GOOGLE_CLIENT_ID')!,
        client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET')!,
        redirect_uri:  `${Deno.env.get('SUPABASE_URL')}/functions/v1/google-oauth-callback`,
        grant_type:    'authorization_code',
      }),
    });

    if (!tokenRes.ok) throw new Error(`Token exchange failed: ${await tokenRes.text()}`);
    const tokens = await tokenRes.json() as {
      access_token: string; refresh_token?: string; expires_in: number; token_type: string;
    };

    // Get the connected Google account email
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v1/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const userInfo = userInfoRes.ok ? await userInfoRes.json() as { email?: string } : {};

    // Store tokens in Supabase using service role (bypasses RLS)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const expiry = new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000).toISOString();

    const { error: dbError } = await supabase
      .from('user_integrations')
      .upsert({
        user_id:       state,
        provider:      'google_calendar',
        access_token:  tokens.access_token,
        refresh_token: tokens.refresh_token ?? null,
        token_expiry:  expiry,
        provider_email: userInfo.email ?? null,
        connected_at:  new Date().toISOString(),
      }, { onConflict: 'user_id,provider' });

    if (dbError) throw dbError;

    return Response.redirect(`${APP_URL}/calendar?connected=true`, 302);
  } catch (err) {
    console.error('OAuth callback error:', err);
    return Response.redirect(`${APP_URL}/calendar?error=oauth_failed`, 302);
  }
});
