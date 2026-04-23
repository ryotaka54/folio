import { createClient } from '@supabase/supabase-js';

export async function getAuthUser(request: Request): Promise<{ id: string; email?: string } | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const { data: { user } } = await client.auth.getUser(token);
  return user ?? null;
}
