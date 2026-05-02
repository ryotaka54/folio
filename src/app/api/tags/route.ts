import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/server-auth';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function GET(request: Request) {
  try {
    const authedUser = await getAuthUser(request);
    if (!authedUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .eq('user_id', authedUser.id)
      .order('name');

    if (error) throw error;
    return NextResponse.json({ tags: data ?? [] });
  } catch (err) {
    console.error('[tags GET]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authedUser = await getAuthUser(request);
    if (!authedUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { name, color } = await request.json();
    if (!name?.trim()) return NextResponse.json({ error: 'name required' }, { status: 400 });

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('tags')
      .insert({ user_id: authedUser.id, name: name.trim(), color: color ?? '#6366F1' })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') return NextResponse.json({ error: 'Tag already exists' }, { status: 409 });
      throw error;
    }
    return NextResponse.json({ tag: data }, { status: 201 });
  } catch (err) {
    console.error('[tags POST]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
