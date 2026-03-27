import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

type ParseResult = { company: string; role: string; location: string };

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    if (!url) return NextResponse.json({ error: 'URL is required' }, { status: 400 });

    let company = '';
    let role = '';
    let location = '';

    // 1. Board-specific extractors — public APIs + URL slug (most accurate)
    const boardResult = await tryBoardSpecific(url);
    if (boardResult.company) company = boardResult.company;
    if (boardResult.role) role = boardResult.role;
    if (boardResult.location) location = boardResult.location;

    // 2. Fallback: direct fetch + cheerio (JSON-LD, og:title, page title)
    if (!company || !role) {
      const htmlResult = await tryCheerio(url, company, role);
      if (!company) company = htmlResult.company;
      if (!role) role = htmlResult.role;
      if (!location) location = htmlResult.location;
    }

    company = cleanCompany(company, url);
    role = cleanRole(role);
    location = cleanLocation(location);

    if (!company && !role) {
      return NextResponse.json(
        { error: 'Could not extract job details from this page. Please fill in manually.' },
        { status: 422 }
      );
    }

    return NextResponse.json({ company, role, location, category: guessCategory(role, url) });

  } catch (error: any) {
    console.error('Job scraping failed:', error.message);
    return NextResponse.json({ error: 'Failed to extract job details' }, { status: 500 });
  }
}

// ─── Board-specific parsers ───────────────────────────────────────────────────

async function tryBoardSpecific(url: string): Promise<ParseResult> {
  const empty: ParseResult = { company: '', role: '', location: '' };
  try {
    const u = new URL(url);
    const host = u.hostname;
    const path = u.pathname;

    // Greenhouse: boards.greenhouse.io/{company}/jobs/{jobId}
    if (host.includes('greenhouse.io')) {
      const match = host.includes('boards.greenhouse.io')
        ? path.match(/^\/([^/]+)\/jobs\/(\d+)/)
        : path.match(/^\/jobs\/(\d+)/);

      let companySlug = '';
      let jobId = '';

      if (host.includes('boards.greenhouse.io') && match) {
        companySlug = match[1]; jobId = match[2];
      } else if (!host.includes('boards.greenhouse.io') && match) {
        companySlug = host.split('.')[0]; jobId = match[1];
      }

      if (companySlug && jobId) {
        const res = await fetch(
          `https://boards-api.greenhouse.io/v1/boards/${companySlug}/jobs/${jobId}`,
          { signal: AbortSignal.timeout(6000) }
        );
        if (res.ok) {
          const data = await res.json();
          const loc = data.location?.name || '';
          return {
            role: data.title || '',
            company: data.company?.name || slugToName(companySlug),
            location: loc,
          };
        }
        return { ...empty, company: slugToName(companySlug) };
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
            location: data.categories?.location || data.workplaceType || '',
          };
        }
        return { ...empty, company: slugToName(companySlug) };
      }
    }

    // Workday
    if (host.includes('myworkdayjobs.com')) {
      return { ...empty, company: slugToName(host.split('.')[0]) };
    }

    // Ashby
    if (host === 'jobs.ashbyhq.com') {
      const match = path.match(/^\/([^/]+)/);
      if (match) return { ...empty, company: slugToName(match[1]) };
    }

    // Rippling
    if (host === 'ats.rippling.com') {
      const match = path.match(/^\/jobs\/([^/]+)/);
      if (match) return { ...empty, company: slugToName(match[1]) };
    }

    // SmartRecruiters
    if (host === 'jobs.smartrecruiters.com') {
      const match = path.match(/^\/([^/]+)/);
      if (match) return { ...empty, company: slugToName(match[1]) };
    }
  } catch {}

  return empty;
}

// ─── Cheerio HTML scraper ─────────────────────────────────────────────────────

async function tryCheerio(
  url: string,
  existingCompany: string,
  existingRole: string
): Promise<ParseResult> {
  const empty: ParseResult = { company: '', role: '', location: '' };
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return empty;
    const html = await res.text();
    const $ = cheerio.load(html);

    let company = existingCompany;
    let role = existingRole;
    let location = '';

    // JSON-LD structured data (JobPosting schema)
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const json = JSON.parse($(el).html() || '{}');
        const entries = Array.isArray(json) ? json : [json];
        for (const entry of entries) {
          if (entry['@type'] === 'JobPosting' || entry['@type'] === 'Job') {
            if (!role) role = entry.title || entry.name || '';
            if (!company) company = entry.hiringOrganization?.name || entry.employer?.name || '';
            if (!location) {
              const loc = entry.jobLocation;
              if (Array.isArray(loc)) {
                location = loc[0]?.address?.addressLocality || loc[0]?.name || '';
              } else {
                location = loc?.address?.addressLocality || loc?.name || '';
              }
            }
          }
        }
      } catch {}
    });

    // og:title / page title + og:site_name for company
    const ogTitle = $('meta[property="og:title"]').attr('content') || '';
    const ogSiteName = $('meta[property="og:site_name"]').attr('content') || '';
    const pageTitle = $('title').text() || '';

    const host = new URL(url).hostname;
    const aggregators = ['linkedin', 'indeed', 'glassdoor', 'ziprecruiter', 'handshake'];
    const isAggregator = aggregators.some(a => host.includes(a));

    // og:site_name is reliable for company career portals (e.g. Goldman Sachs)
    if (!company && ogSiteName && !isAggregator) company = ogSiteName;

    if (!role || !company) {
      const parseStr = ogTitle || pageTitle;
      // Strip trailing " | SiteName"
      const stripped = parseStr.replace(/\s*\|\s*[\w][\w\s]*$/, '').trim();

      // If title has 3+ pipe segments (e.g. "2026 | Americas | NYC | Role"),
      // take the last segment as the role
      const pipeParts = stripped.split(/\s*\|\s*/);
      if (pipeParts.length >= 3) {
        if (!role) role = pipeParts[pipeParts.length - 1].trim();
      } else {
        const seps = [' at ', ' @ ', ' — '];
        for (const sep of seps) {
          const idx = stripped.toLowerCase().indexOf(sep.toLowerCase());
          if (idx !== -1) {
            if (!role) role = stripped.slice(0, idx).trim();
            if (!company) company = stripped.slice(idx + sep.length).trim();
            break;
          }
        }
        if ((!role || !company) && stripped.includes(' - ')) {
          const parts = stripped.split(' - ');
          if (!role && parts[0]) role = parts[0].trim();
          if (!company && parts[1]) company = parts[1].trim();
        }
        if (!role) role = stripped || parseStr;
      }
    }

    return { company, role, location };
  } catch {
    return empty;
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function slugToName(slug: string): string {
  return slug.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim();
}

function cleanCompany(company: string, url: string): string {
  if (!company) return '';
  company = company
    .replace(/\s*[|\-–—]\s*(LinkedIn|Indeed|Glassdoor|Handshake|Greenhouse|Lever|Workday|SmartRecruiters|Rippling|Ashby).*/i, '')
    .replace(/\s*(Careers|Jobs|Hiring|Job Board|Talent)\s*$/gi, '')
    .trim();

  if (!company || company.length > 50) {
    try {
      const host = new URL(url).hostname;
      if (host.includes('myworkdayjobs')) return slugToName(host.split('.')[0]);
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

function cleanLocation(location: string): string {
  return location
    .replace(/\s*,?\s*(United States|USA|US)$/i, '')
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
