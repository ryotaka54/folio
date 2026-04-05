import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://useapplyd.com';
  const now = new Date();

  return [
    { url: base,                    lastModified: now, changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${base}/community`,     lastModified: now, changeFrequency: 'daily',   priority: 0.9 },
    { url: `${base}/calendar`,      lastModified: now, changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${base}/help`,          lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/contact`,       lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${base}/privacy`,       lastModified: now, changeFrequency: 'yearly',  priority: 0.2 },
  ];
}
