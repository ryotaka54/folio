import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Attempt to fetch the HTML
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      // Give it a timeout to not hang
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL. Status: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extraction heuristics
    const pageTitle = $('title').text() || '';
    const ogTitle = $('meta[property="og:title"]').attr('content') || '';
    const ogSiteName = $('meta[property="og:site_name"]').attr('content') || '';

    // Standard job board titles usually look like "Software Engineer Intern at Google"
    // or "Google | Software Engineer"
    const parseString = ogTitle || pageTitle;
    
    let company = ogSiteName;
    let role = '';

    // If company isn't in ogSiteName, try to split the title
    if (parseString) {
      const separators = [' - ', ' | ', ' at ', ' @ '];
      for (const sep of separators) {
        if (parseString.toLowerCase().includes(sep.trim().toLowerCase())) {
          const parts = parseString.split(new RegExp(sep, 'i')).map(s => s.trim());
          if (parts.length >= 2) {
            // Usually the shorter part is the company, or the last part is company
            role = parts[0];
            if (!company) company = parts[parts.length - 1];
            break;
          }
        }
      }

      // Fallback: If no separator was found, entire title is role
      if (!role && !company) {
        role = parseString;
      }
    }

    // Clean up typical appending strings
    if (company) {
      company = company.replace(/Careers|Jobs|Hiring/ig, '').trim();
    }
    
    // Guess Category based on keywords
    let category = '';
    const normalizeSearch = (role + ' ' + url).toLowerCase();
    if (normalizeSearch.includes('software') || normalizeSearch.includes('engineer') || normalizeSearch.includes('developer') || normalizeSearch.includes('data')) {
      category = 'Engineering';
    } else if (normalizeSearch.includes('product') || normalizeSearch.includes('pm')) {
      category = 'Product';
    } else if (normalizeSearch.includes('design') || normalizeSearch.includes('ux')) {
      category = 'Design';
    } else if (normalizeSearch.includes('finance') || normalizeSearch.includes('investment') || normalizeSearch.includes('quant')) {
      category = 'Finance';
    }

    if (!company && !role) {
      return NextResponse.json(
        { error: 'Could not extract job details from this page. Please fill in manually.' },
        { status: 422 }
      );
    }

    return NextResponse.json({
      company: company || '',
      role: role || '',
      category: category || '',
    });

  } catch (error: any) {
    console.error('Job scraping failed:', error.message);
    return NextResponse.json({ error: 'Failed to extract job details' }, { status: 500 });
  }
}
