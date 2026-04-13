import { NextRequest, NextResponse } from 'next/server';

const JA_PATHS = ['/ja'];
const COOKIE = 'preferred_language';

// Paths that should never be redirected
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
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Never touch API routes, static files, etc.
  if (BYPASS.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const isJaPath = pathname.startsWith('/ja');

  // 1. Explicit cookie preference always wins
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

  // 2. No cookie yet — use IP country (Vercel sets x-vercel-ip-country)
  if (!cookiePref) {
    const country = request.headers.get('x-vercel-ip-country') ?? '';
    if (country === 'JP' && !isJaPath) {
      const url = request.nextUrl.clone();
      url.pathname = '/ja' + (pathname === '/' ? '' : pathname);
      const res = NextResponse.redirect(url);
      // Set cookie so we don't re-detect on every request
      res.cookies.set(COOKIE, 'ja', {
        path: '/',
        maxAge: 60 * 60 * 24 * 365, // 1 year
        sameSite: 'lax',
      });
      return res;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
