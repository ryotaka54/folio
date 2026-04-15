import { NextRequest, NextResponse } from 'next/server';

const COOKIE = 'locale_preference';

// Paths that should never be redirected (no Japanese equivalents exist)
const BYPASS = [
  '/api/',
  '/_next/',
  '/favicon',
  '/icons/',
  '/manifest',
  '/offline',
  '/robots',
  '/sitemap',
  '/ingest/',
  '/forgot-password',
  '/reset-password',
  '/settings',
  '/calendar',
  '/community',
  '/help',
  '/contact',
  '/demo',
  '/install',
  '/admin',
  '/interview',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Never touch API routes, static files, etc.
  if (BYPASS.some(p => pathname.startsWith(p))) {
    // Still stamp an 'en' cookie if no preference has been set yet,
    // so English-first users are never later redirected to /ja
    if (!request.cookies.get(COOKIE)?.value && !pathname.startsWith('/ja')) {
      const res = NextResponse.next();
      res.cookies.set(COOKIE, 'en', { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' });
      return res;
    }
    return NextResponse.next();
  }

  const isJaPath = pathname.startsWith('/ja');

  // ── 1. Explicit cookie preference always wins ─────────────────────────────
  const cookiePref = request.cookies.get(COOKIE)?.value;

  if (cookiePref === 'ja' && !isJaPath) {
    const url = request.nextUrl.clone();
    url.pathname = '/ja' + (pathname === '/' ? '' : pathname);
    return NextResponse.redirect(url);
  }
  if (cookiePref === 'en' && isJaPath) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.replace(/^\/ja/, '') || '/';
    return NextResponse.redirect(url);
  }

  // If cookie is already set, respect it and move on
  if (cookiePref) {
    return NextResponse.next();
  }

  // ── 2. Direct navigation to /ja — respect it, set cookie ─────────────────
  if (isJaPath) {
    const res = NextResponse.next();
    res.cookies.set(COOKIE, 'ja', {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    });
    return res;
  }

  // ── 3. No cookie, not /ja — detect country via Vercel header or ipapi.co ──
  const vercelCountry = request.headers.get('x-vercel-ip-country');

  let country: string | null = vercelCountry;

  // Fallback to ipapi.co if Vercel header not present (e.g. local dev)
  if (!country) {
    try {
      const ip =
        request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
        request.headers.get('x-real-ip') ||
        '';
      if (ip && ip !== '::1' && ip !== '127.0.0.1') {
        const res = await fetch(`https://ipapi.co/${ip}/json/`, {
          signal: AbortSignal.timeout(2000),
        });
        if (res.ok) {
          const data = await res.json() as { country_code?: string };
          country = data.country_code ?? null;
        }
      }
    } catch {
      // ipapi.co failed — default to English, never break the user experience
      country = null;
    }
  }

  if (country === 'JP') {
    const url = request.nextUrl.clone();
    url.pathname = '/ja' + (pathname === '/' ? '' : pathname);
    const redirectRes = NextResponse.redirect(url);
    redirectRes.cookies.set(COOKIE, 'ja', {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    });
    return redirectRes;
  }

  // Non-JP first visit — set en cookie and serve
  const res = NextResponse.next();
  res.cookies.set(COOKIE, 'en', {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  });
  return res;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
