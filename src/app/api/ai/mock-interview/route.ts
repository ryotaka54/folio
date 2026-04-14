import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, recordUsage, callClaude, isProServer } from '@/lib/anthropic';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

// ── System prompts ────────────────────────────────────────────────────────────

const GENERATE_SYSTEM = `You are a senior interviewer at a top-tier company. Generate realistic interview questions tailored to the specific company, role, and job description.
Respond ONLY with a valid JSON object — no markdown, no backticks, no commentary.

Output format:
{
  "questions": [
    {
      "q": "the interview question exactly as you'd ask it",
      "type": "behavioral" | "technical",
      "why": "one sentence — what this question is testing for at this specific company/role"
    }
  ]
}

Rules:
1. Make questions feel like they actually come from THIS company's interview process.
2. For behavioral questions, use a specific scenario framing (not just "Tell me about a time...").
3. For technical questions, tie them to skills mentioned in the job description.
4. Questions should range from warm-up to challenging. Last question is always the hardest.
5. No duplicate themes across questions.`;

const EVALUATE_SYSTEM = `You are a senior interviewer giving structured feedback on a candidate's interview answer.
Respond ONLY with a valid JSON object — no markdown, no backticks, no commentary.

Output format:
{
  "score": <1-5 integer>,
  "star": {
    "situation": { "rating": "strong" | "okay" | "missing", "note": "one line of specific feedback" },
    "task": { "rating": "strong" | "okay" | "missing", "note": "one line of specific feedback" },
    "action": { "rating": "strong" | "okay" | "missing", "note": "one line of specific feedback" },
    "result": { "rating": "strong" | "okay" | "missing", "note": "one line of specific feedback" }
  },
  "strengths": ["specific strength 1", "specific strength 2"],
  "improvements": ["specific thing to improve 1", "specific thing to improve 2"],
  "overall": "2-3 sentences of honest, direct, actionable summary feedback"
}

Scoring rubric:
5 = Exceptional — specific, quantified, shows impact, flawless STAR structure
4 = Strong — good story, minor gaps (e.g. result not quantified)
3 = Adequate — answers the question but lacks specificity or depth
2 = Weak — vague, missing key STAR elements, or barely relevant
1 = Poor — doesn't answer the question, too short, or off-topic

Rules:
1. Be honest and direct. Don't inflate scores.
2. Reference the candidate's actual words in your feedback.
3. Improvements must be actionable and specific, not generic advice.
4. If the answer is very short or clearly incomplete, score it 1-2.
5. For technical questions, evaluate accuracy and depth, not just STAR structure.`;

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, userId, company, role, notes } = body;

    if (!userId || !company || !role || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Auth check
    const supabase = getSupabase();
    const { data: userRow } = await supabase.from('users').select('pro, pro_expires_at').eq('id', userId).single();
    if (!isProServer(userRow)) {
      return NextResponse.json({ error: 'Pro required' }, { status: 403 });
    }

    // Rate limit: 30 calls per window (covers a few full sessions)
    const { allowed } = await checkRateLimit(userId, 'mock_interview', true);
    if (!allowed) {
      return NextResponse.json({ error: 'Rate limit reached. Try again later.' }, { status: 429 });
    }

    // ── Generate questions ───────────────────────────────────────────────────
    if (action === 'generate') {
      const { count = 5, type = 'mixed' } = body;

      const typeGuide =
        type === 'behavioral' ? 'ALL questions must be behavioral.' :
        type === 'technical'  ? 'ALL questions must be technical, based on the job description skills.' :
        'Mix behavioral and technical questions (roughly 60% behavioral, 40% technical).';

      const prompt = `Company: ${company}
Role: ${role}
Question count: ${count}
Question type preference: ${typeGuide}
${notes ? `Job description / notes:\n${notes}` : ''}

Generate exactly ${count} interview questions.`;

      const raw = await callClaude(prompt, GENERATE_SYSTEM);
      const data = JSON.parse(raw);

      await recordUsage(userId, 'mock_interview');

      return NextResponse.json({ questions: data.questions });
    }

    // ── Evaluate answer ──────────────────────────────────────────────────────
    if (action === 'evaluate') {
      const { question, questionType, answer } = body;

      if (!question || !answer) {
        return NextResponse.json({ error: 'Missing question or answer' }, { status: 400 });
      }

      const prompt = `Company: ${company}
Role: ${role}
Question type: ${questionType || 'behavioral'}
Question: ${question}

Candidate's answer:
"${answer}"

Evaluate this answer.`;

      const raw = await callClaude(prompt, EVALUATE_SYSTEM);
      const feedback = JSON.parse(raw);

      await recordUsage(userId, 'mock_interview');

      return NextResponse.json({ feedback });
    }

    // ── Save session ─────────────────────────────────────────────────────────
    if (action === 'save_session') {
      const { applicationId, questions, transcript } = body;
      await supabase.from('mock_interview_sessions').insert({
        user_id: userId,
        application_id: applicationId || null,
        company,
        role,
        questions,
        transcript,
        completed_at: new Date().toISOString(),
      });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });

  } catch (err) {
    console.error('[mock-interview]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
