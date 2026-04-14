// run_migrations.mjs
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const SUPABASE_URL = 'https://rshxishjzieaefohqkdb.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzaHhpc2hqemllYWVmb2hxa2RiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQxMDMyOSwiZXhwIjoyMDg5OTg2MzI5fQ.8SP9ox0DJg6E-hyLWuCCMfTj4cEl5yYCaRQgqNM83vI';

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  db: { schema: 'public' },
});

const migrations = [
  'supabase/migrations/20260412_feedback.sql',
  'supabase/migrations/20260413_community_seed.sql',
];

for (const file of migrations) {
  console.log(`\nRunning: ${file}`);
  const sql = readFileSync(file, 'utf8');
  const { error } = await admin.rpc('exec_sql', { sql }).catch(() => ({ error: null }));

  // Supabase JS client doesn't support raw SQL directly — use fetch against the REST API
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql }),
  });

  if (res.ok) {
    console.log(`✓ ${file} — done`);
  } else {
    // Try the pg endpoint instead
    const pgRes = await fetch(`${SUPABASE_URL}/pg/query`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
    });
    if (pgRes.ok) {
      console.log(`✓ ${file} — done`);
    } else {
      const body = await pgRes.text().catch(() => res.status);
      console.error(`✗ ${file} — failed: ${body}`);
    }
  }
}
