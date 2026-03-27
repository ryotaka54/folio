import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    let company = '';
    let role = '';

    // 1. JSON-LD structured data — most reliable source on modern job boards
    $('script[type="application/ld+json"]').each((_, el) => {
      if (company && role) return;
      try {
        const json = JSON.parse($(el).html() || '{}');
        const entries = Array.isArray(json) ? json : [json];
        for (const entry of entries) {
          const type = entry['@type'];
          if (type === 'JobPosting' || type === 'Job') {
            if (!role) role = entry.title || entry.name || '';
            if (!company) {
              company = entry.hiringOrganization?.name
                || entry.hiringOrganization?.['@name']
                || entry.employer?.name
                || '';
            }
          }
        }
      } catch {}
    });

    // 2. Common DOM selectors used by major job boards
    if (!company) {
      company =
        // Greenhouse
        $('[class*="company-name"]').first().text().trim() ||
        $('[data-qa="employer-name"]').first().text().trim() ||
        // Lever
        $('.main-header-logo img').attr('alt')?.trim() ||
        // Workday — extract from subdomain
        (() => {
          try {
            const host = new URL(url).hostname; // e.g. google.wd1.myworkdayjobs.com
            if (host.includes('myworkdayjobs')) {
              return host.split('.')[0].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            }
          } catch {}
          return '';
        })() ||
        // Ashby / Lever — extract from URL path
        (() => {
          try {
            const host = new URL(url).hostname;
            const path = new URL(url).pathname;
            if (host.includes('ashbyhq') || host.includes('lever.co')) {
              const seg = path.split('/').filter(Boolean)[0];
              return seg ? seg.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '';
            }
          } catch {}
          return '';
        })() ||
        '';
    }

    if (!role) {
      role =
        $('h1.posting-headline').first().text().trim() ||
        $('[data-qa="posting-name"]').first().text().trim() ||
        $('[data-automation-id="jobPostingHeader"]').first().text().trim() ||
        $('h1[class*="job-title"]').first().text().trim() ||
        $('h1[class*="title"]').first().text().trim() ||
        '';
    }

    // 3. og:title / page title fallback — split on common separators
    if (!role || !company) {
      const ogTitle = $('meta[property="og:title"]').attr('content') || '';
      const ogSiteName = $('meta[property="og:site_name"]').attr('content') || '';
      const pageTitle = $('title').text() || '';
      const parseStr = ogTitle || pageTitle;

      // og:site_name is often the company (but skip generic aggregators)
      const aggregators = ['linkedin', 'indeed', 'glassdoor', 'ziprecruiter', 'monster'];
      const isAggregator = aggregators.some(a => (new URL(url).hostname).includes(a));
      if (!company && ogSiteName && !isAggregator) {
        company = ogSiteName;
      }

      if (parseStr && (!role || !company)) {
        const separators = [' at ', ' @ ', ' - ', ' | ', ' — '];
        for (const sep of separators) {
          const idx = parseStr.toLowerCase().indexOf(sep.toLowerCase());
          if (idx !== -1) {
            const before = parseStr.slice(0, idx).trim();
            const after = parseStr.slice(idx + sep.length).trim();
            if (!role && before) role = before;
            if (!company && after) company = after;
            break;
          }
        }
        if (!role) role = parseStr;
      }
    }

    // Clean up
    company = company.replace(/\s*(Careers|Jobs|Hiring|Job Board|Talent)\s*/gi, '').trim();
    role = role.replace(/\s*\(.*?\)\s*/g, '').replace(/\s*-\s*(Remote|Hybrid|On-?site).*$/i, '').trim();

    if (!company && !role) {
      return NextResponse.json(
        { error: 'Could not extract job details from this page. Please fill in manually.' },
        { status: 422 }
      );
    }

    // Guess category
    let category = '';
    const search = (role + ' ' + url).toLowerCase();
    if (search.match(/software|engineer|developer|backend|frontend|fullstack|devops|mobile|ios|android/)) {
      category = 'Engineering';
    } else if (search.match(/product manager|product management|\bpm\b/)) {
      category = 'Product Management';
    } else if (search.match(/design|ux|ui\b|user experience/)) {
      category = 'Design';
    } else if (search.match(/data science|machine learning|ml\b|ai\b|analyst/)) {
      category = 'Data Science';
    } else if (search.match(/finance|investment|quant|banking|accounting/)) {
      category = 'Finance';
    } else if (search.match(/marketing|growth|seo|content/)) {
      category = 'Marketing';
    } else if (search.match(/operations|ops\b|supply chain|logistics/)) {
      category = 'Operations';
    }

    return NextResponse.json({ company, role, category });

  } catch (error: any) {
    console.error('Job scraping failed:', error.message);
    return NextResponse.json({ error: 'Failed to extract job details' }, { status: 500 });
  }
}
