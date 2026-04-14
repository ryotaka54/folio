// seed_applications.mjs
// Run with: node seed_applications.mjs
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rshxishjzieaefohqkdb.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzaHhpc2hqemllYWVmb2hxa2RiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQxMDMyOSwiZXhwIjoyMDg5OTg2MzI5fQ.8SP9ox0DJg6E-hyLWuCCMfTj4cEl5yYCaRQgqNM83vI';
const TARGET_EMAIL = 'useapplyd@gmail.com';

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// ── Realistic data pools ───────────────────────────────────────────────────
const COMPANIES = [
  'Stripe', 'Airbnb', 'Figma', 'Notion', 'OpenAI', 'Anthropic', 'Databricks',
  'Snowflake', 'Palantir', 'Ramp', 'Brex', 'Rippling', 'Scale AI', 'Cohere',
  'Mistral', 'Perplexity', 'Anduril', 'SpaceX', 'Apple', 'Google', 'Meta',
  'Amazon', 'Microsoft', 'Netflix', 'Uber', 'DoorDash', 'Instacart', 'Lyft',
  'Coinbase', 'Robinhood', 'Plaid', 'Chime', 'Affirm', 'Klarna', 'Block',
  'Twitter/X', 'LinkedIn', 'Salesforce', 'Oracle', 'SAP', 'ServiceNow',
  'Twilio', 'Cloudflare', 'Datadog', 'HashiCorp', 'Grafana', 'Vercel',
  'PlanetScale', 'Supabase', 'Linear', 'Retool', 'Airtable', 'Zapier',
  'HubSpot', 'Intercom', 'Zendesk', 'Slack', 'Atlassian', 'Asana', 'Monday',
  'J.P. Morgan', 'Goldman Sachs', 'Two Sigma', 'Citadel', 'Jane Street',
  'D.E. Shaw', 'Point72', 'Bridgewater', 'BlackRock', 'Vanguard',
  'McKinsey', 'Bain', 'BCG', 'Deloitte', 'Accenture',
  'Lockheed Martin', 'Raytheon', 'Boeing', 'Northrop Grumman',
  'Waymo', 'Zoox', 'Aurora', 'Mobileye', 'Argo AI',
  'Reddit', 'Pinterest', 'Snap', 'TikTok', 'ByteDance',
  'Shopify', 'Squarespace', 'Wix', 'Webflow', 'Framer',
];

const ENGINEERING_ROLES = [
  'Software Engineer Intern', 'SDE Intern', 'Backend Engineer Intern',
  'Frontend Engineer Intern', 'Full Stack Engineer Intern',
  'ML Engineer Intern', 'Data Engineer Intern', 'Platform Engineer Intern',
  'Infrastructure Engineer Intern', 'Security Engineer Intern',
];

const PM_ROLES = [
  'Product Manager Intern', 'Associate PM Intern', 'Technical PM Intern',
  'Growth PM Intern',
];

const DATA_ROLES = [
  'Data Scientist Intern', 'Data Analyst Intern', 'ML Research Intern',
  'Research Scientist Intern', 'Quantitative Analyst Intern',
];

const DESIGN_ROLES = [
  'Product Design Intern', 'UX Design Intern', 'UI Designer Intern',
];

const FINANCE_ROLES = [
  'Investment Banking Analyst', 'Quantitative Trading Intern',
  'Software Engineer (Quant)', 'Financial Analyst Intern',
];

const CONSULTING_ROLES = [
  'Business Analyst Intern', 'Strategy Intern', 'Management Consulting Intern',
];

const ALL_ROLES = [
  ...ENGINEERING_ROLES, ...ENGINEERING_ROLES, ...ENGINEERING_ROLES, // weight toward engineering
  ...PM_ROLES,
  ...DATA_ROLES, ...DATA_ROLES,
  ...DESIGN_ROLES,
  ...FINANCE_ROLES,
  ...CONSULTING_ROLES,
];

const CATEGORIES = ['Engineering', 'Engineering', 'Engineering', 'Product Management', 'Data / Analytics', 'Design', 'Finance', 'Consulting'];

const LOCATIONS = [
  'San Francisco, CA', 'New York, NY', 'Seattle, WA', 'Austin, TX',
  'Boston, MA', 'Chicago, IL', 'Remote', 'Menlo Park, CA', 'Mountain View, CA',
  'Los Angeles, CA', 'Denver, CO', 'Atlanta, GA', 'Washington, DC',
];

const STATUSES = [
  'Wishlist', 'Wishlist',
  'Applied', 'Applied', 'Applied', 'Applied', 'Applied', 'Applied',
  'OA / Online Assessment', 'OA / Online Assessment',
  'Phone / Recruiter Screen', 'Phone / Recruiter Screen',
  'Final Round Interviews',
  'Offer — Negotiating',
  'Offer',
  'Rejected', 'Rejected',
  'Declined',
];

const NOTES_POOL = [
  'Referral from a friend at the company',
  'Applied through Handshake',
  'Found on LinkedIn — seemed like a great fit',
  'Cold applied through company website',
  'Recruiter reached out on LinkedIn first',
  '',
  '',
  '',
  'Really want this one — dream company',
  'Applied as a backup option',
  'Great team, strong culture',
  'High TC but intense interview process',
  'Alumni connection at this company',
  'Heard great things about their eng culture',
];

// ── Helpers ────────────────────────────────────────────────────────────────
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function randomDate(daysAgoMax = 90) {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysAgoMax));
  d.setHours(Math.floor(Math.random() * 14) + 8, Math.floor(Math.random() * 60));
  return d.toISOString();
}

function maybeDeadline(status) {
  if (['Wishlist', 'Applied'].includes(status) && Math.random() > 0.6) {
    const d = new Date();
    d.setDate(d.getDate() + Math.floor(Math.random() * 30) - 5);
    return d.toISOString().split('T')[0];
  }
  return null;
}

function buildApp(userId, usedCompanies) {
  // Avoid exact duplicate company+role combos
  let company, role;
  let attempts = 0;
  do {
    company = pick(COMPANIES);
    role = pick(ALL_ROLES);
    attempts++;
  } while (usedCompanies.has(`${company}::${role}`) && attempts < 20);
  usedCompanies.add(`${company}::${role}`);

  const status = pick(STATUSES);
  const createdAt = randomDate(75);

  return {
    user_id: userId,
    company,
    role,
    location: pick(LOCATIONS),
    category: pick(CATEGORIES),
    status,
    deadline: maybeDeadline(status),
    job_link: '',
    notes: pick(NOTES_POOL),
    recruiter_name: '',
    recruiter_email: '',
    created_at: createdAt,
    updated_at: createdAt,
  };
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  // 1. Look up the user by email
  const { data: { users }, error: listErr } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (listErr) { console.error('Could not list users:', listErr.message); process.exit(1); }

  const target = users.find(u => u.email === TARGET_EMAIL);
  if (!target) { console.error(`No user found with email ${TARGET_EMAIL}`); process.exit(1); }

  console.log(`Found user: ${target.id} (${target.email})`);

  // 2. Check how many apps they already have
  const { count: existing } = await admin
    .from('applications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', target.id);

  console.log(`Existing applications: ${existing}`);

  const toInsert = 200;
  console.log(`Inserting ${toInsert} applications...`);

  // 3. Build and insert in batches of 50
  const usedCompanies = new Set();
  const apps = Array.from({ length: toInsert }, () => buildApp(target.id, usedCompanies));

  const BATCH = 50;
  for (let i = 0; i < apps.length; i += BATCH) {
    const batch = apps.slice(i, i + BATCH);
    const { error } = await admin.from('applications').insert(batch);
    if (error) {
      console.error(`Batch ${i / BATCH + 1} failed:`, error.message);
    } else {
      console.log(`✓ Batch ${i / BATCH + 1}/${Math.ceil(apps.length / BATCH)} inserted`);
    }
  }

  console.log(`\nDone! ${toInsert} applications added to ${TARGET_EMAIL}`);
}

main().catch(err => { console.error(err); process.exit(1); });
