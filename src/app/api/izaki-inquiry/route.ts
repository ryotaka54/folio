import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Run this once in your Supabase SQL editor to create the table:
//
// CREATE TABLE IF NOT EXISTS izaki_inquiries (
//   id          BIGSERIAL PRIMARY KEY,
//   company     TEXT        NOT NULL,
//   name        TEXT        NOT NULL,
//   email       TEXT        NOT NULL,
//   phone       TEXT        NOT NULL DEFAULT '',
//   message     TEXT        NOT NULL,
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

  const company = typeof body.company === 'string' ? body.company.trim() : ''
  const name    = typeof body.name    === 'string' ? body.name.trim()    : ''
  const email   = typeof body.email   === 'string' ? body.email.trim()   : ''
  const phone   = typeof body.phone   === 'string' ? body.phone.trim()   : ''
  const message = typeof body.message === 'string' ? body.message.trim() : ''

  if (!company)             return NextResponse.json({ error: 'Company is required.'    }, { status: 400 })
  if (!name)                return NextResponse.json({ error: 'Name is required.'       }, { status: 400 })
  if (!email)                return NextResponse.json({ error: 'Email is required.'      }, { status: 400 })
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 })
  if (!message)              return NextResponse.json({ error: 'Message is required.'    }, { status: 400 })

  const { error } = await getSupabase()
    .from('izaki_inquiries')
    .insert({ company, name, email, phone, message })

  if (error) {
    console.error('[izaki-inquiry] insert failed:', error.message)
    return NextResponse.json(
      { error: 'Failed to save inquiry. Please try again.' },
      { status: 500 },
    )
  }

  return NextResponse.json({ ok: true })
}
