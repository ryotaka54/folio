import { NextResponse } from 'next/server';
import { callClaude } from '@/lib/anthropic';
import { getAuthUser } from '@/lib/server-auth';

const SYSTEM_EN = `You are an expert at reading job offer letters and compensation summaries.
Extract compensation details and return ONLY a valid JSON object — no markdown, no backticks, no commentary.

Return this shape exactly (use null for any field not found):
{
  "salary_max": 150000,
  "signing_bonus": 20000,
  "bonus_target": 15000,
  "equity_shares": 1000,
  "equity_cliff": 12,
  "offer_deadline": "2026-06-15"
}

Rules:
- salary_max: annual base salary in USD as an integer (convert "150k" → 150000). If a range is given, use the higher number.
- signing_bonus: one-time signing bonus in USD as an integer.
- bonus_target: annual target/performance bonus in USD as an integer. If given as %, multiply by salary_max (e.g. 10% of $150k → 15000).
- equity_shares: total RSU/stock option count as an integer. Do not convert to dollar value.
- equity_cliff: cliff vesting period in months as an integer (e.g. "1 year cliff" → 12).
- offer_deadline: decision deadline date in YYYY-MM-DD format. If only a month is given, use the last day of that month.
- If a value is ambiguous or truly not present, use null.`;

// Japanese: NaiteiManager uses free-text fields, so extract to strings/dates
const SYSTEM_JA = `あなたは日本企業の内定通知書・雇用条件通知書を読み解く専門家です。
マークダウン・バッククォートなし。JSONのみで回答してください。

以下の形式で返してください（不明な項目はnullにしてください）：
{
  "compensation": "年収450万円（月給30万円）、賞与2回計3ヶ月分、固定残業代含む",
  "conditions": "大学卒業を条件とする。健康診断の結果が良好であること",
  "department": "デジタルソリューション事業部 開発チーム",
  "offerDate": "2026-06-01",
  "acceptanceDeadline": "2026-06-20"
}

ルール：
- compensation: 年収・月給・賞与・固定残業代・手当などを自然な日本語で簡潔にまとめてください（1〜2文）。金額は書かれた通りに転記。
- conditions: 内定条件（卒業条件・健康診断など）。なければnull。
- department: 配属予定部署・チーム名。なければnull。
- offerDate: 内定日をYYYY-MM-DD形式で。なければnull。
- acceptanceDeadline: 承諾期限・内定承諾期日をYYYY-MM-DD形式で。「〇月末日」の場合はその月の末日を設定してください。なければnull。
- 情報が不明・記載なしの場合は必ずnullにしてください。`;

export async function POST(request: Request) {
  try {
    const authedUser = await getAuthUser(request);
    if (!authedUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { text, lang } = await request.json();
    if (!text?.trim()) return NextResponse.json({ error: 'No text provided' }, { status: 400 });

    const isJa = lang === 'ja';
    const system = isJa ? SYSTEM_JA : SYSTEM_EN;
    const prompt = isJa
      ? `以下の内定通知書・条件通知書から情報を抽出してください：\n\n${text.slice(0, 4000)}`
      : `Extract compensation details from this offer letter or compensation summary:\n\n${text.slice(0, 4000)}`;

    const raw = await callClaude(prompt, system);

    const json = raw.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '');
    const data = JSON.parse(json);

    return NextResponse.json({ data });
  } catch (e) {
    console.error('parse-offer error:', e);
    return NextResponse.json({ error: 'Failed to parse offer' }, { status: 500 });
  }
}
