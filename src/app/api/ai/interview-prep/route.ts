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

const SYSTEM_EN = `You are an expert career coach specializing in technical and behavioral interview preparation.
You tailor your advice to the specific company, role, and job description provided.
Respond ONLY with a valid JSON object — no markdown, no backticks, no commentary.

## Output Format

The JSON must match this shape exactly:
{
  "tldr": "1 sentence — the single most important thing the candidate should focus on for this specific interview",
  "company_context": "1-2 sentences about the company's culture, values, or what they look for in candidates. If you don't have strong knowledge of this company, say so honestly and give general industry context instead.",
  "questions": [
    { "q": "the interview question", "type": "behavioral" | "technical", "why": "1 line — why this matters for this role" }
  ],
  "action_items": ["actionable tip 1", "actionable tip 2", "actionable tip 3"],
  "confidence": "high" | "medium" | "low"
}

## Rules

1. Keep ALL text SHORT and SCANNABLE. No long paragraphs. Bullet-point thinking.
2. "questions" should have exactly 3 items — pick the 3 HIGHEST-IMPACT questions for this exact role+stage combination. Mix behavioral and technical.
3. "action_items" should be 3 concrete, specific things to DO before the interview (not generic advice like "research the company").
4. "confidence" reflects how well you know this specific company:
   - "high" = well-known company, you have strong knowledge of their interview process
   - "medium" = you know the company but not their specific interview style
   - "low" = niche/small company, you're mostly reasoning from the role and job description
5. When confidence is "low", lean HEAVILY on the job description (if provided) and the role requirements rather than guessing about the company.
6. When a job description is provided, base your questions and tips directly on the skills, technologies, and qualifications mentioned in it.
7. Make each "why" specific — not "this is commonly asked" but "they use React + GraphQL, and this tests your ability to reason about their stack".`;

const SYSTEM_JA = `あなたは日本の就職活動に精通した一流のキャリアコーチです。就活生に対して、企業・職種別の具体的で実践的な面接対策情報を提供してください。一般的なアドバイスは厳禁です。必ず指定された企業と職種に特化した情報のみを提供してください。日本企業の面接文化、ESの傾向、グループディスカッション形式についての深い知識を活かしてください。
マークダウン、バッククォートなし。JSONのみで回答してください。

出力フォーマット（必ずこの形式で）:
{
  "tldr": "この面接で最も重要な1点（1文）",
  "company_context": "この企業がこの職種の候補者に求める資質（2〜3文、具体的に）",
  "questions": [
    { "q": "よく聞かれる質問", "type": "behavioral" | "technical", "why": "なぜこれが重要か（1行）" }
  ],
  "action_items": ["面接前にやること1", "面接前にやること2", "面接前にやること3"],
  "confidence": "high" | "medium" | "low"
}`;

// Lightweight JD scraper — extracts the most useful text from a job posting URL
async function scrapeJobDescription(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return '';
    const html = await res.text();

    // Try JSON-LD first (most structured)
    const ldMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
    if (ldMatch) {
      for (const block of ldMatch) {
        try {
          const jsonStr = block.replace(/<\/?script[^>]*>/gi, '');
          const parsed = JSON.parse(jsonStr);
          const entries = Array.isArray(parsed) ? parsed : [parsed];
          for (const entry of entries) {
            if (entry['@type'] === 'JobPosting' || entry['@type'] === 'Job') {
              const desc = entry.description || '';
              // Strip HTML tags from description
              const clean = desc.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
              if (clean.length > 50) return clean.slice(0, 2000);
            }
          }
        } catch { /* continue */ }
      }
    }

    // Fallback: meta description + stripped body text
    const metaMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/i);
    const metaDesc = metaMatch ? metaMatch[1] : '';

    // Strip all tags, scripts, styles from body
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    const bodyHtml = bodyMatch ? bodyMatch[1] : '';
    const bodyText = bodyHtml
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const combined = [metaDesc, bodyText.slice(0, 1800)].filter(Boolean).join('\n\n');
    return combined.slice(0, 2000);
  } catch {
    return '';
  }
}

export async function POST(request: Request) {
  try {
    const { userId, applicationId, company, role, stage, notes, job_link } = await request.json();
    if (!userId || !applicationId) {
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

    // Check for cached result
    const { data: app } = await supabase
      .from('applications')
      .select('ai_interview_prep, job_link')
      .eq('id', applicationId)
      .single();

    if (app?.ai_interview_prep) {
      return NextResponse.json({ result: app.ai_interview_prep, cached: true });
    }

    const { allowed, used, limit } = await checkRateLimit(userId, 'interview-prep', userIsPro);
    if (!allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded', used, limit }, { status: 429 });
    }

    // Scrape job description if we have a link
    const linkToScrape = job_link || app?.job_link || '';
    let jobDescription = '';
    if (linkToScrape) {
      jobDescription = await scrapeJobDescription(linkToScrape);
    }

    const prompt = isJa
      ? `就活生が${company}の${role}の面接を控えています。以下のJSONフォーマットのみで回答してください（マークダウン、バッククォート不要）:
現在のステージ: ${stage}
${notes ? `メモ: ${notes}` : ''}
${jobDescription ? `\n求人情報:\n${jobDescription}` : '（求人情報なし — 企業・職種への知識と正直な確信度で回答してください）'}
`
      : `Prepare me for an interview at ${company} for the role of ${role}.
Current stage: ${stage}
${notes ? `My notes: ${notes}` : ''}
${jobDescription ? `\nJob Description:\n${jobDescription}` : '(No job description available — rely on your knowledge of the role and company, and be transparent about your confidence level.)'}
Give me a focused, high-impact interview prep plan. Quality over quantity.`;

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
