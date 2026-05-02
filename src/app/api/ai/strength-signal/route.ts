import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, recordUsage, recordEvent, callClaude, isProServer } from '@/lib/anthropic';
import { getAuthUser } from '@/lib/server-auth';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

const SYSTEM_EN = `You are an expert hiring consultant who evaluates job application competitiveness.
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

const SYSTEM_JA = `あなたは日本の就職活動市場に精通したアナリストです。企業と職種の組み合わせの選考難易度を正確に評価してください。
マークダウン、バッククォートなし。JSONのみで回答してください:
{
  "score": 75,
  "label": "標準",
  "summary": "この応募の競争力を1文で表現してください。",
  "strengths": ["強み1", "強み2"],
  "gaps": ["課題1", "課題2"],
  "tip": "改善のためのアドバイス（1つ）"
}
scoreは0〜100の数値。labelは "非常に難関" | "難関" | "標準" | "比較的通りやすい" のいずれか。`;

export async function POST(request: Request) {
  try {
    const authedUser = await getAuthUser(request);
    if (!authedUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = authedUser.id;

    const { applicationId, company, role, category, location } = await request.json();
    if (!company || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = getSupabase();
    const { data: profile } = await supabase
      .from('users')
      .select('pro, pro_expires_at, school_year, mode, language_preference')
      .eq('id', userId)
      .single();

    const userIsPro = isProServer(profile);
    const isJa = profile?.language_preference === 'ja';
    const SYSTEM = isJa ? SYSTEM_JA : SYSTEM_EN;

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

    const prompt = isJa
      ? `以下の就活の選考難易度を評価してください:
企業: ${company}
職種: ${role}
${category ? `カテゴリ: ${category}` : ''}
${location ? `勤務地: ${location}` : ''}
${profile?.school_year ? `学年・卒業年度: ${profile.school_year}` : ''}

この応募の競争力を評価してください。`
      : `Evaluate the strength of this job application:
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
