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
    const [{ data: contacts }, { data: links }] = await Promise.all([
      supabase.from('contacts').select('*').eq('user_id', authedUser.id).order('name'),
      supabase.from('contact_applications').select('contact_id, application_id'),
    ]);

    const appIds: Record<string, string[]> = {};
    for (const row of links ?? []) {
      (appIds[row.contact_id] ??= []).push(row.application_id);
    }

    const result = (contacts ?? []).map(c => ({ ...c, application_ids: appIds[c.id] ?? [] }));
    return NextResponse.json({ contacts: result });
  } catch (err) {
    console.error('[contacts GET]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authedUser = await getAuthUser(request);
    if (!authedUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { name, company = '', role = '', linkedin_url = '', email = '', phone = '',
      relationship_type = 'recruiter', notes = '', last_contact_date = null } = body;

    if (!name?.trim()) return NextResponse.json({ error: 'name required' }, { status: 400 });

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('contacts')
      .insert({
        user_id: authedUser.id, name: name.trim(), company, role,
        linkedin_url, email, phone, relationship_type, notes, last_contact_date,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ contact: { ...data, application_ids: [] } }, { status: 201 });
  } catch (err) {
    console.error('[contacts POST]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
