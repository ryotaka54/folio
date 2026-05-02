import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/server-auth';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authedUser = await getAuthUser(request);
    if (!authedUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const supabase = getSupabase();
    const [{ data: contact }, { data: links }] = await Promise.all([
      supabase.from('contacts').select('*').eq('id', id).eq('user_id', authedUser.id).single(),
      supabase.from('contact_applications').select('application_id').eq('contact_id', id),
    ]);

    if (!contact) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ contact: { ...contact, application_ids: (links ?? []).map(r => r.application_id) } });
  } catch (err) {
    console.error('[contacts/[id] GET]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authedUser = await getAuthUser(request);
    if (!authedUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const allowed = ['name','company','role','linkedin_url','email','phone','relationship_type','notes','last_contact_date'];
    const update: Record<string, unknown> = {};
    for (const k of allowed) if (k in body) update[k] = body[k];

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('contacts')
      .update(update)
      .eq('id', id)
      .eq('user_id', authedUser.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ contact: data });
  } catch (err) {
    console.error('[contacts/[id] PATCH]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authedUser = await getAuthUser(request);
    if (!authedUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const supabase = getSupabase();
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id)
      .eq('user_id', authedUser.id);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[contacts/[id] DELETE]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
