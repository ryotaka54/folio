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

const SYSTEM = `You are an expert career coach specializing in technical and behavioral interview preparation.
Respond ONLY with a valid JSON object — no markdown, no backticks, no commentary.
The JSON must match this shape exactly:
{
  "overview": "2-sentence company/role overview",
  "behavioral": ["question 1", "question 2", "question 3"],
  "technical": ["question 1", "question 2", "question 3"],
  "tips": ["tip 1", "tip 2", "tip 3"],
  "resources": ["resource 1", "resource 2"]
}`;

export async function POST(request: Request) {
  try {
    const { userId, applicationId, company, role, stage, notes } = await request.json();
    if (!userId || !applicationId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = getSupabase();
    const { data: profile } = await supabase
      .from('users')
      .select('pro, pro_expires_at')
      .eq('id', userId)
      .single();

    const userIsPro = isProServer(profile);

    // Check for cached result
    const { data: app } = await supabase
      .from('applications')
      .select('ai_interview_prep')
      .eq('id', applicationId)
      .single();

    if (app?.ai_interview_prep) {
      return NextResponse.json({ result: app.ai_interview_prep, cached: true });
    }

    const { allowed, used, limit } = await checkRateLimit(userId, 'interview-prep', userIsPro);
    if (!allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded', used, limit }, { status: 429 });
    }

    const prompt = `Prepare me for an interview at ${company} for the role of ${role}.
Current stage: ${stage}
${notes ? `My notes: ${notes}` : ''}
Give me a tailored interview prep plan.`;

    const raw = await callClaude(prompt, SYSTEM);
    const result = JSON.parse(raw);

    await supabase
      .from('applications')
      .update({ ai_interview_prep: result })
      .eq('id', applicationId);

    await recordUsage(userId, 'interview-prep');
    await recordEvent(userId, 'interview-prep', { company, role, stage });

    return NextResponse.json({ result, cached: false });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('interview-prep error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
