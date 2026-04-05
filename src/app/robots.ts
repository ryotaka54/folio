import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard', '/onboarding', '/settings', '/admin', '/api/'],
      },
    ],
    sitemap: 'https://useapplyd.com/sitemap.xml',
    host: 'https://useapplyd.com',
  };
}
