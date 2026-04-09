import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, recordUsage, recordEvent, callClaude } from '@/lib/anthropic';
import { isProServer } from '@/lib/anthropic';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

const SYSTEM = `You are an expert hiring consultant who evaluates job application competitiveness.
Respond ONLY with a valid JSON object — no markdown, no backticks, no commentary.
The JSON must match this shape exactly:
{
  "score": 75,
  "label": "Competitive",
  "summary": "One concise sentence summarizing the applicant's competitive position.",
  "strengths": ["strength 1", "strength 2"],
  "gaps": ["gap 1", "gap 2"],
  "tip": "One actionable tip to improve the application."
}
score must be a number 0-100. label must be one of: "Strong", "Competitive", "Fair", "Challenging".`;

export async function POST(request: Request) {
  try {
    const { userId, applicationId, company, role, category, location } = await request.json();
    if (!userId || !company || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = getSupabase();
    const { data: profile } = await supabase
      .from('users')
      .select('pro, pro_expires_at, school_year, mode')
      .eq('id', userId)
      .single();

    const userIsPro = isProServer(profile);

    // Check cache (only if applicationId provided)
    if (applicationId) {
      const { data: app } = await supabase
        .from('applications')
        .select('ai_strength_signal')
        .eq('id', applicationId)
        .single();

      if (app?.ai_strength_signal) {
        return NextResponse.json({ result: app.ai_strength_signal, cached: true });
      }
    }

    const { allowed, used, limit } = await checkRateLimit(userId, 'strength-signal', userIsPro);
    if (!allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded', used, limit }, { status: 429 });
    }

    const prompt = `Evaluate the strength of this job application:
Company: ${company}
Role: ${role}
${category ? `Category: ${category}` : ''}
${location ? `Location: ${location}` : ''}
${profile?.school_year ? `Applicant school year: ${profile.school_year}` : ''}
${profile?.mode === 'internship' ? 'This is for an internship position.' : 'This is for a full-time position.'}

Rate how competitive this application is likely to be.`;

    const raw = await callClaude(prompt, SYSTEM);
    const result = JSON.parse(raw);

    if (applicationId) {
      await supabase
        .from('applications')
        .update({ ai_strength_signal: result })
        .eq('id', applicationId);
    }

    await recordUsage(userId, 'strength-signal');
    await recordEvent(userId, 'strength-signal', { company, role });

    return NextResponse.json({ result, cached: false });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('strength-signal error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
