import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

// Cheaper model for anonymous preview evaluations to control cost
const PREVIEW_MODEL = 'claude-haiku-4-5-20251001';

const PREVIEW_EVAL_SYSTEM = `You are a hiring manager evaluating an interview answer. Give honest, calibrated feedback.

Respond ONLY with valid JSON — no markdown, no backticks:
{
  "score": <1-5 integer>,
  "star": {
    "situation": { "rating": "strong" | "okay" | "missing", "note": "one specific line" },
    "task":      { "rating": "strong" | "okay" | "missing", "note": "one specific line" },
    "action":    { "rating": "strong" | "okay" | "missing", "note": "one specific line" },
    "result":    { "rating": "strong" | "okay" | "missing", "note": "one specific line" }
  },
  "strengths": ["specific strength"],
  "improvements": ["specific, actionable improvement"],
  "overall": "2 sentences of direct feedback."
}

Scoring: 5=hire signal, 4=strong, 3=adequate, 2=weak, 1=poor. Be honest — most first drafts are 2-3.`;

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

function hashIp(ip: string): string {
  // Simple deterministic hash — not cryptographic, just enough to rate-limit
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    hash = ((hash << 5) - hash + ip.charCodeAt(i)) | 0;
  }
  return String(Math.abs(hash));
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    const ipHash = hashIp(ip);

    const supabase = getSupabase();

    // Rate limit: 3 previews per IP per 24 hours
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from('leaderboard_previews')
      .select('*', { count: 'exact', head: true })
      .eq('ip_hash', ipHash)
      .gte('created_at', since);

    if ((count ?? 0) >= 3) {
      return NextResponse.json(
        { error: 'Preview limit reached. Sign up free to get unlimited evaluations.' },
        { status: 429 },
      );
    }

    const { company, company_slug, role, question, question_type, answer } = await request.json();
    if (!company || !question || !answer?.trim()) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
    const prompt = `Company: ${company}
Role: ${role ?? 'unspecified'}
Question type: ${question_type ?? 'behavioral'}
Question: ${question}

Candidate's answer:
"${answer.trim()}"

Evaluate this answer.`;

    const message = await client.messages.create({
      model: PREVIEW_MODEL,
      max_tokens: 1024,
      system: PREVIEW_EVAL_SYSTEM,
      messages: [{ role: 'user', content: prompt }],
    });

    const block = message.content[0];
    if (block.type !== 'text') throw new Error('Unexpected response type');
    const raw = block.text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
    const feedback = JSON.parse(raw);

    // Log this preview for rate limiting
    await supabase.from('leaderboard_previews').insert({ ip_hash: ipHash, company_slug: company_slug ?? 'unknown' });

    return NextResponse.json({ feedback });
  } catch (err) {
    console.error('[leaderboard/preview POST]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
