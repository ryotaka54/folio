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

const SYSTEM_EN = `You are a supportive and practical recruiting coach for students and early-career professionals.
Respond ONLY with a valid JSON object — no markdown, no backticks, no commentary.
The JSON must match this shape exactly:
{
  "headline": "Short motivating headline (max 8 words)",
  "assessment": "2-3 sentence honest assessment of their recruiting pipeline this week.",
  "priorities": ["priority action 1", "priority action 2", "priority action 3"],
  "insight": "One unique data-driven insight based on their specific pipeline.",
  "encouragement": "One warm, genuine sentence of encouragement."
}`;

const SYSTEM_JA = `あなたは就活生の専任コーチです。学生の実際のパイプラインデータを分析し、今週取るべき具体的な行動を2〜3つアドバイスしてください。一般的な励ましは不要です。データに基づいた具体的なアドバイスのみをお願いします。
マークダウン、バッククォートなし。JSONのみで回答してください:
{
  "headline": "今週の一言コーチング（8文字以内）",
  "assessment": "パイプラインの状況を正直に評価（2〜3文）",
  "priorities": ["今週やること1", "今週やること2", "今週やること3"],
  "insight": "データから読み取れる重要な気づき（1文）",
  "encouragement": "就活生への温かいひとこと（1文）"
}`;

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const supabase = getSupabase();
    const { data: profile } = await supabase
      .from('users')
      .select('pro, pro_expires_at, name, mode, school_year, language_preference')
      .eq('id', userId)
      .single();

    const userIsPro = isProServer(profile);
    const isJa = profile?.language_preference === 'ja';
    const SYSTEM = isJa ? SYSTEM_JA : SYSTEM_EN;

    const { allowed, used, limit } = await checkRateLimit(userId, 'weekly-coach', userIsPro);
    if (!allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded', used, limit }, { status: 429 });
    }

    // Pull live pipeline data
    const { data: apps } = await supabase
      .from('applications')
      .select('company, role, status, created_at, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    const pipeline = apps ?? [];
    const statusCounts = pipeline.reduce<Record<string, number>>((acc, a) => {
      acc[a.status] = (acc[a.status] ?? 0) + 1;
      return acc;
    }, {});

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const newThisWeek = pipeline.filter(a => a.created_at >= weekAgo).length;
    const updatedThisWeek = pipeline.filter(a => a.updated_at >= weekAgo && a.created_at < weekAgo).length;

    const prompt = isJa
      ? `就活生の週次コーチングをお願いします。
名前: ${profile?.name ?? '学生'}
${profile?.school_year ? `卒業年度: ${profile.school_year}` : ''}

パイプライン状況:
- 選考合計: ${pipeline.length}社
- 今週追加: ${newThisWeek}社
- 今週更新: ${updatedThisWeek}社
- ステージ別: ${JSON.stringify(statusCounts)}
- 直近5社: ${pipeline.slice(0, 5).map(a => `${a.company}（${a.status}）`).join('、')}`
      : `Give me a weekly recruiting coaching session.
Name: ${profile?.name ?? 'Student'}
Mode: ${profile?.mode === 'job' ? 'full-time job search' : 'internship search'}
${profile?.school_year ? `School year: ${profile.school_year}` : ''}

Pipeline summary:
- Total applications: ${pipeline.length}
- Added this week: ${newThisWeek}
- Updated this week: ${updatedThisWeek}
- Status breakdown: ${JSON.stringify(statusCounts)}
- Most recent 5: ${pipeline.slice(0, 5).map(a => `${a.company} (${a.status})`).join(', ')}`;

    const raw = await callClaude(prompt, SYSTEM);
    const result = JSON.parse(raw);

    await recordUsage(userId, 'weekly-coach');
    await recordEvent(userId, 'weekly-coach', { total: pipeline.length, newThisWeek });

    return NextResponse.json({ result });
  } catch (err) {
    console.error('weekly-coach error:', err);
    return NextResponse.json({ error: 'Failed to generate weekly coaching' }, { status: 500 });
  }
}
