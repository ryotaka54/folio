import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

export const AI_MODEL = 'claude-sonnet-4-5';
export const AI_MAX_TOKENS = 2048;

export function isProServer(user: { pro?: boolean; pro_expires_at?: string | null } | null): boolean {
  if (!user?.pro) return false;
  if (!user.pro_expires_at) return true;
  return new Date(user.pro_expires_at) > new Date();
}

const PRO_DAILY_LIMIT = 20;
const FREE_DAILY_LIMIT = 3;

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function checkRateLimit(
  userId: string,
  feature: string,
  isPro: boolean,
): Promise<{ allowed: boolean; used: number; limit: number }> {
  const supabase = getSupabase();
  const limit = isPro ? PRO_DAILY_LIMIT : FREE_DAILY_LIMIT;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { count } = await supabase
    .from('ai_usage')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('feature', feature)
    .gte('created_at', startOfDay.toISOString());

  const used = count ?? 0;
  return { allowed: used < limit, used, limit };
}

export async function recordUsage(userId: string, feature: string) {
  const supabase = getSupabase();
  await supabase.from('ai_usage').insert({ user_id: userId, feature });
}

export async function recordEvent(
  userId: string,
  feature: string,
  metadata?: Record<string, unknown>,
) {
  const supabase = getSupabase();
  await supabase.from('ai_events').insert({ user_id: userId, feature, metadata });
}

export async function callClaude(prompt: string, systemPrompt: string): Promise<string> {
  const client = getClient();
  const message = await client.messages.create({
    model: AI_MODEL,
    max_tokens: AI_MAX_TOKENS,
    system: systemPrompt,
    messages: [{ role: 'user', content: prompt }],
  });
  const block = message.content[0];
  if (block.type !== 'text') throw new Error('Unexpected response type');
  // Strip markdown code fences if Claude wraps the JSON
  return block.text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
}
