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

const SYSTEM = `You are an expert professional email writer for job seekers.
Respond ONLY with a valid JSON object — no markdown, no backticks, no commentary.
The JSON must match this shape exactly:
{
  "subject": "Email subject line",
  "body": "Full email body text with proper line breaks using \\n"
}`;

const EMAIL_TYPES: Record<string, string> = {
  'thank-you': 'Thank you / post-interview follow-up',
  'status-check': 'Friendly status check-in',
  'withdraw': 'Politely withdraw from the process',
  'negotiate': 'Negotiate or ask about compensation and timeline',
  'referral': 'Ask for a referral or introduction',
};

export async function POST(request: Request) {
  try {
    const { userId, company, role, recruiterName, recruiterEmail, emailType, notes, stage } = await request.json();
    if (!userId || !emailType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = getSupabase();
    const { data: profile } = await supabase
      .from('users')
      .select('pro, pro_expires_at')
      .eq('id', userId)
      .single();

    const userIsPro = isProServer(profile);
    const { allowed, used, limit } = await checkRateLimit(userId, 'follow-up-email', userIsPro);
    if (!allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded', used, limit }, { status: 429 });
    }

    const emailTypeLabel = EMAIL_TYPES[emailType] ?? emailType;
    const prompt = `Write a ${emailTypeLabel} email for a job application.
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
