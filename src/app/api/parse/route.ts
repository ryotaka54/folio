import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    if (!url) return NextResponse.json({ error: 'URL is required' }, { status: 400 });

    let company = '';
    let role = '';

    // 1. Jina AI reader — renders JS pages, returns clean markdown
    const jinaResult = await tryJina(url);
    if (jinaResult.company) company = jinaResult.company;
    if (jinaResult.role) role = jinaResult.role;

    // 2. Board-specific extractors (public APIs + URL patterns)
    if (!company || !role) {
      const boardResult = await tryBoardSpecific(url);
      if (!company && boardResult.company) company = boardResult.company;
      if (!role && boardResult.role) role = boardResult.role;
    }

    // 3. Fallback: direct fetch + cheerio (JSON-LD, og:title, page title)
    if (!company || !role) {
      const htmlResult = await tryCheerio(url, company, role);
      if (!company) company = htmlResult.company;
      if (!role) role = htmlResult.role;
    }

    company = cleanCompany(company, url);
    role = cleanRole(role);

    if (!company && !role) {
      return NextResponse.json(
        { error: 'Could not extract job details from this page. Please fill in manually.' },
        { status: 422 }
      );
    }

    return NextResponse.json({ company, role, category: guessCategory(role, url) });

  } catch (error: any) {
    console.error('Job scraping failed:', error.message);
    return NextResponse.json({ error: 'Failed to extract job details' }, { status: 500 });
  }
}

// ─── Jina AI reader ───────────────────────────────────────────────────────────

async function tryJina(url: string): Promise<{ company: string; role: string }> {
  try {
    const res = await fetch(`https://r.jina.ai/${url}`, {
      headers: { 'Accept': 'text/plain', 'X-Return-Format': 'text' },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return { company: '', role: '' };
    const text = await res.text();

    const titleMatch = text.match(/^Title:\s*(.+)$/m);
    const titleLine = titleMatch?.[1]?.trim() || '';

    let company = '';
    let role = '';

    const seps = [' at ', ' @ ', ' — ', ' - ', ' | '];
    for (const sep of seps) {
      const idx = titleLine.toLowerCase().indexOf(sep.toLowerCase());
      if (idx !== -1) {
        role = titleLine.slice(0, idx).trim();
        company = titleLine.slice(idx + sep.length).trim();
        break;
      }
    }
    if (!role) role = titleLine;

    if (!company) {
      const body = text.slice(0, 3000);
      const m = body.match(/(?:Company|Employer|Organisation|Organization|Hiring company)[:\s]+([^\n]+)/i);
      if (m) company = m[1].trim();
    }

    return { company, role };
  } catch {
    return { company: '', role: '' };
  }
}

// ─── Board-specific parsers ───────────────────────────────────────────────────

async function tryBoardSpecific(url: string): Promise<{ company: string; role: string }> {
  try {
    const u = new URL(url);
    const host = u.hostname;
    const path = u.pathname;

    // Greenhouse: boards.greenhouse.io/{company}/jobs/{jobId}
    // or {company}.greenhouse.io/jobs/{jobId}
    if (host.includes('greenhouse.io')) {
      const match = host.includes('boards.greenhouse.io')
        ? path.match(/^\/([^/]+)\/jobs\/(\d+)/)
        : path.match(/^\/jobs\/(\d+)/);

      let companySlug = '';
      let jobId = '';

      if (host.includes('boards.greenhouse.io') && match) {
        companySlug = match[1];
        jobId = match[2];
      } else if (!host.includes('boards.greenhouse.io') && match) {
        companySlug = host.split('.')[0];
        jobId = match[1];
      }

      if (companySlug && jobId) {
        const res = await fetch(
          `https://boards-api.greenhouse.io/v1/boards/${companySlug}/jobs/${jobId}`,
          { signal: AbortSignal.timeout(6000) }
        );
        if (res.ok) {
          const data = await res.json();
          return {
            role: data.title || '',
            company: data.company?.name || slugToName(companySlug),
          };
        }
        // API failed — still extract company from slug
        return { company: slugToName(companySlug), role: '' };
      }
    }

    // Lever: jobs.lever.co/{company}/{jobId}
    if (host === 'jobs.lever.co') {
      const match = path.match(/^\/([^/]+)\/([^/]+)/);
      if (match) {
        const companySlug = match[1];
        const jobId = match[2];
        const res = await fetch(
          `https://api.lever.co/v0/postings/${companySlug}/${jobId}`,
          { signal: AbortSignal.timeout(6000) }
        );
        if (res.ok) {
          const data = await res.json();
          return {
            role: data.text || '',
            company: data.company || slugToName(companySlug),
          };
        }
        return { company: slugToName(companySlug), role: '' };
      }
    }

    // Workday: {company}.myworkdayjobs.com/...
    if (host.includes('myworkdayjobs.com')) {
      return { company: slugToName(host.split('.')[0]), role: '' };
    }

    // Ashby: jobs.ashbyhq.com/{company}/{jobId}
    if (host === 'jobs.ashbyhq.com') {
      const match = path.match(/^\/([^/]+)/);
      if (match) return { company: slugToName(match[1]), role: '' };
    }

    // Rippling: ats.rippling.com/jobs/{company}/...
    if (host === 'ats.rippling.com') {
      const match = path.match(/^\/jobs\/([^/]+)/);
      if (match) return { company: slugToName(match[1]), role: '' };
    }

    // SmartRecruiters: jobs.smartrecruiters.com/{Company}/...
    if (host === 'jobs.smartrecruiters.com') {
      const match = path.match(/^\/([^/]+)/);
      if (match) return { company: slugToName(match[1]), role: '' };
    }

    // LinkedIn: og:title is "Role at Company | LinkedIn" — handled by cheerio
    // Indeed: og:title is "Role - Company - Location | Indeed" — handled by cheerio
  } catch {}

  return { company: '', role: '' };
}

// ─── Cheerio HTML scraper ─────────────────────────────────────────────────────

async function tryCheerio(
  url: string,
  existingCompany: string,
  existingRole: string
): Promise<{ company: string; role: string }> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return { company: '', role: '' };
    const html = await res.text();
    const $ = cheerio.load(html);

    let company = existingCompany;
    let role = existingRole;

    // JSON-LD structured data (JobPosting schema)
    $('script[type="application/ld+json"]').each((_, el) => {
      if (company && role) return;
      try {
        const json = JSON.parse($(el).html() || '{}');
        const entries = Array.isArray(json) ? json : [json];
        for (const entry of entries) {
          if (entry['@type'] === 'JobPosting' || entry['@type'] === 'Job') {
            if (!role) role = entry.title || entry.name || '';
            if (!company) company = entry.hiringOrganization?.name || entry.employer?.name || '';
          }
        }
      } catch {}
    });

    // og:title / page title
    if (!role || !company) {
      const ogTitle = $('meta[property="og:title"]').attr('content') || '';
      const ogSiteName = $('meta[property="og:site_name"]').attr('content') || '';
      const pageTitle = $('title').text() || '';
      const parseStr = ogTitle || pageTitle;

      const aggregators = ['linkedin', 'indeed', 'glassdoor', 'ziprecruiter', 'handshake'];
      const host = new URL(url).hostname;
      const isAggregator = aggregators.some(a => host.includes(a));

      if (!company && ogSiteName && !isAggregator) company = ogSiteName;

      // Split title on common separators: "Role at Company | Site" or "Role - Company"
      // For LinkedIn: "Software Engineer at Stripe | LinkedIn" → role="Software Engineer", company="Stripe"
      // For Indeed: "Software Engineer - Stripe - Remote | Indeed" → role="Software Engineer", company="Stripe"
      if (!role || !company) {
        // Strip trailing " | Site" first
        const stripped = parseStr.replace(/\s*\|\s*\w[\w\s]*$/, '').trim();

        const separators = [' at ', ' @ ', ' — '];
        for (const sep of separators) {
          const idx = stripped.toLowerCase().indexOf(sep.toLowerCase());
          if (idx !== -1) {
            if (!role) role = stripped.slice(0, idx).trim();
            if (!company) company = stripped.slice(idx + sep.length).trim();
            break;
          }
        }

        // Dash separator: split on first " - " (Indeed style: "Role - Company - Location")
        if ((!role || !company) && stripped.includes(' - ')) {
          const parts = stripped.split(' - ');
          if (!role && parts[0]) role = parts[0].trim();
          if (!company && parts[1]) company = parts[1].trim();
        }

        if (!role) role = stripped || parseStr;
      }
    }

    return { company, role };
  } catch {
    return { company: '', role: '' };
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Convert a URL slug like "stripe-inc" → "Stripe Inc" */
function slugToName(slug: string): string {
  return slug
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim();
}

function cleanCompany(company: string, url: string): string {
  if (!company) return '';
  company = company
    .replace(/\s*[|\-–—]\s*(LinkedIn|Indeed|Glassdoor|Handshake|Greenhouse|Lever|Workday|SmartRecruiters|Rippling|Ashby).*/i, '')
    .replace(/\s*(Careers|Jobs|Hiring|Job Board|Talent)\s*$/gi, '')
    .trim();

  // Workday fallback from subdomain
  if (!company || company.length > 50) {
    try {
      const host = new URL(url).hostname;
      if (host.includes('myworkdayjobs')) {
        return slugToName(host.split('.')[0]);
      }
    } catch {}
  }

  return company.trim();
}

function cleanRole(role: string): string {
  return role
    .replace(/\s*\(.*?\)\s*/g, '')
    .replace(/\s*[-–]\s*(Remote|Hybrid|On-?site|Contract|Full.?time|Part.?time).*/i, '')
    .trim();
}

function guessCategory(role: string, url: string): string {
  const s = (role + ' ' + url).toLowerCase();
  if (s.match(/software|engineer|developer|backend|frontend|fullstack|devops|mobile|ios|android/)) return 'Engineering';
  if (s.match(/product manager|product management|\bpm\b/)) return 'Product Management';
  if (s.match(/design|ux\b|ui\b|user experience/)) return 'Design';
  if (s.match(/data science|machine learning|\bml\b|\bai\b|analyst/)) return 'Data Science';
  if (s.match(/finance|investment|quant|banking|accounting/)) return 'Finance';
  if (s.match(/marketing|growth|seo|content/)) return 'Marketing';
  if (s.match(/operations|\bops\b|supply chain|logistics/)) return 'Operations';
  return '';
}
