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

const SYSTEM = `You are an expert offer negotiation coach for tech and business careers.
Respond ONLY with a valid JSON object — no markdown, no backticks, no commentary.
The JSON must match this shape exactly:
{
  "salaryRange": "$X–$Y / year (or per hour for internships)",
  "negotiationScript": "A word-for-word opening line to start negotiation",
  "tactics": ["tactic 1", "tactic 2", "tactic 3"],
  "redFlags": ["flag 1"],
  "questions": ["question to ask 1", "question to ask 2", "question to ask 3"],
  "verdict": "One sentence on overall offer strength and negotiability."
}`;

export async function POST(request: Request) {
  try {
    const { userId, applicationId, company, role, category, location } = await request.json();
    if (!userId || !applicationId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = getSupabase();
    const { data: profile } = await supabase
      .from('users')
      .select('pro, pro_expires_at, school_year, mode')
      .eq('id', userId)
      .single();

    const userIsPro = isProServer(profile);

    // Check cache
    const { data: app } = await supabase
      .from('applications')
      .select('ai_offer_intelligence')
      .eq('id', applicationId)
      .single();

    if (app?.ai_offer_intelligence) {
      return NextResponse.json({ result: app.ai_offer_intelligence, cached: true });
    }

    const { allowed, used, limit } = await checkRateLimit(userId, 'offer-intelligence', userIsPro);
    if (!allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded', used, limit }, { status: 429 });
    }

    const prompt = `I just received an offer from ${company} for the ${role} role.
${category ? `Category: ${category}` : ''}
${location ? `Location: ${location}` : ''}
${profile?.school_year ? `My school year / experience level: ${profile.school_year}` : ''}
${profile?.mode === 'internship' ? 'This is an internship offer.' : 'This is a full-time offer.'}

Give me a negotiation strategy including typical salary ranges, tactics, and key questions to ask.`;

    const raw = await callClaude(prompt, SYSTEM);
    const result = JSON.parse(raw);

    await supabase
      .from('applications')
      .update({ ai_offer_intelligence: result })
      .eq('id', applicationId);

    await recordUsage(userId, 'offer-intelligence');
    await recordEvent(userId, 'offer-intelligence', { company, role });

    return NextResponse.json({ result, cached: false });
  } catch (err) {
    console.error('offer-intelligence error:', err);
    return NextResponse.json({ error: 'Failed to generate offer intelligence' }, { status: 500 });
  }
}
