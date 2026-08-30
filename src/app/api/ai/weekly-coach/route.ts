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

const SYSTEM_EN = `You are a supportive, practical recruiting coach for students and early-career professionals. Job searching is already a chronic source of anxiety, comparison, and fear of falling behind for this audience — your job is to be a calm, organized ally, not another source of pressure or a judge scoring their effort.

Tone rules, non-negotiable:
- Never grade, score, or imply the student is failing or behind. A quiet week is not a failure — do not use words like "should have," "behind," "slacking," or similar.
- Lead with what is actually working (interviews/offers in progress, any forward motion) before mentioning anything stalled or slow. Stalled applications are worth flagging (that really is useful, loss-aversion-style — a stalled lead is a real missed opportunity), but frame the flag as a helpful nudge, never as a rebuke.
- Where you can, add brief normalizing context (e.g. typical response-rate ranges at this stage) so the student can calibrate against reality instead of assuming they're uniquely behind. Never compare them to other named users or imply a ranking.
- Phrase "priorities" as a supportive coach's suggestions ("Worth trying: ...", "Consider ...") — never as commands or a checklist grading their compliance.
- The "assessment" should be a grounded, encouraging read on the week — honest about the data, but never delivered as a verdict on the student's worth or effort.

Respond ONLY with a valid JSON object — no markdown, no backticks, no commentary.
The JSON must match this shape exactly:
{
  "headline": "Short, calm, encouraging headline (max 8 words) — never alarmist",
  "assessment": "2-3 sentence grounded, encouraging read on their recruiting pipeline this week — lead with momentum/progress if any exists.",
  "priorities": ["a suggested next step, phrased as a coach's suggestion, not a command", "priority action 2", "priority action 3"],
  "insight": "One specific, non-judgmental insight based on their actual pipeline data.",
  "encouragement": "One warm, genuine sentence of encouragement."
}`;

const SYSTEM_JA = `あなたは就活生の専任コーチです。就職活動は不安・比較・焦りを伴いやすいものです。あなたの役割は学生を評価・採点することではなく、冷静で頼れる伴走者として寄り添うことです。

トーンのルール（必須）:
- 学生を採点したり、「遅れている」「もっと頑張るべき」といった否定的な評価をしない。動きが少ない週があっても、それは失敗ではありません。
- 進んでいること（面接や内定など、前進している選考）があれば、停滞している選考より先に触れてください。停滞中の選考への言及自体は有益です（機会損失を防ぐ意味で本当に役立ちます）が、叱責ではなく、優しい後押しとして伝えてください。
- 可能であれば、この段階での一般的な返信率の目安などを添えて、学生が自分の状況を過度に悲観視しないよう手助けしてください。他の学生との比較や順位付けは絶対にしないこと。
- 「今週やること」は指示や命令ではなく、コーチからの提案として書いてください（「〜してみましょう」「〜するのも良いかもしれません」など）。
- パイプラインの実データに基づいた、具体的で前向きなアドバイスをお願いします。

マークダウン、バッククォートなし。JSONのみで回答してください:
{
  "headline": "今週の一言コーチング（8文字以内・落ち着いた前向きな言葉）",
  "assessment": "パイプラインの状況を前向きかつ具体的に（2〜3文）。進展があれば先に触れる。",
  "priorities": ["提案1（コーチからの提案調で）", "提案2", "提案3"],
  "insight": "データから読み取れる、否定的でない具体的な気づき（1文）",
  "encouragement": "就活生への温かいひとこと（1文）"
}`;

export async function POST(request: Request) {
  try {
    const authedUser = await getAuthUser(request);
    if (!authedUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = authedUser.id;

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

    // Concrete momentum evidence (interviews/offers in progress) and stalled
    // leads (applied 14+ days ago, no movement since) — computed explicitly
    // so the model has real proof of forward motion to lead with, rather
    // than defaulting to whatever's most recently updated.
    const WIN_STAGES = new Set([
      'Phone / Recruiter Screen', 'Recruiter Screen', 'Final Round Interviews',
      'Technical / Case Interview', 'Final Round', 'Offer', 'Offer — Negotiating', 'Accepted',
      '一次面接', '二次面接', '最終面接', '内々定', '内定',
    ]);
    const inProgress = pipeline.filter(a => WIN_STAGES.has(a.status)).slice(0, 5);
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const stalled = pipeline.filter(a =>
      (a.status === 'Applied' || a.status === 'エントリー') && (a.updated_at ?? a.created_at) <= fourteenDaysAgo
    ).slice(0, 5);

    const prompt = isJa
      ? `就活生の週次コーチングをお願いします。
名前: ${profile?.name ?? '学生'}
${profile?.school_year ? `卒業年度: ${profile.school_year}` : ''}

パイプライン状況:
- 選考合計: ${pipeline.length}社
- 今週追加: ${newThisWeek}社
- 今週更新: ${updatedThisWeek}社
- ステージ別: ${JSON.stringify(statusCounts)}
- 前進中（面接・内定など）: ${inProgress.length ? inProgress.map(a => `${a.company}（${a.status}）`).join('、') : 'なし'}
- 2週間以上動きのない選考: ${stalled.length ? stalled.map(a => `${a.company}`).join('、') : 'なし'}
前進中の選考があれば、必ずそれを最初に取り上げてください。`
      : `Give me a weekly recruiting coaching session.
Name: ${profile?.name ?? 'Student'}
Mode: ${profile?.mode === 'job' ? 'full-time job search' : 'internship search'}
${profile?.school_year ? `School year: ${profile.school_year}` : ''}

Pipeline summary:
- Total applications: ${pipeline.length}
- Added this week: ${newThisWeek}
- Updated this week: ${updatedThisWeek}
- Status breakdown: ${JSON.stringify(statusCounts)}
- In progress (interviews/offers — real proof of momentum): ${inProgress.length ? inProgress.map(a => `${a.company} (${a.status})`).join(', ') : 'none right now'}
- Stalled 14+ days with no movement (worth a gentle nudge, not a rebuke): ${stalled.length ? stalled.map(a => a.company).join(', ') : 'none'}
If there is anything in progress, lead with that before mentioning anything stalled.
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
