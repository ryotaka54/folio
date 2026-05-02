import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/server-auth';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

async function verifyOwnership(supabase: ReturnType<typeof getSupabase>, contactId: string, userId: string) {
  const { data } = await supabase.from('contacts').select('id').eq('id', contactId).eq('user_id', userId).single();
  return !!data;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authedUser = await getAuthUser(request);
    if (!authedUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: contactId } = await params;
    const { application_id } = await request.json();
    if (!application_id) return NextResponse.json({ error: 'application_id required' }, { status: 400 });

    const supabase = getSupabase();
    if (!await verifyOwnership(supabase, contactId, authedUser.id)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const { error } = await supabase
      .from('contact_applications')
      .insert({ contact_id: contactId, application_id });

    if (error && error.code !== '23505') throw error;
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error('[contacts/[id]/applications POST]', err);
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

    const { id: contactId } = await params;
    const { application_id } = await request.json();

    const supabase = getSupabase();
    if (!await verifyOwnership(supabase, contactId, authedUser.id)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const { error } = await supabase
      .from('contact_applications')
      .delete()
      .eq('contact_id', contactId)
      .eq('application_id', application_id);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[contacts/[id]/applications DELETE]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
