import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Run this once in your Supabase SQL editor to create the table:
//
// CREATE TABLE IF NOT EXISTS oak_reservations (
//   id          BIGSERIAL PRIMARY KEY,
//   name        TEXT        NOT NULL,
//   email       TEXT        NOT NULL,
//   date        DATE        NOT NULL,
//   party_size  TEXT        NOT NULL DEFAULT '2',
//   message     TEXT        NOT NULL DEFAULT '',
//   created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
// );

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const name      = typeof body.name      === 'string' ? body.name.trim()      : ''
  const email     = typeof body.email     === 'string' ? body.email.trim()     : ''
  const date      = typeof body.date      === 'string' ? body.date.trim()      : ''
  const partySize = typeof body.partySize === 'string' ? body.partySize.trim() : '2'
  const message   = typeof body.message   === 'string' ? body.message.trim()   : ''

  if (!name)               return NextResponse.json({ error: 'Name is required.'          }, { status: 400 })
  if (!email)              return NextResponse.json({ error: 'Email is required.'         }, { status: 400 })
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: 'Invalid email address.'  }, { status: 400 })
  if (!date)               return NextResponse.json({ error: 'Date is required.'          }, { status: 400 })

  const { error } = await getSupabase()
    .from('oak_reservations')
    .insert({ name, email, date, party_size: partySize, message })

  if (error) {
    console.error('[1oak-reservation] insert failed:', error.message)
    return NextResponse.json(
      { error: 'Failed to save reservation. Please try again.' },
      { status: 500 },
    )
  }

  return NextResponse.json({ ok: true })
}
