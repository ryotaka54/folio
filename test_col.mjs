import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://rshxishjzieaefohqkdb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzaHhpc2hqemllYWVmb2hxa2RiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0MTAzMjksImV4cCI6MjA4OTk4NjMyOX0.Fln4675YKZV2FA3oBwvNF_PPHgKBFvd1r1DBeU9tV14'
)

async function test() {
  const { error: err2 } = await supabase.from('users').update({ 
    school_year: 'test',
    career_level: 'test',
    recruiting_season: 'test',
    onboarding_complete: true
  }).eq('id', 'some-id')
  
  console.log('Update Error:', err2)
}
test()
