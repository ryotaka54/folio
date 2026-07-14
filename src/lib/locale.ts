export type Locale = 'en' | 'ja';

/**
 * Prefixes a canonical (EN-rooted) path with /ja for the ja locale.
 * localeHref('ja', '/') -> '/ja', localeHref('ja', '/help') -> '/ja/help'
 */
export function localeHref(locale: Locale, path: string): string {
  if (locale === 'en') return path;
  return path === '/' ? '/ja' : `/ja${path}`;
}
