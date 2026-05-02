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

const SYSTEM_EN = `You are an expert professional email writer for job seekers.
Respond ONLY with a valid JSON object — no markdown, no backticks, no commentary.
The JSON must match this shape exactly:
{
  "subject": "Email subject line",
  "body": "Full email body text with proper line breaks using \\n"
}`;

const SYSTEM_JA = `あなたは就活に詳しい先輩として、就活生のフォローアップメールを代わりに書くお手伝いをしています。メールは丁寧でありながら自然な日本語で、テンプレート的な印象を与えない文章にしてください。です・ます調を使用し、過度に堅苦しくならないよう注意してください。
マークダウン、バッククォートなし。必ずJSONのみで回答してください:
{
  "subject": "件名",
  "body": "メール本文（改行は\\nで表現）"
}`;

const EMAIL_TYPES_EN: Record<string, string> = {
  'thank-you': 'Thank you / post-interview follow-up',
  'status-check': 'Friendly status check-in',
  'withdraw': 'Politely withdraw from the process',
  'negotiate': 'Negotiate or ask about compensation and timeline',
  'referral': 'Ask for a referral or introduction',
};

const EMAIL_TYPES_JA: Record<string, string> = {
  'thank-you': '面接後のお礼メール',
  'status-check': '選考状況確認メール',
  'withdraw': '選考辞退メール',
  'negotiate': '内定条件・入社日の確認メール',
  'referral': '社員紹介・OB訪問依頼メール',
};

export async function POST(request: Request) {
  try {
    const authedUser = await getAuthUser(request);
    if (!authedUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = authedUser.id;

    const { company, role, recruiterName, recruiterEmail, emailType, notes, stage } = await request.json();
    if (!emailType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = getSupabase();
    const { data: profile } = await supabase
      .from('users')
      .select('pro, pro_expires_at, language_preference')
      .eq('id', userId)
      .single();

    const userIsPro = isProServer(profile);
    const isJa = profile?.language_preference === 'ja';
    const SYSTEM = isJa ? SYSTEM_JA : SYSTEM_EN;
    const EMAIL_TYPES = isJa ? EMAIL_TYPES_JA : EMAIL_TYPES_EN;

    const { allowed, used, limit } = await checkRateLimit(userId, 'follow-up-email', userIsPro);
    if (!allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded', used, limit }, { status: 429 });
    }

    const emailTypeLabel = EMAIL_TYPES[emailType] ?? emailType;
    const prompt = isJa
      ? `就活生が${company}（${role}）への${emailTypeLabel}を書きたいと思っています。
${recruiterName ? `採用担当者名: ${recruiterName}` : '採用担当者名: 不明（一般的な宛名を使用してください）'}
現在のステージ: ${stage}
${notes ? `状況・メモ: ${notes}` : ''}

自然で丁寧な日本語で、200字程度のメールを書いてください。`
      : `Write a ${emailTypeLabel} email for a job application.
Company: ${company}
Role: ${role}
${recruiterName ? `Recruiter name: ${recruiterName}` : 'Recruiter name: unknown (use a generic greeting)'}
${recruiterEmail ? `Recruiter email: ${recruiterEmail}` : ''}
Current stage: ${stage}
${notes ? `Context/notes: ${notes}` : ''}

Write a concise, professional, and human-sounding email. Keep it under 150 words.`;

    const raw = await callClaude(prompt, SYSTEM);
    const result = JSON.parse(raw);

    await recordUsage(userId, 'follow-up-email');
    await recordEvent(userId, 'follow-up-email', { company, role, emailType });

    return NextResponse.json({ result });
  } catch (err) {
    console.error('follow-up-email error:', err);
    return NextResponse.json({ error: 'Failed to generate email' }, { status: 500 });
  }
}
